# ALIGNUX 2026 — Dictamen técnico revisado y verificado

> **Documento 00 de la serie ALIGNUX 2026.** Versión revisada con verificación factual contra fuentes oficiales (seL4, Proofcraft, Trustworthy Systems, GNU) a fecha de **septiembre de 2026**.
> Documentos relacionados: `01-arquitectura.md`, `02-roadmap.md`, `03-tareas.md`, `04-riesgos.md`.

---

## 0. Resumen de la revisión (qué cambia respecto al borrador original)

| # | Afirmación original | Estado | Corrección aplicada |
|---|---|---|---|
| 1 | Núcleo seL4 16.0.0 | ✅ Confirmado | seL4 16.0.0 se publicó el **22 de julio de 2026**; es la versión correcta a fijar. |
| 2 | Microkit como composición inicial (manual v2.2.0) | ⚠️ Incoherente de versiones | Microkit 2.2.0 integra **seL4 15.0.0**, no 16.0.0. La pareja correcta es **Microkit 2.3.1** (18-sep-2026), que integra seL4 16.0.0. Se actualiza el pin completo: **seL4 16.0.0 + Microkit 2.3.1 + rust-sel4 5.0.0**. |
| 3 | «Microkit usa MCS, cuya verificación de conformidad sigue en progreso» | ⚠️ Desactualizado | En 2026 Proofcraft **completó la prueba de corrección funcional de MCS para RISC-V 64 bits**; el port a AArch64 está en marcha (programa PROVERS de DARPA). **En x86-64 —la plataforma de ALIGNUX— MCS sigue sin verificar.** La frase se sustituye por una afirmación precisa por plataforma. |
| 4 | Hurd: «SMP todavía experimental en 2026» | ✅ Matizable | El port x86-64 de Hurd está «esencialmente completo» (Guix publicó el Hurd de 64 bits en marzo de 2026) y ~75 % del archivo de Debian compila; SMP en GNU Mach mejoró con un patchset de Damien Zammit, pero sigue sin ser producción. Se matiza, no se corrige el fondo. |
| 5 | Manual de referencia seL4 10.1.1 (ref. 35) | ⚠️ Obsoleto | Sustituido por el **manual 16.0.0**, coherente con el pin del núcleo. |
| 6 | Microkit en x86-64 | ➕ Riesgo no mencionado | Microkit 2.3.0 introduce **cambios incompatibles en x86-64**: IOMMU activado por defecto (el DMA exige configurar `<io_address_space>`), polaridad IOAPIC corregida, restricciones nuevas en VMs. Debe planificarse en el roadmap. |
| 7 | Estructura del informe | ➕ Incompleto | El borrador solo detalla fortalezas de seL4 y se interrumpe. Se completan debilidades de seL4 y análisis simétrico de Hurd/Mach y Fiasco/L4Re, más sección de decisión. |

---

## 1. Dictamen técnico

ALIGNUX debe construirse sobre **seL4**, no sobre GNU Mach/Hurd ni sobre un microkernel nuevo. El referente comparativo de «L4» será **Fiasco/L4Re**, porque L4 es una familia —a la que también pertenece seL4— y no un producto único. Hurd tampoco es un microkernel: es el conjunto de servidores de sistema que se ejecuta sobre GNU Mach.

La propuesta concreta para 2026, **ya corregida y fijada por versiones**, es:

- **Núcleo:** seL4 **16.0.0** (publicado el 22-07-2026), fijado a la versión oficial y sin parches funcionales durante el MVP. Es una versión *breaking* centrada en validación de supuestos y endurecimiento del código no verificado.
- **Composición inicial:** **Microkit 2.3.1** (la versión cuyo SDK integra seL4 16.0.0) para arquitectura estática y reproducible; gestor dinámico propio solo después de estabilizar capacidades, memoria, IPC y recuperación.
- **Pila Rust:** **rust-sel4 5.0.0**, la versión compatible con seL4 16.0.0 y Microkit 2.3.x. Servicios en Rust `no_std` dentro de dominios de protección; C limitado a adaptadores auditados y código heredado.
- **Autoridad:** capacidades tipadas y derechos reducibles; los nombres nunca conceden autoridad.
- **IPC:** llamada síncrona acotada para control, notificaciones para eventos y memoria compartida con anillos para datos (patrón sDDF).
- **Planificación:** seL4 **MCS**, con presupuesto/periodo, donación de contexto de planificación a servidores pasivos y límites explícitos de consumo.
- **Hardware inicial:** QEMU x86-64 (plataforma `pc99` de seL4), un vCPU, UEFI/OVMF + GRUB2/Multiboot2; posteriormente SMP y hardware físico (GIGABYTE AERO X16 como banco de pruebas objetivo).
- **API:** nueva, sin POSIX ni ABI Linux como contrato fundacional.
- **Compatibilidad futura:** Linux, POSIX o GNU se ofrecerían como servidores, bibliotecas o VM aislada, nunca como ampliación del microkernel.

