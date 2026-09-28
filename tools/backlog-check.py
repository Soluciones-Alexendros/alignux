#!/usr/bin/env python3
"""ALIGNUX — verificador de backlog.

Comprueba contra la API de GitHub (vía `gh`) que los issues de tarea cumplen las
reglas de DoR del doc 05 y las de integridad del backlog (Misión 3.1):

  (a) Criterio de aceptación no vacío.
  (b) Cada dependencia de tipo tarea (T/S/V/CI/P-xx) o gate (Gx) referencia un
      issue existente.
  (c) Sin ciclos en el grafo de dependencias entre tareas.
  (d) Un issue marcado "in progress" (label `estado:in-progress`) tiene una
      especificación enlazada (no "—").

Salida: 0 = OK, 1 = hay violaciones, 2 = error de uso/API.

Uso:
  python3 tools/backlog-check.py [--repo owner/name] [--state all|open]
"""
import argparse
import json
import re
import subprocess
import sys

TASK_RE = re.compile(r"^\[(T\d-\d{2}|S-\d{2}|V-\d{2}|CI-\d{2}|P-\d{2})\]")
GATE_RE = re.compile(r"^\[G(\d)\]")
TASK_ID_RE = re.compile(r"^(T\d-\d{2}|S-\d{2}|V-\d{2}|CI-\d{2}|P-\d{2})$")
GATE_ID_RE = re.compile(r"^G\d$")
IN_PROGRESS_LABEL = "estado:in-progress"


def gh(*args):
    out = subprocess.run(["gh", *args], capture_output=True, text=True)
    if out.returncode != 0:
        raise RuntimeError(f"gh {' '.join(args)}: {out.stderr.strip()}")
    return out.stdout


def fetch_issues(repo, state):
    raw = gh(
        "issue",
        "list",
        "--repo",
        repo,
        "--state",
        state,
        "--limit",
        "1000",
        "--json",
        "number,title,body,labels",
    )
    issues = []
    for item in json.loads(raw):
        issues.append(
            {
                "number": item["number"],
                "title": item["title"],
                "body": item["body"],
                "labels": [l["name"] for l in item.get("labels", [])],
            }
        )
    return issues


def section(body, name):
    m = re.search(
        rf"## {re.escape(name)}(?:\s*\([^)]*\))?\s*\n(.*?)(?=\n## |\Z)", body, re.S
    )
    if not m:
        return None
    return m.group(1).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="Soluciones-Alexendros/alignux")
    ap.add_argument("--state", default="open")
    args = ap.parse_args()

    issues = fetch_issues(args.repo, args.state)
    if not issues:
        print("No se encontraron issues (¿API vacía?).")
        return 2

    by_id = {}
    gates = {}
    for i in issues:
        tm = TASK_RE.match(i["title"])
        if tm:
            by_id[tm.group(1)] = i["number"]
        gm = GATE_RE.match(i["title"])
        if gm:
            gates[f"G{gm.group(1)}"] = i["number"]

    problems = []

    def dep_tokens(deps_text):
        tokens = re.split(r"[,\n]", deps_text)
        result = []
        for t in tokens:
            t = t.strip().lstrip("-").strip()
            if not t:
                continue
            result.append(t)
        return result

    for i in issues:
        m = TASK_RE.match(i["title"])
        if not m:
            continue
        tid = m.group(1)
        body = i["body"] or ""

        # (a) criterio no vacío (spec usa la plantilla de 7 secciones: "Criterios de verificación")
        is_spec = tid.startswith("S-")
        crit_header = "Criterios de verificación" if is_spec else "Criterio de aceptación"
        crit = section(body, crit_header)
        if crit is None or crit in ("", "—"):
            problems.append(f"(a) #{i['number']} {tid}: {crit_header} vacío o ausente")

        # (b) dependencias referencian issues existentes
        deps = section(body, "Dependencias")
        if deps and deps not in ("", "—"):
            for tok in dep_tokens(deps):
                if TASK_ID_RE.match(tok) and tok not in by_id:
                    problems.append(f"(b) #{i['number']} {tid}: dependencia '{tok}' no es un issue existente")
                elif GATE_ID_RE.match(tok) and tok not in gates:
                    problems.append(f"(b) #{i['number']} {tid}: gate '{tok}' no es un issue existente")
                elif not (TASK_ID_RE.match(tok) or GATE_ID_RE.match(tok)):
                    # texto no-ID (milestones, rangos "M1–M2"): permitido
                    pass

        # (d) in-progress debe tener spec
        labels = i.get("labels", [])
        if IN_PROGRESS_LABEL in labels:
            spec = section(body, "Spec que la cubre")
            if spec is None or spec in ("", "—"):
                problems.append(f"(d) #{i['number']} {tid}: in-progress sin spec enlazada")

    # (c) sin ciclos en grafo de tareas
    deps_graph = {}
    for i in issues:
        m = TASK_RE.match(i["title"])
        if not m:
            continue
        tid = m.group(1)
        deps = section(i["body"] or "", "Dependencias")
        deps_graph[tid] = []
        if deps and deps not in ("", "—"):
            for tok in dep_tokens(deps):
                if TASK_ID_RE.match(tok) and tok in by_id:
                    deps_graph[tid].append(tok)

    # DFS detección de ciclos
    color = {}

    def visit(n, path):
        color[n] = "gris"
        for d in deps_graph.get(n, []):
            if color.get(d) == "gris":
                problems.append(f"(c) ciclo de dependencias: {' -> '.join(path + [d])}")
                continue
            if color.get(d) != "negro":
                visit(d, path + [d])
        color[n] = "negro"

    for n in deps_graph:
        if color.get(n) is None:
            visit(n, [n])

    print(f"Issues analizados: {len(issues)}  (tareas: {len(by_id)}, gates: {len(gates)})")
    if problems:
        print(f"VIOLACIONES: {len(problems)}")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("Backlog OK: criterios no vacíos, dependencias válidas, sin ciclos, in-progress con spec.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
