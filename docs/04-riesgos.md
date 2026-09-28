# ALIGNUX 2026 — Registro de riesgos

> **Documento 04 de la serie ALIGNUX 2026.** Probabilidad (P) e impacto (I): baja / media / alta. Cada riesgo tiene dueño de mitigación y disparador observable.

## Riesgos técnicos

| ID | Riesgo | P | I | Mitigación | Disparador |
|---|---|---|---|---|---|
| R-01 | **Brecha de verificación**: la configuración de ejecución (x86-64 + MCS) no tiene cobertura formal; el argumento «verificado» se devalúa | Alta | Media | Comunicación honesta por plataforma (`00` §1.1); perfil RISC-V/AArch64 como plataforma de referencia verificada a medio plazo | Cualquier texto público que afirme verificación global |
| R-02 | **Ecosistema de drivers inmaduro** (sDDF joven; NVMe/NIC/GPU a escribir o portar) | Alta | Alta | Empezar por virtio en QEMU; patrón sDDF documentado (T2-06); presupuestar M4 con holgura; estudiar catálogo de drivers de L4Re como referencia | M2 se retrasa > 4 semanas |
| R-03 | **Cambios incompatibles de Microkit 2.3.x en x86-64** (IOMMU por defecto, IOAPIC, restricciones VM) rompen supuestos del diseño | Media | Media | Diseño IOMMU-first desde T2-01 (ADR-06); leer release notes completas antes de cada actualización de SDK | Fallos de DMA inexplicables en QEMU |
| R-04 | **Curva de aprendizaje del modelo de capacidades** frena al equipo (CSpace, Untyped, revoke, MCS) | Alta | Media | Tutoriales oficiales como onboarding obligatorio; plantilla PD (T0-05) como referencia; revisiones cruzadas | Tareas de M1 tardan > 2× lo estimado |
| R-05 | **Gestor dinámico prematuro**: introducir dinamismo antes de estabilizar recuperación multiplica el coste de depuración | Media | Alta | Condición dura: M3 solo arranca con criterios de salida de M1-M2 cumplidos (política W-04) | Presión por adelantar M3 |
| R-06 | **AERO X16 como primer hardware es ambicioso**: firmware propietario, IOMMU estricta, gestión de energía, sin puerto serie fácil | Media | Media | Plan B: hardware intermedio documentado por la comunidad seL4 (T4-05); consola por USB debug | T4-01 sin éxito tras 3 semanas |
| R-07 | **SMP en MCS**: configuraciones SMP+MCS+HYP tienen historial de bugs (p. ej. ajustes de TCB_SIZE en 16.0.0) | Media | Media | SMP llega en M3, después de dominar uniprocesador; suite de estrés (T3-06) | Fallos intermitentes solo bajo SMP |
| R-08 | **Dependencia de comunidad pequeña**: soporte por listas/GitHub sin SLA | Media | Media | Fijar versiones; mantener fork del SDK; contribuir fixes upstream para ganar capital en la comunidad | Issue crítico sin respuesta > 2 semanas |

## Riesgos de proyecto

| ID | Riesgo | P | I | Mitigación | Disparador |
|---|---|---|---|---|---|
| R-09 | **Scope creep hacia escritorio/POSIX** | Media | Alta | Política Won't (W-01, W-02); toda petición de POSIX se deriva a M5 | Features GUI en el backlog antes de M4 |
| R-10 | **Sobre-ingeniería de la IDL** antes de validar casos de uso reales | Media | Baja | IDL mínima en M1; crecer solo por demanda de servicios reales | IDL con > 2 revisiones de diseño sin código |
| R-11 | **Métricas de aseguramiento mal comunicadas** dañan credibilidad del proyecto | Baja | Alta | Informe de aseguramiento por plataforma (T5-03) y disclaimer fijo en README | Preguntas externas sobre «verificación total» |

## Riesgos aceptados conscientemente

- **Sin cobertura de arranque**: el boot (OVMF/GRUB/loader) nunca está dentro del perímetro verificado de seL4; se acepta y se mitiga con cadena de arranque minimalista y reproducible.
- **Sin pruebas de seguridad/binario en x86-64**: solo corrección funcional (config. no-MCS). Aceptado para el MVP.
- **MCS sin verificar en x86-64**: se asume a cambio de contabilidad temporal real desde el diseño. Si Proofcraft porta la prueba MCS a otras arquitecturas, se reevalúa la plataforma de referencia.

## Revisión

El registro se revisa al cierre de cada fase (M0-M5) y ante cualquier release nuevo del pin (seL4 / Microkit / rust-sel4). Cada revisión actualiza P/I y añade lecciones aprendidas.
