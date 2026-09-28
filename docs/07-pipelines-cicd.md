# ALIGNUX 2026 — Pipelines de validación (CI/CD)

> **Documento 07 de la serie ALIGNUX 2026.** Ejecuta automáticamente la cadena definida en `06-verificacion-y-cohesion.md`. Plataforma: **GitHub Actions**. Principios aplicados: *fail fast* (lo barato primero), versiones y actions fijadas por SHA, permisos mínimos, artefactos inmutables, protección de rama.

## 1. Vista de los cuatro workflows

```
PR abierta / push a rama          push a main                nightly (cron)               tag v*
        │                              │                          │                          │
        ▼                              ▼                          ▼                          ▼
┌───────────────┐            ┌─────────────────┐      ┌────────────────────┐     ┌────────────────────┐
│ pr.yml        │            │ main.yml        │      │ nightly.yml        │     │ release.yml        │
│ L0 lint/SDF   │            │ todo lo de PR + │      │ L5: fuzzing 24 h,  │     │ build reproducible │
│ L1 unitarias  │            │ L4 inyección    │      │ propiedades 1M,    │     │ ×2 runners, hash   │
│ L2 propiedades│            │ de fallos,      │      │ mutation testing,  │     │ SHA-256, firma,    │
│ L3 boot QEMU  │            │ diff autoridad, │      │ cargo-audit        │     │ SBOM, release      │
│ (smoke)       │            │ cobertura       │      │                    │     │                    │
└───────────────┘            └─────────────────┘      └────────────────────┘     └────────────────────┘
   bloquea merge                bloquea main              abre issue si falla        publica artefactos
```

## 2. Workflow de PR (`pr.yml`) — referencia implementable

```yaml
name: PR — validación ALIGNUX

on:
  pull_request:
    branches: [main]

permissions:
  contents: read          # mínimo privilegio; nada de write aquí

concurrency:              # cancela runs obsoletos del mismo PR
  group: pr-${{ github.head_ref }}
  cancel-in-progress: true

env:
  SEL4_VERSION: 16.0.0          # pin del dictamen; nunca "latest"
  MICROKIT_VERSION: 2.3.1
  RUST_SEL4_VERSION: 5.0.0

jobs:
  l0-estatica:            # fail fast: lo barato primero
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@08eba0b27e820071cde6df949e0beb9ba4906955  # v4
      - name: Formato y lint Rust
        run: |
          cargo fmt --all -- --check
          cargo clippy --all-targets -- -D warnings
      - name: Validar SDF contra esquema (V-01)
        run: tools/sdf-check system.sdf
      - name: Validar IDL (S-02)
        run: tools/idl-check idl/

  l1-l2-tests:
    needs: l0-estatica
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@08eba0b27e820071cde6df949e0beb9ba4906955
      - uses: dtolnay/rust-toolchain@<SHA-del-tag-estable>
        with:
          toolchain: 1.xx.0        # versión fijada en rust-toolchain.toml
      - name: Cache cargo
        uses: actions/cache@<SHA>  # clave: Cargo.lock
        with:
          path: |
            ~/.cargo
            target/
          key: cargo-${{ hashFiles('Cargo.lock') }}
      - name: Tests unitarios (L1)
        run: cargo test --workspace
      - name: Property-based 10k casos (L2)
        run: PROPTEST_CASES=10000 cargo test --release -p memgr -p namesrv

  l3-boot-qemu:
    needs: l1-l2-tests
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@08eba0b27e820071cde6df949e0beb9ba4906955
      - name: Restaurar toolchain SDK (Microkit ${{ env.MICROKIT_VERSION }})
        run: tools/sdk-fetch.sh --verify-sha256   # checksum del SDK fijado en repo
      - name: Build imagen de sistema
        run: make image
      - name: Boot en QEMU + test consola + RPC e2e (V-02)
        run: tools/qemu-boot-test.sh --timeout 300 --golden tests/golden-boot.log
      - uses: actions/upload-artifact@<SHA>       # artefacto inmutable
        with:
          name: alignux-image-${{ github.sha }}
          path: build/alignux.img

  gate:
    needs: [l0-estatica, l1-l2-tests, l3-boot-qemu]
    runs-on: ubuntu-24.04
    steps:
      - run: echo "PR gate verde"
```

## 3. Workflow de `main` (`main.yml`)

Todo lo del PR, más lo caro que no cabe en un PR:

