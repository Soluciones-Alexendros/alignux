#!/usr/bin/env python3
"""Valida status.json contra tools/status.schema.json (Misión 2.3).

Validador autocontenido (sin dependencias externas): comprueba claves
obligatorias, tipos y estructura de los campos críticos. Sale con 0 si el
documento es válido, 1 si no.
"""
import json
import sys


def fail(msg):
    print(f"status.json inválido: {msg}", file=sys.stderr)
    sys.exit(1)


def main():
    if len(sys.argv) != 3:
        print("uso: status-validate.py <status.json> <status.schema.json>", file=sys.stderr)
        sys.exit(2)

    with open(sys.argv[1], encoding="utf-8") as f:
        data = json.load(f)
    with open(sys.argv[2], encoding="utf-8") as f:
        schema = json.load(f)

    required = schema.get("required", [])
    for key in required:
        if key not in data:
            fail(f"falta la clave obligatoria '{key}'")

    # tipos top-level
    def expect(key, typ):
        if key in data and not isinstance(data[key], typ):
            fail(f"'{key}' debe ser {typ.__name__}")

    expect("generated_at", str)
    expect("data_fresh", bool)
    expect("phase_current", str)
    expect("risks_active", int)

    # gates: lista de {id, state}
    gates = data.get("gates")
    if not isinstance(gates, list):
        fail("'gates' debe ser lista")
    gate_ids = set()
    for g in gates:
        if not isinstance(g, dict) or "id" not in g or "state" not in g:
            fail("cada gate debe ser {id, state}")
        gate_ids.add(g["id"])
    for expected in ("G0", "G1", "G2", "G3", "G4", "G5"):
        if expected not in gate_ids:
            fail(f"falta el gate '{expected}'")

    # tasks: {total, must, should, could, by_phase}
    tasks = data.get("tasks")
    if not isinstance(tasks, dict):
        fail("'tasks' debe ser objeto")
    for k in ("total", "must", "should", "could"):
        if k not in tasks or not isinstance(tasks[k], int):
            fail(f"tasks['{k}'] debe ser entero")
    if not isinstance(tasks.get("by_phase"), dict):
        fail("tasks['by_phase'] debe ser objeto")

    # milestones: lista de {id, due, open, closed}
    milestones = data.get("milestones")
    if not isinstance(milestones, list):
        fail("'milestones' debe ser lista")
    for m in milestones:
        if not isinstance(m, dict):
            fail("cada milestone debe ser objeto")

    # ci: {main, nightly, last_run}
    ci = data.get("ci")
    if not isinstance(ci, dict):
        fail("'ci' debe ser objeto")

    # pin: {sel4, microkit, rust_sel4}
    pin = data.get("pin")
    if not isinstance(pin, dict):
        fail("'pin' debe ser objeto")
    for k in ("sel4", "microkit", "rust_sel4"):
        if k not in pin:
            fail(f"pin['{k}'] ausente")

    print("status.json válido")
    sys.exit(0)


if __name__ == "__main__":
    main()
