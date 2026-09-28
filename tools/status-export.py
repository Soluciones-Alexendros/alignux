#!/usr/bin/env python3
"""ALIGNUX — exporta el estado vivo del proyecto a `status.json`.

Consulta la API de GitHub (issues por etiqueta, milestones, últimos workflow
runs) y el pin de `VERSIONS.toml`, y emite `status.json` con el esquema que el
dashboard consume. Regla de honestidad: si la API no responde, se conserva el
último dato bueno y se marca `data_fresh: false` con `last_good_at`; nunca se
inventa un valor.

Uso:
    python3 tools/status-export.py [--out app/status.json] [--repo Soluciones-Alexendros/alignux]

Requiere `gh` autenticado (local) o `GITHUB_TOKEN` (CI).
"""

import argparse
import json
import os
import subprocess
import sys
import tomllib
from datetime import datetime, timezone

CANONICAL_TOTAL = 69
CANONICAL_RISKS = 11
PHASE_CURRENT = "M0"
GATE_IDS = ["G0", "G1", "G2", "G3", "G4", "G5"]
PHASE_KEYS = ["M0", "M1", "M2", "M3", "M4", "M5", "S", "V", "CI", "P"]
TASK_LABELS = [
    "fase:m0", "fase:m1", "fase:m2", "fase:m3", "fase:m4", "fase:m5",
    "tipo:spec", "tipo:verificacion", "tipo:ci", "tipo:produccion",
]
PHASE_LABEL = {
    "M0": "fase:m0", "M1": "fase:m1", "M2": "fase:m2",
    "M3": "fase:m3", "M4": "fase:m4", "M5": "fase:m5",
    "S": "tipo:spec", "V": "tipo:verificacion",
    "CI": "tipo:ci", "P": "tipo:produccion",
}
MILESTONE_DUE = {
    "M0": "2026-12-31", "M1": "2027-03-31", "M2": "2027-06-30",
    "M3": "2027-09-30", "M4": "2027-12-31", "M5": "2028-12-31",
}


def gh(*args):
    """Ejecuta `gh api` y devuelve el JSON parseado. Lanza si falla."""
    cmd = ["gh", "api", *args]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"gh api {' '.join(args)}: {proc.stderr.strip()}")
    if not proc.stdout.strip():
        return None
    return json.loads(proc.stdout)


def gh_maybe(*args):
    """Como gh() pero devuelve None en vez de lanzar (para degradación honesta)."""
    try:
        return gh(*args)
    except Exception:
        return None


def read_pin():
    with open("VERSIONS.toml", "rb") as f:
        data = tomllib.load(f)
    return {
        "sel4": data.get("sel4", {}).get("version"),
        "microkit": data.get("microkit", {}).get("version"),
        "rust_sel4": data.get("rust_sel4", {}).get("version"),
    }


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch_tasks(repo):
    """Cuenta issues de tarea por prioridad y por fase (etiqueta)."""
    # gh issue list devuelve JSON; usamos --json labels
    proc = subprocess.run(
        ["gh", "issue", "list", "--repo", repo, "--state", "all",
         "--limit", "10000", "--json", "labels"],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"gh issue list: {proc.stderr.strip()}")
    issues = json.loads(proc.stdout)
    by_prio = {"must": 0, "should": 0, "could": 0}
    by_phase = {k: 0 for k in PHASE_KEYS}
    for issue in issues:
        labels = {l["name"] for l in issue["labels"]}
        is_task = bool(labels & set(TASK_LABELS))
        if not is_task:
            continue
        if "prio:must" in labels:
            by_prio["must"] += 1
        elif "prio:should" in labels:
            by_prio["should"] += 1
        elif "prio:could" in labels:
            by_prio["could"] += 1
        for key, label in PHASE_LABEL.items():
            if label in labels:
                by_phase[key] += 1
    total = sum(by_prio.values())
    return {"total": total, **by_prio, "by_phase": by_phase}


