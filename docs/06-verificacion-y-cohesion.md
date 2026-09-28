# ALIGNUX 2026 — Cadena de verificación y cohesión

> **Documento 06 de la serie ALIGNUX 2026.** Cómo se verifica cada paso para que ningún error se propague. Dos ideas centrales: **pirámide de verificación** (cada tarea demuestra lo suyo en el nivel más barato posible) y **gates de fase** (ninguna fase empieza sin que la anterior pase su puerta completa). La ejecución automática vive en `07-pipelines-cicd.md`.

## 1. Pirámide de verificación (L0–L6)

| Nivel | Qué verifica | Cuándo corre | Duración máx. | Bloquea merge |
|---|---|---|---|---|
| **L0** Estática | Formato (`rustfmt`, `clang-format`), lint (`clippy -D warnings`), validación del SDF contra su esquema, IDL bien formada | Cada PR | < 3 min | ✅ |
| **L1** Unitaria | Lógica pura de cada servicio en host (Rust `test`), sin kernel | Cada PR | < 5 min | ✅ |
| **L2** Propiedades | Invariantes con property-based testing (proptest): memoria sin solapes ni fugas, anillos sin pérdida/corrupción, ACL de namesrv | Cada PR (10k casos) | < 10 min | ✅ |
| **L3** Integración | Build de imagen + arranque en QEMU + test de consola + RPC de extremo a extremo entre PDs | Cada PR y cada push a `main` | < 15 min | ✅ |
| **L4** Fallos | Inyección de fallos: matar PDs en plena operación, agotar presupuesto MCS, corromper anillo; verificar recuperación | Cada push a `main` | < 30 min | ✅ (en `main`) |
| **L5** Profunda | Fuzzing del decodificador IDL y parsers (24 h), property-based con 1M casos, mutation testing muestreado | Nightly | horas | ❌ (abre issue si falla) |
| **L6** Hardware | Suite completa en el AERO X16 (a partir de M4) | Release candidate | — | ✅ (para RC) |

**Regla de oro de la pirámide:** un fallo debe detectarse en el nivel más bajo posible. Si L3 caza algo que L1 podía cazar, se añade el test en L1 (la pirámide se alimenta de sus propios fallos).

## 2. Gates de fase (G0–G5)

Cada gate es una **puerta automática + checklist manual**. Ninguna tarea de la fase siguiente puede empezar (DoR, punto 2) hasta que el gate está en verde.

| Gate | Cierra la fase | Condiciones automáticas | Checklist manual |
|---|---|---|---|
| **G0** | M0 Cimientos | Build reproducible (mismo SHA-256 en 2 runners distintos); boot QEMU < 5 s; consola serie con eco; CI verde | Toolchain documentado; convenciones aprobadas (T0-08) |
| **G1** | M1 Servicios | L2 de `memgr` y `namesrv` verde; RPC tipado extremo a extremo; reinicio de PD < 50 ms medido en CI; presupuestos MCS activos y reportados | S-01…S-05 aprobadas; specs sin desviaciones pendientes |
| **G2** | M2 Drivers | Checksums de lectura/escritura correctos; IOMMU activa y acceso fuera de región contenido; inyección de fallos en `drv_block` sin corrupción | S-06, S-07 aprobadas; guía de driver reproducible por un tercero (T2-06) |
| **G3** | M3 SMP + dinámico | 1M mensajes SMP sin deadlock (T3-06); destrucción de PD con 0 capacidades fugadas (medido en árbol de derivación) | Modelo de amenaza del gestor dinámico aprobado (T3-03) |
| **G4** | M4 Hardware | Suite L2–L4 verde en el AERO X16; NVMe físico pasa el banco de M2 | Inventario ACPI/PCIe documentado (T4-02) |
| **G5** | M5 Compatibilidad | VM Linux aislada arranca y no puede salir de su perímetro (test de escape negativo) | Informe público de aseguramiento publicado (T5-03) |

## 3. Matriz de cohesión — quién valida a quién

Cada artefacto tiene un **consumidor** que lo valida y un **chequeo automático** que impide que una pieza rota avance:

| Artefacto | Lo valida | Chequeo automático | Rompe la cadena si… |
|---|---|---|---|
| Spec (S-xx) | Revisión + DoR de las tareas que cubre | Lint de plantilla; enlaces a tests existentes | Una tarea empieza sin spec aprobada |
| IDL (S-02) | Todos los servicios que la consumen | Compilación de bindings + test de compatibilidad de versión de contrato | Cambio incompatible sin bump de versión |
| SDF (S-03) | El sistema completo en cada build | Validación contra esquema en L0; diff de autoridad entre versiones | Una PD recibe más autoridad de la declarada |
| Código de servicio | L1/L2 propios + L3 del sistema | CI por PR | Merge con CI roja (prohibido por branch protection) |
| Imagen de sistema | L3/L4 | Hash reproducible + boot + suite | Hash distinto entre runners → alerta de toolchain |
| Roadmap (02) | Los gates | Gate en verde antes de abrir tareas de la fase siguiente | Tareas de M(N+1) abiertas con G(N) rojo |
| Riesgos (04) | Revisión al cierre de cada gate | Disparadores monitorizados | Disparador activado sin acción registrada |

## 4. Reglas anti-huecos (lo que NO puede pasar)

1. **Contratos versionados:** la IDL lleva número de versión; un cambio incompatible exige bump y doble binding (viejo+nuevo) durante una fase de transición. Nunca se rompe un consumidor en silencio.
2. **Autoridad declarativa:** toda capacidad de una PD sale del SDF; un test L3 compara la autoridad real en runtime contra la declarada («diff de autoridad»).
3. **Golden boot:** el log de arranque de referencia se guarda; L3 compara estructura (no timestamps) y falla ante desviaciones.
4. **Cobertura mínima:** servicios Rust ≥ 80 % de líneas; la cobertura solo puede subir (ratchet).
5. **Sin merges directos a `main`:** todo por PR con CI verde y revisión cruzada (branch protection).
6. **Trazabilidad obligatoria:** cada test referencia la tarea y la spec que demuestra (`// verifies: T1-02, S-05`). Un test huérfano es un aviso de hueco.

## 5. Tareas de verificación (backlog)

| ID | Tarea | Prio | Depende de | Criterio de aceptación |
|---|---|---|---|---|
| V-01 | Validador de SDF contra esquema (L0) | M | S-03 | SDF inválido → CI roja con mensaje claro |
| V-02 | Harness L3: boot QEMU + expect de consola + RPC e2e | M | T0-06, T0-07 | Corre en CI < 15 min con timeout y log archivado |
| V-03 | Diff de autoridad runtime vs SDF | M | S-01, T1-05 | PD con capacidad extra → test rojo |
| V-04 | Harness L4: inyección de fallos (matar PD, agotar MCS, corromper anillo) | M | T1-05, T2-01 | Recuperación demostrada en CI para cada fallo del catálogo |
| V-05 | Fuzzing IDL + parsers en nightly (L5) | S | T1-09 | 24 h sin panic; crash → issue automática con reproducción |
| V-06 | Ratchet de cobertura ≥ 80 % | S | T0-07 | Cobertura que baja → CI roja |
| V-07 | Test de reproducibilidad: mismo hash en 2 runners | M | T0-02 | Hashes distintos → bloqueo + alerta |
| V-08 | Golden boot log comparado en L3 | S | T0-04 | Desviación estructural del arranque → CI roja |
