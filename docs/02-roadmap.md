# ALIGNUX 2026 — Roadmap

> **Documento 02 de la serie ALIGNUX 2026.** Fases, hitos y criterios de salida. Fechas orientativas a partir de octubre de 2026. Las tareas detalladas viven en `03-tareas.md`; los riesgos, en `04-riesgos.md`.

## Vista general

```
2026 Q4          2027 Q1           2027 Q2           2027 Q3           2027 Q4
│                │                 │                 │                 │
├─ M0 Cimientos ─┤                 │                 │                 │
│                ├─ M1 MVP ────────┤                 │                 │
│                │  servicios      │                 │                 │
│                │  mínimos QEMU   │                 │                 │
│                │                 ├─ M2 Drivers ────┤                 │
│                │                 │  bloques + red  │                 │
│                │                 │                 ├─ M3 SMP + ──────┤
│                │                 │                 │  gestor dinámico│
│                │                 │                 │                 ├─ M4 HW real
│                │                 │                 │                 │  AERO X16
```

## M0 — Cimientos (2026 Q4, ~6 semanas)

**Objetivo:** cadena de construcción reproducible y primer arranque.

- Toolchain fijado: seL4 16.0.0 + Microkit 2.3.1 + rust-sel4 5.0.0, versionado en repo (manifiesto + lockfile).
- Imagen Microkit mínima arrancando en QEMU x86-64 (`pc99`) con OVMF + GRUB2/Multiboot2.
- PD `drv_uart` funcionando: consola serie con patrón sDDF (anillo + notificación).
- CI: build + boot en QEMU + test de consola automatizados.
- Plantilla de PD en Rust `no_std` documentada («hola PD»).

**Criterio de salida:** `git clone && make run` arranca el sistema y muestra consola interactiva en CI y en local.

## M1 — MVP de servicios (2027 Q1)

**Objetivo:** núcleo de servicios mínimo operativo sobre un vCPU.

- `memgr`: partición de Untyped, retipeo, contabilidad, cuotas por PD.
- `namesrv`: registro y resolución nombre → capacidad con ACL.
- IDL propia + generador de bindings Rust; IPC de control 100 % tipado.
- `resmgr`: descubrimiento PCI/ACPI básico; reparto declarativo de IRQ/MMIO.
- Política de recuperación v1: padre reinicia PD hija ante fallo (jerarquía Microkit).
- Esqueleto `shell` para pruebas interactivas.

**Criterio de salida:** un PD de prueba puede descubrir un servicio por nombre, pedir memoria a `memgr`, invocar RPC tipado y ser reiniciado automáticamente tras un fallo inducido. Presupuestos MCS activos y medibles en todos los PDs.

## M2 — Drivers y almacenamiento (2027 Q2)

**Objetivo:** datos persistentes y primer driver con DMA real.

- `drv_block` virtio-blk en QEMU con anillos sDDF e **IOMMU configurada** (`<io_address_space>`, páginas de 4 KiB —limitación del kernel—).
- `vfs` nativo mínimo (diseño propio tipo «traductor»: semántica por servidor, no POSIX).
- Driver de red virtio-net (si el calendario lo permite; si no, se mueve a M3).
- Banco de pruebas de inyección de fallos en drivers (muerte y reinicio del PD sin tumbar el sistema).

**Criterio de salida:** leer/escribir un volumen persistente desde `shell` solo con RPCs tipados; matar `drv_block` y recuperar el servicio sin reiniciar el sistema.

## M3 — SMP y gestor dinámico (2027 Q3)

**Objetivo:** multi-vCPU y dinamismo controlado.

- Configuración SMP en QEMU (2-4 vCPU); afinidades y contabilidad MCS por núcleo.
- **Gestor dinámico propio v1**: crear/destruir PDs en caliente desde un PD privilegiado, sobre las primitivas estables de M1-M2. *(Esta es la fase 2 que el dictamen condiciona a criterios de salida del MVP.)*
- Revisión de seguridad: modelo de amenaza del gestor (quién puede crear qué, con qué autoridad).

**Criterio de salida:** crear un PD nuevo en tiempo de ejecución, conectarlo a `namesrv` y destruirlo con `revoke` completo de sus recursos, sin fugas de capacidades medibles.

## M4 — Hardware real: GIGABYTE AERO X16 (2027 Q4)

**Objetivo:** arranque y servicios mínimos en el portátil objetivo.

- Arranque UEFI en hardware; consola por serie/USB debug.
- Driver NVMe nativo (sDDF) con IOMMU —sustituye a virtio.
- Red: driver NIC según chipset del equipo (probablemente Realtek/Intel; portar patrón sDDF).
- Inventario ACPI/PCIe real vs. QEMU: ajustes de `resmgr`.

**Criterio de salida:** sistema arranca en el AERO X16, `drv_block` sobre NVMe físico pasa el banco de pruebas de M2.

> **Nota de riesgo:** un portátil moderno es un primer hardware ambicioso (firmware propietario, IOMMU estricta, PMIC/suspend). Si M4 se atasca, se intercala un objetivo intermedio más dócil (p. ej. un mini-PC Intel NUC o una placa documentada por la comunidad seL4) sin invalidar la fase. Ver `04-riesgos.md` R-06.

## M5 — Compatibilidad como servicio (2028, exploratorio)

**Objetivo:** demostrar que la compatibilidad se añade *fuera* del núcleo.

- VM Linux aislada como invitada (Microkit soporta VMs; en x86-64 con las restricciones de 2.3.0: sin presupuesto/periodo propio, sin PDs hijas en el VMM).
- Evaluación de servidor POSIX parcial (decidir entre: subsistema propio, port de biblioteca, o solo VM).
- Informe público de aseguramiento: qué está verificado, qué no, por plataforma.

## Dependencias críticas entre fases

- M2 depende de la IDL y de `resmgr` (M1).
- M3 depende de que la política de recuperación (M1) y los drivers (M2) sean estables: dinamismo sobre base inestable multiplica el coste de depuración.
- M4 depende de M2 (patrón de driver DMA probado en QEMU primero).
- Ninguna fase depende de POSIX: la API nativa es siempre el camino principal.

## Métricas de salud del proyecto (se reportan en el dashboard)

| Métrica | Objetivo |
|---|---|
| Build reproducible en CI | 100 % de commits en `main` |
| Tiempo de arranque en QEMU | < 5 s |
| Reinicio de PD caída | < 50 ms, sin intervención |
| Fugas de capacidades tras destruir PD (M3+) | 0 |
| Cobertura de pruebas en servicios Rust | ≥ 80 % líneas |
| Desviación de presupuesto MCS por servicio | medida y publicada en CI |
