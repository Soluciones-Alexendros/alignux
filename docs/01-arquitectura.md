# ALIGNUX 2026 — Arquitectura del sistema

> **Documento 01 de la serie ALIGNUX 2026.** Deriva del `00-dictamen-tecnico-revisado.md`. Describe la arquitectura operacional del MVP y las decisiones estructurales (ADR resumidos).

**Pin de versiones (congelado para el MVP):**

| Componente | Versión | Fecha release | Rol |
|---|---|---|---|
| seL4 | 16.0.0 | 22-07-2026 | Microkernel |
| Microkit | 2.3.1 | 18-09-2026 | Composición estática del sistema (SDF) |
| rust-sel4 | 5.0.0 | 2026 | Userspace en Rust `no_std` |
| Plataforma | `pc99` (QEMU x86-64) | — | Objetivo inicial de ejecución |
| Cadena de arranque | OVMF (UEFI) + GRUB2 + Multiboot2 | — | Boot reproducible |

---

## 1. Vista de capas

```
┌─────────────────────────────────────────────────────────┐
│  Aplicaciones ALIGNUX (API nativa, sin POSIX)           │
├─────────────────────────────────────────────────────────┤
│  Servicios de sistema (PDs Rust no_std):                │
│  nombres · archivos · red · consola · ventanas (futuro) │
├─────────────────────────────────────────────────────────┤
│  Servidores de infraestructura:                         │
│  gestor de memoria · gestor de recursos/IRQ · drivers   │
│  (sDDF: anillos de memoria compartida + notificaciones) │
├─────────────────────────────────────────────────────────┤
│  Microkit: monitor, PDs pasivas/activas, VMs (futuro),  │
│  jerarquía de fallos (parent-child), IOMMU en x86-64    │
├─────────────────────────────────────────────────────────┤
│  seL4 16.0.0 MCS: capacidades, IPC síncrono,            │
│  notificaciones, scheduling contexts, Untyped memory    │
├─────────────────────────────────────────────────────────┤
│  Hardware: QEMU x86-64 (1 vCPU) → SMP → AERO X16        │
└─────────────────────────────────────────────────────────┘
```

**Regla de oro:** el núcleo solo contiene mecanismos (capacidades, IPC, planificación, memoria tipada). Toda política —nombres, asignación, recuperación, permisos— vive en espacio de usuario y es reemplazable.

## 2. Dominios de protección (PDs) del MVP

| PD | Lenguaje | Tipo | Autoridad inicial | Función |
|---|---|---|---|---|
| `init` | C (Microkit runtime) | Activa, raíz | Untyped inicial, IRQ control | Arranque y delegación; mínima lógica |
| `memgr` | Rust `no_std` | Pasiva | Untyped particionado | Asignación/liberación de memoria tipada; contabilidad |
| `resmgr` | Rust `no_std` | Pasiva | IRQs, IO ports, MMIO | Descubrimiento PCI/ACPI, reparto de dispositivos |
| `drv_uart` | C auditado | Pasiva | IRQ serie + MMIO UART | Consola de depuración (primer driver, patrón sDDF) |
| `drv_block` | Rust `no_std` | Pasiva | IRQ NVMe/virtio + MMIO + IOMMU | Almacenamiento de bloques (virtio-blk en QEMU primero) |
| `vfs` | Rust `no_std` | Pasiva | Canal a `drv_block` | Sistema de archivos nativo (diseño propio, tipo «traductor») |
| `namesrv` | Rust `no_std` | Pasiva | Endpoints de registro | Servicio de nombres: resuelve nombres → capacidades, **sin conceder autoridad** |
| `shell` | Rust `no_std` | Activa | Capacidades delegadas mínimas | Consola de usuario para pruebas del MVP |

Principios:

- **PD pasiva por defecto**: los servidores no tienen contexto de planificación propio; ejecutan con el *scheduling context* donado por el cliente (MCS). Así, el consumo de CPU se factura a quien pide el trabajo.
- **Jerarquía de fallos**: cada PD tiene padre declarado en el SDF; un fallo escala al padre, que decide reiniciar el PD (Microkit 1.3+ soporta PDs hijas y `microkit_pd_stop/resume`).
- **Mínima autoridad inicial**: cada PD recibe exactamente las capacidades que declara el SDF; no hay capacidades «comodín».

## 3. Modelo de IPC

| Necesidad | Mecanismo seL4 | Patrón ALIGNUX |
|---|---|---|
| Control / petición-respuesta | `seL4_Call` síncrono sobre Endpoint | RPC tipado con IDL propia (generación Rust) |
| Eventos (IRQ, disponibilidad) | Notification objects | Señales binarias; nunca transportan datos |
| Datos a granel | Memoria compartida + anillos | Colas de anillo sin copia estilo sDDF; la capacidad de la región se transfiere una sola vez al establecer el canal |
| Tiempo límite en cliente | `seL4_ReplyRecv`/timeouts MCS | Todo `Call` de usuario lleva presupuesto temporal declarado |

Reglas duras:

