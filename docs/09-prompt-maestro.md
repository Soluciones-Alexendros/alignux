# 09 — Prompt maestro (materialización)

Este documento materializa el **PROMPT MAESTRO** que rige la ejecución del proyecto ALIGNUX. No es una especificación técnica adicional: es el contrato operativo entre el operador humano y el agente de código.

## 1. Identidad

ALIGNUX es un sistema operativo de microkernel sobre seL4. El proyecto se ejecuta en **tres misiones secuenciales** bajo reglas transversales estrictas.

## 2. Contexto canónico (congelado)

- **Pin:** seL4 16.0.0 (22-07-2026) · Microkit 2.3.1 · rust-sel4 5.0.0.
- **Plataforma:** QEMU x86-64 (pc99), UEFI/OVMF + GRUB2 + Multiboot2, MCS.
- **Reglas arquitectónicas:** capacidades, scheduling context donado, IOMMU-first (ADR-06), IPC síncrono/notificación/anillos, API nativa sin POSIX.
- **Won't:** W-01…W-05 (ver `docs/01-arquitectura.md`).
- **Aseguramiento:** solo se afirma lo verificado, con qué/dónde/configuración.

## 3. Reglas transversales

1. Verificar cada paso con evidencia antes de continuar.
2. No inventar estado: si una API o check no responde, el dato es *ausente*.
3. Fail-fast: ante un fallo real, parar y reportar.
4. Sin secretos en claro: tokens → GitHub Secrets; pins/checksums → repositorio.
5. Desviaciones documentadas con ADR (no editar decisiones aceptadas).
6. **Idioma:** código y commits en inglés (Conventional Commits); documentación de usuario y dashboard en español.
7. Cada misión cierra con checklist completo y resumen de evidencias.

## 4. Misiones

### Misión 1 — Repositorio + CI/CD
- **1.1** Repo `Soluciones-Alexendros/alignux`, estructura completa, `VERSIONS.toml` + `sdk-fetch.sh` con SHA-256. `make image` debe fallar con mensaje claro si falta SDK (fallo controlado correcto en M0).
- **1.2** Cuatro workflows: `pr.yml`, `main.yml`, `nightly.yml`, `release.yml`.
- **1.3** Gobernanza: branch protection, CODEOWNERS, etiquetas, milestones, plantillas, Dependabot.
- **1.4** Documentación: `docs/00`–`docs/09`, README, SECURITY.md.
- **Verificación:** PR que viola rustfmt bloqueada; push directo rechazado; grep `verificad` sin calificador → fallo.

### Misión 2 — Dashboard en `alignux.alexendros.dev`
- **2.1** `status.json` con datos reales + `tools/status-export.py` + `status.yml`. Regla de honestidad: si la API no responde, «datos no disponibles» con fecha del último dato bueno.
- **2.2** GitHub Pages desde `gh-pages`, DNS CNAME, HTTPS forzado.
- **2.3** Lighthouse ≥ 95, `status.json` validado contra esquema en CI.

### Misión 3 — Backlog vivo
- **3.1** 69 issues (uno por tarea) + GitHub Projects v2 + `tools/backlog-check.py`.
- **3.2** Issues Gate G0–G5 con checklist + `gates.yml`.
- **3.3** Top-10 tareas inmediatas en orden.
- **3.4** Verificaciones continuas (semanal, por release, por gate, mensual).

## 5. Fuente de verdad

La serie `docs/00`–`docs/08` es la fuente de verdad del proceso. Este documento (09) describe *cómo* se ejecuta; no sustituye a ninguno de los anteriores.
