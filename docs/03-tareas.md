# ALIGNUX 2026 — Backlog de tareas

> **Documento 03 de la serie ALIGNUX 2026.** Tareas operativas derivadas de `01-arquitectura.md` y `02-roadmap.md`. Prioridad MoSCoW: **M**ust / **S**hould / **C**ould / **W**on't (esta iteración). Estado: ⬜ pendiente · 🔶 en curso · ✅ hecha.

**Leyenda de IDs:** `T<fase>-<número>`. Dependencias entre paréntesis.

---

## M0 — Cimientos (2026 Q4)

| ID | Tarea | Prio | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| T0-01 | Repositorio con manifiesto de versiones (seL4 16.0.0, Microkit 2.3.1, rust-sel4 5.0.0) | M | ⬜ | — | `repo`/lockfile fijan todos los artefactos; build bit a bit reproducible |
| T0-02 | Toolchain containerizado o Nix/reproducible documentado | M | ⬜ | T0-01 | Mismo hash de imagen en dos máquinas distintas |
| T0-03 | Receta QEMU: OVMF + GRUB2 + Multiboot2 versionada | M | ⬜ | T0-01 | Script `run.sh` arranca imagen sin pasos manuales |
| T0-04 | Imagen Microkit mínima (monitor + 1 PD «hola») | M | ⬜ | T0-02, T0-03 | Boot en QEMU con log del monitor |
| T0-05 | Plantilla PD Rust `no_std` con rust-sel4 5.0.0 | M | ⬜ | T0-02 | PD compila, arranca y responde a notificación |
| T0-06 | `drv_uart`: consola serie patrón sDDF | M | ⬜ | T0-04 | Eco de teclado por serie vía anillo + notificación |
| T0-07 | CI: build + boot + test de consola | M | ⬜ | T0-04, T0-06 | Verde en cada push a `main` |
| T0-08 | Documento de convenciones (naming SDF, estructura repo, estilo Rust) | S | ⬜ | — | Aprobado por revisión |

## M1 — MVP de servicios (2027 Q1)

| ID | Tarea | Prio | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| T1-01 | IDL: gramática mínima + generador de bindings Rust | M | ⬜ | T0-05 | RPC de ida y vuelta generado, sin código manual |
| T1-02 | `memgr`: partición Untyped, retipeo, cuotas | M | ⬜ | T0-05, T1-01 | Alloc/free correctos; cuota excedida → error tipado |
| T1-03 | `namesrv`: registro/lookup con ACL | M | ⬜ | T1-01 | Lookup sin ACL → denegado; autoridad nunca por nombre |
| T1-04 | `resmgr`: PCI/ACPI básico, reparto IRQ/MMIO declarativo | M | ⬜ | T1-01 | Dispositivo asignado a un solo PD; conflicto → error |
| T1-05 | Política de recuperación v1 (padre reinicia hija) | M | ⬜ | T0-05 | PD matada se reinicia < 50 ms y responde RPC |
| T1-06 | Presupuestos MCS en todos los PDs + medición | M | ⬜ | T0-04 | Informe de consumo temporal por PD en CI |
| T1-07 | `shell` interactiva de pruebas | S | ⬜ | T1-03 | Descubrir servicio por nombre e invocarlo desde consola |
| T1-08 | Pruebas property-based sobre `memgr` (invariantes: sin solapes, sin fugas) | S | ⬜ | T1-02 | 10k casos sin violación de invariante |
| T1-09 | Fuzzing del decodificador IDL | S | ⬜ | T1-01 | 24 h de fuzzing sin panic en servidor |

## M2 — Drivers y almacenamiento (2027 Q2)

| ID | Tarea | Prio | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| T2-01 | `drv_block` virtio-blk con anillos sDDF | M | ⬜ | T1-01, T1-04 | Lectura/escritura correcta verificada con checksums |
| T2-02 | IOMMU: `<io_address_space>` para `drv_block` | M | ⬜ | T2-01 | DMA funciona con IOMMU activa; acceso fuera de región → fallo contenido |
| T2-03 | `vfs` nativo mínimo (sin semántica POSIX) | M | ⬜ | T2-01 | Crear/leer/borrar archivo desde `shell` |
| T2-04 | Banco de inyección de fallos en drivers | M | ⬜ | T2-01 | Matar `drv_block` en operación → recuperación sin corrupción |
| T2-05 | Driver virtio-net (anillo + notificaciones) | S | ⬜ | T2-01 | ping ICMP entre dos instancias QEMU |
| T2-06 | Documentación del patrón de driver ALIGNUX | S | ⬜ | T2-02 | Guía reproducible por un tercero |

## M3 — SMP y gestor dinámico (2027 Q3)

| ID | Tarea | Prio | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| T3-01 | Configuración SMP 2-4 vCPU en QEMU | M | ⬜ | M1 completo | Servicios activos en ≥ 2 núcleos con afinidad declarada |
| T3-02 | Contabilidad MCS por núcleo | M | ⬜ | T3-01 | Presupuestos respetados bajo carga en todos los núcleos |
| T3-03 | Modelo de amenaza del gestor dinámico | M | ⬜ | — | Documento aprobado: quién crea qué, con qué autoridad |
| T3-04 | Gestor dinámico v1: crear PD en caliente | M | ⬜ | T3-03, M1-M2 | PD creada se registra en `namesrv` y sirve RPC |
| T3-05 | Destrucción con `revoke` completo | M | ⬜ | T3-04 | 0 capacidades fugadas (medido en árbol de derivación) |
| T3-06 | Tests de concurrencia SMP (estrés IPC cruzado) | S | ⬜ | T3-01 | 1 M mensajes sin deadlock ni corrupción |

## M4 — Hardware real: AERO X16 (2027 Q4)

| ID | Tarea | Prio | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| T4-01 | Arranque UEFI en AERO X16 + consola debug | M | ⬜ | M1 | Log de boot en hardware real |
| T4-02 | Inventario ACPI/PCIe real vs QEMU | M | ⬜ | T4-01 | Tabla de diferencias + ajustes en `resmgr` |
| T4-03 | Driver NVMe nativo (sDDF) con IOMMU | M | ⬜ | T2-01, T2-02, T4-02 | Pasa banco de pruebas de M2 en hardware |
| T4-04 | Driver NIC del equipo | S | ⬜ | T2-05, T4-02 | Tráfico IP real |
| T4-05 | Plan B de hardware intermedio (si M4 se bloquea) | C | ⬜ | — | Decisión documentada antes de 2027 Q3 |

## M5 — Compatibilidad como servicio (2028, exploratorio)

| ID | Tarea | Prio | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| T5-01 | VM Linux invitada sobre Microkit (restricciones x86-64 de 2.3.0 documentadas) | C | ⬜ | M2 | Linux arranca como invitada aislada |
| T5-02 | Evaluación de servidor POSIX parcial | C | ⬜ | T5-01 | Informe de opciones con recomendación |
| T5-03 | Informe público de aseguramiento por plataforma | S | ⬜ | M3 | Documento publicado: qué está verificado y qué no |

## Política Won't (explícita, para proteger el alcance)

- **W-01** GUI/escritorio antes de M4.
- **W-02** Compatibilidad POSIX/ABI Linux en la API nativa.
- **W-03** Parches funcionales al núcleo durante el MVP.
- **W-04** Gestor dinámico antes de cerrar los criterios de salida de M1-M2.
- **W-05** Afirmar en público que «ALIGNUX está verificado» (ver `00`, §1.1: en x86-64 + MCS no hay cobertura formal).
