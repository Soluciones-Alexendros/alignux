# ALIGNUX

Sistema operativo de microkernel construido sobre **seL4**, con gestión de recursos por capacidades, drivers «IOMMU-first» y una API nativa propia (sin POSIX). Desarrollo dirigido por misiones, verificación por capas (L0–L6) y gates (G0–G5).

## Versiones fijadas (pin)

| Componente | Versión | Notas |
|---|---|---|
| seL4 | 16.0.0 | release 22-07-2026, sin parches funcionales |
| Microkit | 2.3.1 | integra seL4 16.0.0 |
| rust-sel4 | 5.0.0 | servicios Rust `no_std` |

El manifiesto completo (con SHA-256 y plataforma) está en [`VERSIONS.toml`](VERSIONS.toml).

## Estado

Fase **M0 — Cimientos** (2026·Q4): repositorio, toolchain reproducible, arranque QEMU y CI base.

## Arranque rápido

```bash
make run
```

## Aseguramiento

ALIGNUX usa seL4 16.0.0 en una configuración concreta; la corrección funcional de seL4 está verificada en x86-64 sin MCS; MCS está verificado solo en RISC-V (Proofcraft, 2026). **ALIGNUX no está verificado** como sistema completo y nunca lo afirmaremos sin especificar qué, dónde y en qué configuración (política W-05).

## Documentación

Serie `docs/00`–`docs/09`: dictamen técnico, arquitectura, roadmap, tareas, riesgos, especificación, verificación, CI/CD, producción y prompt maestro. La fuente de verdad del proceso está en esa serie.
