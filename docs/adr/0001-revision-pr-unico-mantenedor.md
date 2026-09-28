# ADR-0001: Revisión de PR en proyecto con un único mantenedor

- **Estado:** Aceptado
- **Fecha:** 2026-09-28
- **Decisores:** Alexendros (único mantenedor)

## Contexto

La Misión 1.3 exige «1 aprobación cruzada» como requisito de merge en `main`. GitHub impide que el autor de un PR apruebe su propio cambio (error: _Can not approve your own pull request_). Con un único mantenedor, `required_approving_review_count = 1` bloquearía el 100 % de los merges de forma irreversible.

## Decisión

1. `required_approving_review_count = 0` y `require_code_owner_reviews = false` en la protección de `main`.
2. La revisión cruzada se exige por proceso, no por mecanismo: la plantilla de PR incluye el checklist de DoD (revisión cruzada explícita, «revisor ≠ autor»), y `CODEOWNERS` asigna dueños por subsistema (`/services/`, `/drivers/`, `/idl/`, `/specs/`, `/.github/workflows/`).
3. Cuando exista un segundo mantenedor, esta decisión se revisará y se subirá el recuento de aprobaciones requeridas.

## Consecuencias

- Se mantiene el resto de la protección de `main`: PR obligatorio, historial lineal, sin force-push, sin borrado, checks verdes, e `enforce_admins`.
- La trazabilidad (`verifies: T-x, S-x`) y el DoD siguen siendo la barrera de calidad, ahora apoyados en CODEOWNERS y en el checklist de PR.

## Alternativas consideradas

- Mantener `required_approving_review_count = 1`: inviable (bloqueo total).
- Añadir un bot de revisión automática: descartado en M0 por sobrecoste sin revisor humano.
