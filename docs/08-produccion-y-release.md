# ALIGNUX 2026 — Producción y release

> **Documento 08 de la serie ALIGNUX 2026.** Qué significa «poner ALIGNUX en producción» y cómo se llega ahí sin romper la cadena. Se apoya en los gates de `06` y en los pipelines de `07`.

## 1. Qué es «producción» para ALIGNUX

ALIGNUX no es una app web: «producción» significa **publicar una release del sistema que un tercero pueda descargar, verificar, arrancar y evaluar**. El camino es escalonado:

| Hito | Contenido | Audiencia |
|---|---|---|
| **v0.1 «Bootstrap»** | M0+G0: imagen que arranca en QEMU con consola | Equipo + early adopters técnicos |
| **v0.2 «Services»** | M1+G1: servicios mínimos (memoria, nombres, recursos, recuperación) | Evaluadores de arquitectura |
| **v0.3 «Storage»** | M2+G2: disco persistente con IOMMU | Evaluadores + comunidad seL4 |
| **v0.4 «Dynamic»** | M3+G3: SMP + gestor dinámico | Comunidad |
| **v0.5 «Hardware»** | M4+G4: arranque en AERO X16 con NVMe físico | Comunidad + prensa técnica |
| **v1.0 «Alignux»** | M5+G5 + informe de aseguramiento + documentación completa | Público general técnico |

Regla: **ninguna versión salta un gate**. v0.3 no existe si G1 no está en verde, aunque el código de M2 funcione.

## 2. Versionado

- **SemVer estricto** para el sistema (`v0.x` hasta M5; `v1.0` tras G5).
- **Conventional Commits** en todo el repo: `feat:`, `fix:`, `docs:`, `test:`, `ci:`… alimentan el changelog automático.
- **Keep a Changelog** como formato de `CHANGELOG.md`.
- El **pin del SDK** (seL4/Microkit/rust-sel4) forma parte de la versión: cambiar el pin de seL4 implica al menos un bump minor y una nota de migración.
- Compatibilidad de la IDL: la versión de contrato (S-02) se anuncia en cada release; roturas solo en minor/major con período de transición.

## 3. Artefactos de cada release

| Artefacto | Garantía |
|---|---|
| `alignux-<ver>.img` (imagen QEMU) | Build reproducible: mismo SHA-256 en dos runners |
| `alignux-<ver>-sdk-manifest.toml` | Versiones exactas de seL4, Microkit, rust-sel4, toolchain |
| `SHA256SUMS` + firma | Firma con clave del proyecto (y attestation OIDC de GitHub) |
| SBOM (CycloneDX) | Todas las dependencias Rust y herramientas de build |
| Informe de aseguramiento | Qué está verificado formalmente y qué no, por plataforma (obligatorio desde v0.1 — ver riesgo R-11) |
| `CHANGELOG.md` | Generado de Conventional Commits, revisado a mano |

## 4. Canales

- **`main`** — siempre verde; cada merge es potencialmente arrancable.
- **Nightly** — builds automáticas nocturnas para valientes; sin garantía, con suite L5.
- **RC (release candidate)** — `vX.Y.Z-rc.N`; congela features; solo entran fixes; exige L6 en hardware desde v0.5.
- **Release** — promoción manual de una RC tras el checklist (§5).

## 5. Checklist de release (manual, obligatorio)

1. ☐ Gate de la fase en verde (G0–G5 según la versión) y sin regresiones.
2. ☐ Suite completa L0–L4 verde en el commit tagueado (+ L6 si aplica).
3. ☐ Build reproducible confirmado (hashes idénticos).
4. ☐ SBOM generado y `cargo audit` sin avisos abiertos.
5. ☐ Informe de aseguramiento actualizado: ninguna afirmación de verificación falsa o ambigua (R-11).
6. ☐ CHANGELOG revisado por un humano.
7. ☐ Documentación (`00`–`08`) coherente con el comportamiento real de la release.
8. ☐ Registro de riesgos (`04`) revisado: ningún disparador activado sin acción.
9. ☐ Release notes revisadas por al menos dos personas (una no desarrolladora).

## 6. Gobernanza mínima

- **CODEOWNERS**: cada subsistema (memoria, drivers, IDL, CI) tiene dueño; su revisión es obligatoria en PRs que lo tocan.
- **Revisión cruzada**: ningún merge con una sola persona.
- **SECURITY.md**: canal de reporte de vulnerabilidades y política de divulgación (obligatorio antes de v0.3, cuando haya red).
- **Comunicación pública**: toda afirmación sobre verificación pasa por la tabla del dictamen (`00`, §1.1). Prohibido decir «verificado» sin «qué, dónde y en qué configuración».

## 7. Tareas de producción (backlog)

| ID | Tarea | Prio | Depende de | Criterio de aceptación |
|---|---|---|---|---|
| P-01 | SemVer + Conventional Commits + changelog automático | M | T0-01 | Changelog generado correctamente en un tag de prueba |
| P-02 | Firma de artefactos + attestation OIDC | M | CI-05 | Verificación de firma documentada y reproducible por un tercero |
| P-03 | SBOM CycloneDX en cada release | M | CI-05 | SBOM completo y válido adjunto al tag de prueba |
| P-04 | Plantilla de informe de aseguramiento por release | M | S-04 | Informe generado para v0.1 sin afirmaciones ambiguas |
| P-05 | Canal nightly publicado con aviso de garantías | S | CI-04 | Nightly descargable con checksum y disclaimer |
| P-06 | CODEOWNERS + SECURITY.md | M | CI-06 | PR a un subsistema exige revisión de su dueño |
| P-07 | Proceso de RC: congelación, fixes, promoción | S | CI-05 | Una RC de prueba recorre el ciclo completo |
| P-08 | Release v0.1 «Bootstrap» | M | G0, P-01…P-04 | v0.1 publicada con artefactos verificables |

## 8. Definición de «cadena rota»

La cadena está rota —y se detiene todo avance de fase— si ocurre cualquiera de:

- Un gate previamente verde pasa a rojo y nadie lo atiende en 48 h.
- Una release se publica sin checklist completo o con informe de aseguramiento ambiguo.
- Un cambio de IDL rompe consumidores sin bump de versión de contrato.
- El hash de build reproducible diverge entre runners sin explicación resuelta.
- Una tarea entra en desarrollo sin spec aprobada (violación del DoR).

La reparación de la cadena tiene prioridad sobre cualquier feature nueva.