### 1.1 Afirmación de aseguramiento (precisa y por plataforma)

La afirmación de aseguramiento debe ser exacta: **ALIGNUX usa una configuración concreta de un microkernel con determinadas propiedades verificadas; no todo ALIGNUX está verificado.** El estado real a septiembre de 2026:

| Configuración | Corrección funcional | Notas |
|---|---|---|
| seL4 x86-64 (sin MCS) | ✅ Verificada | Cubre el núcleo en C; **no** cubre VT-x, VT-d/IOMMU, código de arranque ni pruebas de seguridad/binario. |
| seL4 MCS en RISC-V 64 | ✅ **Verificada en 2026** (Proofcraft) | Hito histórico: primera prueba de corrección funcional de MCS. |
| seL4 MCS en AArch64 | 🔄 En progreso | Port de la prueba RISC-V dentro del programa DARPA PROVERS. |
| seL4 MCS en **x86-64** (plataforma ALIGNUX) | ❌ **Sin verificar** | ALIGNUX usará MCS sobre una configuración no verificada: hay que decirlo explícitamente en toda la documentación pública. |

Consecuencia de comunicación: en la plataforma inicial de ALIGNUX (x86-64 + MCS) **no hay cobertura de verificación formal del núcleo**. La propiedad verificada se hereda solo de la configuración x86-64 no-MCS. Si la verificación formal es un argumento comercial central, la hoja de ruta debe contemplar un perfil RISC-V/AArch64 como plataforma de referencia verificada.

---

## 2. Qué se compara

| Nombre | Categoría correcta | Papel comparable |
|---|---|---|
| seL4 | Microkernel de tercera generación, miembro de la familia L4 | Candidato a núcleo de ALIGNUX |
| GNU Hurd | Sistema multiservidor sobre GNU Mach | Fuente de ideas sobre servicios y traductores |
| GNU Mach | Microkernel de primera generación derivado de Mach | Núcleo real bajo Hurd |
| Fiasco + L4Re | Microkernel L4 + framework de usuario | Alternativa madura para sistemas componibles |
| «L4» | Familia y tradición de diseño | Conjunto de principios, no un binario seleccionable |

Esta distinción evita una comparación falsa entre un núcleo, un sistema completo y una familia. L4Re ejecuta únicamente el microkernel en modo privilegiado y sitúa cargadores, drivers, sistemas de archivos, VMM y demás servicios en usuario. GNU Hurd distribuye sistemas de archivos, red, autenticación y procesos entre servidores que se comunican mediante el IPC de GNU Mach.

## 3. Matriz técnica comparativa