- **L4 inyección de fallos** (V-04): catálogo completo — matar `drv_block` en operación, agotar presupuesto MCS, corromper anillo. Cada fallo debe terminar en recuperación verificada.
- **Diff de autoridad** (V-03): comparación runtime vs SDF.
- **Reproducibilidad** (V-07): build en dos jobs/runners y comparación de SHA-256 de la imagen. Divergencia = bloqueo + issue automática (toolchain contaminado).
- **Ratchet de cobertura** (V-06): ≥ 80 % en servicios Rust; bajar cobertura rompe la build.

## 4. Nightly (`nightly.yml`)

```yaml
on:
  schedule:
    - cron: "0 3 * * *"     # 03:00 UTC
  workflow_dispatch:        # también manual

permissions:
  contents: read
  issues: write           # para abrir issues automáticas ante fallos

jobs:
  fuzz-idl:
    runs-on: ubuntu-24.04
    timeout-minutes: 360
    steps:
      - name: Fuzzing del decodificador IDL y parsers (V-05)
        run: tools/fuzz.sh --hours 6 --corpus tests/fuzz-corpus
      - name: Crash → issue con reproducción
        if: failure()
        run: tools/open-fuzz-issue.sh
  propiedades-profundas:
    runs-on: ubuntu-24.04
    steps:
      - run: PROPTEST_CASES=1000000 cargo test --release -p memgr -p namesrv
  mutation-muestreada:
    runs-on: ubuntu-24.04
    steps:
      - run: cargo mutants --in-diff origin/main   # solo mutantes del código nuevo
  seguridad-deps:
    runs-on: ubuntu-24.04
    steps:
      - run: |
          cargo audit --deny warnings
          cargo deny check
```

## 5. Release (`release.yml`)

Disparado solo por tags `v*`, con **environment protection** (revisores obligatorios):

1. Build reproducible en dos runners; hashes deben coincidir o no hay release.
2. Suite completa L0–L4 (+ L6 si hay RC con hardware).
3. Artefactos: `alignux-<ver>.img`, manifiesto de versiones del SDK, SBOM (CycloneDX), `SHA256SUMS`.
4. Firma de artefactos y attestation de procedencia (GitHub Artifact Attestations / cosign).
5. Release notes generadas desde Conventional Commits + checklist manual de `08-produccion-y-release.md`.
6. Publicación como *pre-release*; promoción a *release* tras checklist.

## 6. Seguridad de la propia cadena

- **Actions fijadas por SHA** (no por tag mutable); Dependabot/Renovate las actualiza con PR.
- **Permisos mínimos** por workflow (`contents: read` por defecto; `issues: write` solo en nightly; `id-token: write` solo en release para attestation OIDC).
- **Sin secretos en PRs de forks** (`pull_request`, nunca `pull_request_target` con checkout del PR).
- **Branch protection en `main`**: CI verde + 1 revisión cruzada obligatorias; sin force-push; historial lineal.
- **Dependencias**: `cargo audit` + `cargo deny` en nightly; Dependabot semanal con auto-merge solo si CI verde y cambio es patch.
- **SDK verificado por checksum**: `sdk-fetch.sh` compara SHA-256 del SDK de Microkit contra el valor fijado en el repo.

## 7. Tareas de pipelines (backlog)

| ID | Tarea | Prio | Depende de | Criterio de aceptación |
|---|---|---|---|---|
| CI-01 | `pr.yml` con L0–L3 verde en PR de prueba | M | T0-02, V-01, V-02 | PR con error de lint queda bloqueada |
| CI-02 | `main.yml` con L4 + diff de autoridad + cobertura | M | V-03, V-04, V-06 | Push a main ejecuta la suite completa < 45 min |
| CI-03 | Test de reproducibilidad en 2 runners (V-07) | M | T0-02 | Hashes divergentes bloquean y abren issue |
| CI-04 | `nightly.yml`: fuzzing + propiedades 1M + mutation | S | V-05, T1-09 | Crash de fuzzing genera issue con reproducción |
| CI-05 | `release.yml` con firma + SBOM + attestation | M | G1 | Tag de prueba publica pre-release firmado |
| CI-06 | Branch protection + CODEOWNERS | M | T0-01 | Merge directo a main imposible |
| CI-07 | Dependabot/Renovate con pin por SHA | S | T0-01 | PR de dependencia pasa por CI completa |
| CI-08 | Dashboard de métricas CI (boot time, cobertura, MCS) | C | CI-02 | Métricas visibles por commit en `main` |