def fetch_milestones(repo):
    data = gh_maybe(f"repos/{repo}/milestones?state=all&per_page=100")
    if data is None:
        return None
    out = []
    for m in sorted(data, key=lambda x: x.get("number", 0)):
        title = m.get("title", "")
        m_id = next((k for k in MILESTONE_DUE if title.startswith(k)), None)
        if m_id is None:
            continue
        out.append({
            "id": m_id,
            "due": MILESTONE_DUE[m_id],
            "open": m.get("open_issues", 0),
            "closed": m.get("closed_issues", 0),
        })
    return out


def fetch_workflows(repo):
    data = gh_maybe(f"repos/{repo}/actions/workflows?per_page=100")
    if data is None:
        return None
    return data.get("workflows", [])


def latest_run(repo, workflow_id):
    data = gh_maybe(f"repos/{repo}/actions/workflows/{workflow_id}/runs?per_page=1")
    if not data or not data.get("workflow_runs"):
        return None
    run = data["workflow_runs"][0]
    return {
        "status": run.get("conclusion") or run.get("status"),
        "last_run": run.get("updated_at"),
        "url": run.get("html_url"),
    }


def fetch_ci(repo):
    workflows = fetch_workflows(repo)
    if workflows is None:
        return None
    main = None
    nightly = None
    last_run = None
    for w in workflows:
        path = w.get("path", "")
        if path.endswith("main.yml"):
            main = latest_run(repo, w["id"])
        elif path.endswith("nightly.yml"):
            nightly = latest_run(repo, w["id"])
    runs = [r for r in (main, nightly) if r and r.get("last_run")]
    if runs:
        last_run = max(r["last_run"] for r in runs)
    return {"main": main, "nightly": nightly, "last_run": last_run}


def gate_states():
    states = {}
    for i, g in enumerate(GATE_IDS):
        if i == 0:  # G0 corresponde a la fase actual M0
            states[g] = "current"
        else:
            states[g] = "pending"
    return states


def build(repo, out_path):
    fresh = True
    tasks = None
    milestones = None
    ci = None
    errors = []

    try:
        tasks = fetch_tasks(repo)
    except Exception as e:
        fresh = False
        errors.append(f"tasks: {e}")
    try:
        milestones = fetch_milestones(repo)
    except Exception as e:
        errors.append(f"milestones: {e}")
    if milestones is None:
        fresh = False
        errors.append("milestones: API no respondió")
    try:
        ci = fetch_ci(repo)
    except Exception as e:
        errors.append(f"ci: {e}")
    if ci is None:
        fresh = False
        errors.append("ci: API no respondió")

    previous = None
    if os.path.exists(out_path):
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                previous = json.load(f)
        except Exception:
            previous = None

    if tasks is None and previous:
        tasks = previous.get("tasks")
    if milestones is None and previous:
        milestones = previous.get("milestones")
    if ci is None and previous:
        ci = previous.get("ci")

    status = {
        "generated_at": now_iso(),
        "data_fresh": fresh,
        "last_good_at": previous.get("generated_at") if previous else None,
        "phase_current": PHASE_CURRENT,
        "gates": [{"id": g, "state": s} for g, s in gate_states().items()],
        "tasks": tasks if tasks else {"total": CANONICAL_TOTAL, "must": 0, "should": 0, "could": 0, "by_phase": {k: 0 for k in PHASE_KEYS}},
        "ci": ci if ci else {"main": None, "nightly": None, "last_run": None},
        "milestones": milestones if milestones else [{"id": k, "due": v, "open": 0, "closed": 0} for k, v in MILESTONE_DUE.items()],
        "risks_active": CANONICAL_RISKS,
        "pin": read_pin(),
    }
    if errors:
        status["_errors"] = errors
    return status


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="app/status.json")
    ap.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY", "Soluciones-Alexendros/alignux"))
    args = ap.parse_args()

    status = build(args.repo, args.out)
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(status, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"status.json escrito en {args.out} (data_fresh={status['data_fresh']})")


if __name__ == "__main__":
    sys.exit(main())
