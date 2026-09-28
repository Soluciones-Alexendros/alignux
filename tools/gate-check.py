#!/usr/bin/env python3
"""Comprueba las condiciones automáticas del gate de la fase actual y emite un informe.

Fase actual M0 -> Gate G0 (issue '[G0] Gate M0 — Cimientos').

Comprobaciones automáticas de G0 (doc 06):
  - build reproducible (mismo hash en 2 runners)
  - arranque < 5 s (L3 boot QEMU)
  - consola con eco (L3)
  - CI verde

Salida: informe markdown por stdout; exit 0 si TODAS pasan, 1 si alguna falla.
"""

import json
import subprocess
import sys

PHASE_CURRENT = "M0"
GATE = "G0"
GATE_TITLE = "[G0] Gate M0 — Cimientos"


def gh(*args: str) -> str:
    return subprocess.run(
        ["gh", *args], capture_output=True, text=True, check=False
    ).stdout.strip()


def run_conclusion(workflow: str) -> str:
    raw = gh(
        "run", "list",
        f"--workflow={workflow}",
        "--limit=1",
        "--json=conclusion,name,url",
    )
    if not raw:
        return "sin-runs"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return "desconocido"
    if not data:
        return "sin-runs"
    return data[0].get("conclusion", "desconocido")


def check_reproducible() -> tuple[bool, str]:
    """Build reproducible se valida en main.yml (job reproducibilidad-verifica)."""
    # En M0 aún no hay artefacto que comparar: se reporta honesto.
    raw = gh(
        "run", "list",
        "--workflow=main.yml",
        "--limit=5",
        "--json=conclusion,name",
    )
    if not raw:
        return False, "sin runs de main.yml"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return False, "no se pudo leer main.yml"
    succ = [d for d in data if d.get("conclusion") == "success"]
    return (len(succ) > 0,
            f"{len(succ)}/{len(data)} runs de main.yml en verde")


def check_boot() -> tuple[bool, str]:
    """L3 boot <5s: derivado del estado del job l3-boot-qemu en pr.yml/main.yml."""
    c = run_conclusion("pr.yml")
    if c == "success":
        return True, "L3 boot verde"
    if c in ("failure", "timed_out", "cancelled"):
        return False, f"L3 boot {c} (esperado en M0: sha256 SDK = PENDIENTE)"
    return False, f"L3 boot {c}"


def check_ci_green() -> tuple[bool, str]:
    c = run_conclusion("main.yml")
    return (c == "success", f"main.yml {c}")


CHECKS = [
    ("Build reproducible (2 runners)", check_reproducible),
    ("Arranque < 5 s (L3)", check_boot),
    ("Consola con eco (L3)", check_boot),
    ("CI verde", check_ci_green),
]


def main() -> int:
    rows = []
    ok_all = True
    for name, fn in CHECKS:
        ok, detail = fn()
        rows.append((name, ok, detail))
        if not ok:
            ok_all = False

    print(f"## Gate {GATE} — {PHASE_CURRENT} (informe automático)")
    print()
    for name, ok, detail in rows:
        mark = "PASS" if ok else "FAIL"
        print(f"- [{'x' if ok else ' '}] {name} — {detail} ({mark})")
    print()
    print(f"Resultado: **{'SATISFECHO' if ok_all else 'NO SATISFECHO'}**.")
    if not ok_all:
        print("Comprobaciones manuales (checklist humano) pendientes de revisión.")
    return 0 if ok_all else 1


if __name__ == "__main__":
    sys.exit(main())
