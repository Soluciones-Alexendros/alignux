# Registro de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y [Versionado Semántico](https://semver.org/lang/es/). Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Añadido

- Repositorio `alignux` con estructura completa (docs, specs, idl, services, drivers, tools, tests).
- Manifiesto de versiones fijado: seL4 16.0.0, Microkit 2.3.1, rust-sel4 5.0.0 (`VERSIONS.toml`).
- Pipelines CI/CD L0–L3 (`pr.yml`), suite completa (`main.yml`), nightly (`nightly.yml`) y release (`release.yml`).
- Gobernanza: CODEOWNERS, plantillas de issues/PR, protección de rama, etiquetas y milestones.
- Documentación de proceso: serie `docs/00`–`docs/09`.

### Seguridad

- `SECURITY.md` con política de reporte privado y postura de aseguramiento.