| Criterio | seL4 | GNU Mach + Hurd | Fiasco + L4Re |
|---|---|---|---|
| Modelo | Microkernel mínimo, capacidades de objetos | Mach con puertos; Hurd como servidores y traductores | Microkernel L4, capacidades de objetos y runtime por capas |
| IPC base | Síncrono, mensajes pequeños y transferencia de capacidades; notificaciones separadas | Mensajes, puertos y conjuntos de puertos; colas, tipos, memoria fuera de línea y derechos transferibles | IPC síncrono no bufferizado, con etiquetas, *capability selector* y timeouts de envío/recepción |
| Control de acceso | Capacidades no falsificables en CSpace; `revoke` retira derivadas | Derechos de envío, envío único y recepción sobre puertos | Object capabilities, POLA, espacios de objetos |
| Tiempo de CPU | **MCS**: presupuesto y periodo como objeto delegable (verificado solo en RISC-V) | Planificación Mach; crítica histórica por contabilidad y atribución de recursos insuficientes | Tiempo real, time-sharing y virtualización concurrentes |
| Memoria | Untyped retipable; autoridad y descendencia explícitas | VM sofisticada y memory objects/pagers; mayor complejidad en kernel | Pager raíz y gestión de regiones en servicios de usuario |
| Drivers en usuario | Sí; sDDF y VMs de drivers Linux; ecosistema aún incompleto | Sí en el ideal; rump kernels de NetBSD suplen carencias | Sí; UART, NVMe, AHCI, red y gestión ACPI/PCIe disponibles |
| Recuperación | Mecanismos adecuados (PDs pasivas, jerarquía de fallos en Microkit); política a implementar en usuario | Servidores reiniciables en teoría, con dependencias históricas complejas | Servicios/componentes reiniciables según diseño del sistema |
| Verificación formal | **Ventaja decisiva**; cobertura publicada por configuración (ver §1.1) | Sin una cadena comparable | Sin una cadena pública equivalente a seL4 |
| x86-64 | Plataforma `pc99` en QEMU y hardware; configuración no-MCS verificada | x86-64 «esencialmente completo» (Guix, 2026); SMP aún inmaduro | x86-64 soportado; ACPI y drivers PCI/NVMe disponibles |
| Madurez como escritorio | No es un SO completo | Entorno GNU operativo (~75 % del archivo Debian compila), pero cobertura y SMP limitados | Framework amplio: VFS, GUI, drivers y VM |
| Ajuste a API nueva | Excelente | Bajo: su finalidad principal sigue siendo Unix/GNU | Bueno, aunque el framework incorpora abstracciones y convenciones propias |
| Riesgo de dependencia | Ecosistema reducido, curva de aprendizaje de capacidades | Deuda arquitectónica de Mach y compatibilidad Unix | Dependencia significativa del framework L4Re y C++/Lua |

## 4. Análisis por candidato

### 4.1 seL4

**Fortalezas**

- Mejor base de aseguramiento disponible: pruebas formales de corrección funcional y, para determinadas configuraciones, seguridad y corrección binaria. En 2026 se añadió la prueba de MCS en RISC-V.
- El núcleo expone mecanismos mínimos; las políticas de asignación, nombres, servicios y recuperación se construyen fuera —exactamente lo que ALIGNUX quiere controlar.
- Las capacidades representan autoridad sobre TCB, IRQ, memoria, endpoints y otros objetos; `revoke` permite retirar capacidades derivadas.
- MCS convierte el tiempo de CPU en un recurso explícito con presupuesto y periodo, evitando que un servidor sea un consumidor temporal invisible.
- Ecosistema de construcción alineado con la propuesta: Microkit (arquitectura estática declarativa), sDDF (drivers) y rust-sel4 (userspace en Rust), todos con releases compatibles entre sí (16.0.0 / 2.3.1 / 5.0.0).

**Debilidades y costes** *(sección ausente en el borrador)*

- **En x86-64 + MCS no hay verificación formal**: la ventaja distintiva se reduce sobre la plataforma inicial de ALIGNUX.
- Ecosistema de drivers incompleto: sDDF es joven; para NVMe, red o GPU habrá que escribir o portar drivers.
- Curva de aprendizaje pronunciada: modelo de capacidades, gestión manual de Untyped, ausencia de planificación dinámica fuera de MCS.
- Microkit es deliberadamente estático: cualquier dinamismo (crear/destruir componentes en caliente) exige construir un gestor propio —coste diferido pero real.
- Comunidad pequeña: soporte vía listas de correo y GitHub; los tiempos de respuesta no están garantizados.

### 4.2 GNU Mach + Hurd

**Fortalezas**

- Ideas arquitectónicas valiosas y directamente reutilizables como *diseño*, no como código: traductores (sistemas de archivos como servidores por usuario), autenticación como servidor, extensibilidad por composición.
- Entorno GNU completo y utilizable hoy sobre x86-64: ~75 % del archivo de Debian compila y Guix publicó el Hurd de 64 bits en marzo de 2026.

**Debilidades**

- GNU Mach es un microkernel de primera generación: IPC con colas y copia, VM compleja dentro del núcleo, contabilidad de recursos históricamente criticada (Walfield, 2007).
- SMP sigue inmaduro en 2026 pese a los patchsets recientes sobre gnumach.
- Sin cadena de verificación formal comparable.
- Su razón de ser es Unix/GNU: contradictorio con el objetivo de ALIGNUX de definir una API nueva sin POSIX fundacional.