1. **Los nombres no conceden autoridad.** `namesrv` traduce nombre → capacidad solo si el solicitante ya posee una capacidad de «consulta» sobre ese servicio.
2. **Sin buffers ocultos en kernel**: todo dato grande viaja por memoria compartida explícita.
3. **Todo canal es tipado** por la IDL; los mensajes crudos solo existen dentro de los adaptadores generados.

## 4. Modelo de memoria

- **Untyped → retipeo explícito**: `init` cede el Untyped a `memgr`, que lo particiona y retipa (Frames, CNodes, TCBs). La descendencia queda registrada, lo que habilita `revoke` para recuperación.
- **Sin `malloc` global en servidores**: cada PD declara su memoria en el SDF; el crecimiento dinámico pasa por `memgr`.
- **IOMMU (x86-64)**: desde Microkit 2.3.0 está **activa por defecto**. Todo driver con DMA debe declarar su `<io_address_space>`; los drivers se diseñan «IOMMU-first» (ventaja de seguridad, no solo obligación).

## 5. Planificación (MCS)

- Cada PD activa tiene *scheduling context* con **presupuesto/periodo** explícitos en el SDF.
- Los servidores pasivos reciben el contexto del cliente por **donación** durante el `Call`: la CPU consumida se contabiliza al cliente.
- Prioridades solo para desempate; la garantía real la dan presupuesto y periodo.
- **Nota de aseguramiento**: MCS está verificado solo en RISC-V 64 (2026); en x86-64 se usa sin cobertura formal (ver `00`, §1.1).

## 6. Cadena de arranque

1. OVMF (UEFI) en QEMU carga GRUB2.
2. GRUB2 carga la imagen Microkit (kernel + monitor + PDs) vía Multiboot2.
3. seL4 arranca, crea el hilo inicial del monitor Microkit.
4. El monitor instancia PDs, canales y regiones según el SDF, y cede el control.
5. `init` delega recursos en `memgr`/`resmgr`; arranque de servicios por dependencia declarada.

Reproducibilidad: la imagen se construye con el SDK fijado (Microkit 2.3.1 + seL4 16.0.0); la receta de QEMU (línea de comandos + OVMF) se versiona en el repo.

## 7. Decisiones arquitectónicas (ADR resumidos)

| ADR | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| ADR-01 | seL4 16.0.0 como núcleo | GNU Mach, Fiasco, kernel propio | Única cadena de verificación formal pública; modelo de capacidades limpio |
| ADR-02 | Microkit 2.3.1, arquitectura estática | CAmkES, root-task propio desde cero | SDF declarativo, PDs pasivas, jerarquía de fallos, SDK firmado; CAmkES arrastra abstracciones pesadas |
| ADR-03 | Rust `no_std` para servicios | C, C++, Ada/SPARK | Seguridad de memoria sin GC; rust-sel4 5.0.0 compatible con el pin; SPARK se reevalúa para componentes críticos |
| ADR-04 | MCS activado desde el MVP | Planificación clásica de seL4 | Contabilidad temporal es requisito de diseño; asumir que en x86-64 no está verificado |
| ADR-05 | API nueva, POSIX solo como servidor futuro | Compatibilidad POSIX nativa | POSIX como contrato fundacional fija decisiones (procesos, señales, fs jerárquico) que ALIGNUX quiere rediseñar |
| ADR-06 | IOMMU-first en drivers x86-64 | Desactivar IOMMU (comportamiento pre-2.3.0) | Aislamiento DMA real; Microkit 2.3.0 lo activa por defecto |
| ADR-07 | Drivers estilo sDDF (anillos + notificaciones) | Drivers síncronos por RPC | Evita copia y bloqueo; patrón con soporte de la comunidad seL4 |
| ADR-08 | Gestor dinámico propio en fase 2 | Dinamismo desde el día 1 | Estabilizar primero capacidades/memoria/IPC/recuperación sobre base estática |

## 8. Interfaces de referencia del MVP (IDL esquemática)

```
service memgr {
  alloc(kind: ObjKind, size: u64) -> Result<Cap, Err>;   // requiere cap de cuota
  free(cap: Cap) -> Result<(), Err>;
  stats() -> MemStats;                                    // solo lectura
}

service namesrv {
  register(name: Str, ep: Cap, acl: Acl) -> Result<(), Err>;
  lookup(name: Str) -> Result<Cap, Err>;                  // filtra por ACL del llamante
}

service drv_block {
  read(lba: u64, ring_slot: u32) -> Result<(), Err>;      // datos por anillo compartido
  write(lba: u64, ring_slot: u32) -> Result<(), Err>;
  on_event() -> Notification;                             // IRQ/completion
}
```

## 9. Qué NO es ALIGNUX en el MVP

- No es un escritorio: no hay GUI, ni sesión gráfica, ni gestor de ventanas.
- No es compatible con Linux/POSIX: no hay `fork`, `exec`, señales ni `/dev`.
- No es dinámico: los PDs se definen en el SDF en tiempo de compilación.
- No es SMP: un vCPU hasta la fase 3.
- No está formalmente verificado en su configuración de ejecución (x86-64 + MCS).
