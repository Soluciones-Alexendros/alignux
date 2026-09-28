# ALIGNUX 2026 — Especificación y concreción

> **Documento 05 de la serie ALIGNUX 2026.** Qué hay que concretar *antes* de escribir código, y en qué orden. Regla rectora: **ninguna tarea de desarrollo entra en ejecución sin su especificación aprobada** (Definition of Ready). Esto elimina los huecos de diseño que luego rompen la cadena.

## 1. Definition of Ready (DoR) — cuándo una tarea puede empezar

Una tarea `T` solo pasa a «en curso» si cumple TODO:

1. Existe una spec o ADR que la cubre (columna «Cubre» de la tabla de abajo).
2. Sus dependencias están cerradas (no solo «en curso»).
3. Tiene criterio de aceptación medible (ya exigido en `03-tareas.md`).
4. Tiene asignado al menos un test de verificación del nivel que le corresponde (ver `06`, pirámide L0–L6).
5. Interfaces que toca identificadas: si modifica la IDL, el SDF o el modelo de capacidades, la tarea referencia la versión del contrato.

## 2. Especificaciones pendientes (backlog de concreción)

| ID | Especificación | Contenido mínimo | Cubre a | Estado |
|---|---|---|---|---|
| S-01 | **Modelo de capacidades ALIGNUX** | Qué objetos seL4 usa cada PD, derechos exactos, política de `revoke`, árbol de derivación esperado | T1-02, T1-03, T3-04, T3-05 | ⬜ |
| S-02 | **IDL v1 (lenguaje de interfaces)** | Gramática, tipos, generación de bindings Rust, versionado de contratos, política de cambio incompatible | T1-01, T1-09 | ⬜ |
| S-03 | **Esquema SDF y convenciones** | Layout del System Description File, naming, validación XSD/propia, reglas de composición | T0-04, T0-08, todas las PD | ⬜ |
| S-04 | **Modelo de seguridad y amenazas** | Adversario, activos, perímetro de confianza (qué se fía del kernel, qué no), análisis por PD | T3-03, R-01, R-11 | ⬜ |
| S-05 | **Contrato de memoria** | Partición de Untyped, cuotas, retipeo permitido, invariantes de `memgr` (sin solapes, sin fugas, contabilidad exacta) | T1-02, T1-08 | ⬜ |
| S-06 | **Protocolo de anillos (datos)** | Formato de anillo sDDF-ALIGNUX: cabeceras, índices, orden de memoria, recuperación tras caída del productor/consumidor | T0-06, T2-01, T2-05 | ⬜ |
| S-07 | **Política de recuperación** | Jerarquía padre-hija, quién reinicia a quién, estado que se conserva/pierde, límites de reintento | T1-05, T2-04 | ⬜ |
| S-08 | **API pública nativa v0.1** | Superficie que ven las aplicaciones: qué existe, qué no (sin POSIX), estabilidad por versión | M5, W-02 | ⬜ (fase tardía) |

## 3. Plantilla mínima de spec

Toda spec cabe en 2-4 páginas y sigue esta estructura fija:

```
1. Propósito (una frase)
2. Ámbito y no-objetivos explícitos
3. Definiciones y contrato (tipos, invariantes, pre/postcondiciones)
4. Casos límite y comportamiento ante fallos
5. Interfaces afectadas (IDL/SDF/capacidades) y versión del contrato
6. Criterios de verificación (qué tests L0–L6 la demuestran)
7. Riesgos asociados (enlace a 04-riesgos.md)
```

## 4. Definition of Done (DoD) — cuándo una tarea está cerrada

1. Código + tests en `main` con CI verde.
2. Criterio de aceptación demostrado automáticamente (no «lo probé en mi máquina»).
3. Spec actualizada si la implementación se desvió (la desviación sin spec actualizada = tarea NO cerrada).
4. Revisión cruzada: al menos un revisor que no es el autor.
5. Sin regresión de los gates ya superados (el gate de la fase se re-ejecuta).
6. Métricas registradas: cobertura, tiempo de boot, consumo MCS si aplica.

## 5. Proceso de decisiones (ADR)

- Todo cambio estructural se registra como ADR numerado (los ADR-01…08 de `01-arquitectura.md` son la base).
- Un ADR puede ser **propuesto → aceptado → obsoleto/sustituido**, nunca editado retroactivamente.
- Si una implementación contradice un ADR aceptado, se detiene el merge hasta resolver: o nuevo ADR, o corrección del código.