### 4.3 Fiasco + L4Re

**Fortalezas**

- Alternativa L4 madura y completa: drivers (NVMe, AHCI, red, UART), ACPI/PCIe, VFS, GUI, virtualización concurrente con tiempo real.
- IPC síncrono no bufferizado con timeouts: modelo eficiente y bien documentado.
- x86-64 soportado con BSP amplio.

**Debilidades**

- Sin cadena pública de verificación formal equivalente a la de seL4.
- Adoptar L4Re implica adoptar su framework: convenciones de nombres, runtime por capas, C++/Lua —fricción directa con «API nueva, sin contratos heredados».
- Reutilizar L4Re ahorra meses de drivers pero importa sus decisiones de diseño; ALIGNUX pasaría a ser «una distribución de L4Re» más que un sistema propio.

## 5. Decisión y condiciones

**Decisión: seL4 16.0.0 + Microkit 2.3.1 + rust-sel4 5.0.0**, con MCS activado, servicios en Rust `no_std` y sin compatibilidad POSIX en el contrato base.

Condiciones que hacen sostenible la decisión:

1. **Honestidad de aseguramiento**: toda la documentación pública declarará qué está verificado y qué no, por plataforma (§1.1).
2. **Congelación de versiones** durante el MVP; las actualizaciones se evalúan por release notes, nunca por impulso.
3. **Microkit 2.3.x en x86-64** exige tratar el IOMMU como ciudadano de primera clase desde el primer driver con DMA (cambio incompatible introducido en 2.3.0).
4. El gestor dinámico propio es **fase 2**, condicionada a criterios de salida medibles del MVP (ver `02-roadmap.md`).
5. Hurd y L4Re quedan como **referentes de diseño**: traductores (Hurd) y catálogo de drivers (L4Re) se estudian, no se adoptan.

---

## Referencias verificadas (septiembre de 2026)

1. seL4 16.0.0 — release oficial (22-07-2026): https://github.com/seL4/seL4/releases
2. Anuncio conjunto seL4 16.0.0 / Microkit 2.3.0 / rust-sel4 5.0.0: https://sel4.systems/news/
3. Microkit — lista de releases (2.3.1, 18-09-2026): https://github.com/seL4/microkit/releases y https://trustworthy.systems/projects/microkit/
4. Microkit 2.3.0 — notas con cambios incompatibles en x86-64 (IOMMU, IOAPIC, VMs): https://docs.sel4.systems/releases/microkit/2.3.0.html
5. rust-sel4 — matriz de compatibilidad (5.0.0 ↔ seL4 16.0.0 + Microkit 2.3.0): https://docs.sel4.systems/projects/rust/releases.html
6. Proofcraft — «MCS seL4 now verified! (for RISC-V)», 2026: https://proofcraft.systems/news-2026/
7. seL4 — configuraciones verificadas: https://docs.sel4.systems/projects/sel4/verified-configurations.html
8. seL4 FAQ — estado de MCS: https://sel4.systems/About/FAQ.html
9. Guix — «The 64-bit Hurd is Here!» (marzo 2026): https://guix.gnu.org/en/blog/2026/the-64-bit-hurd/
10. Phoronix — estado de GNU/Hurd en FOSDEM 2026: https://www.phoronix.com/news/GNU-Hurd-In-2026
11. Microkit User Manual: https://docs.sel4.systems/projects/microkit/manual/latest/
12. Tutoriales seL4 — IPC, capacidades, MCS, Untyped: https://docs.sel4.systems/Tutorials/
13. Walfield & Brinkmann — *A Critique of the GNU Hurd Multi-Server Operating System* (2007): http://walfield.org/papers/200707-walfield-critique-of-the-GNU-Hurd.pdf
14. L4Re — arquitectura y conceptos: https://l4re.org/overview/architecture.html y https://l4re.org/detailed_introduction/architecture_concepts/index.html
15. sDDF — seL4 Device Driver Framework: https://github.com/sel4-cap/sDDF y https://trustworthy.systems/projects/drivers/
16. Manual de referencia seL4 16.0.0: https://sel4.systems/Info/Docs/ (sustituye al 10.1.1 citado en el borrador)
17. seL4 — plataforma PC99 (x86-64): https://docs.sel4.systems/Hardware/X64.html
