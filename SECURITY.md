# Política de seguridad

## Postura

ALIGNUX no está verificado como sistema completo. La corrección funcional de seL4 está verificada en x86-64 sin MCS; MCS lo está solo en RISC-V (Proofcraft, 2026). Cualquier afirmación de seguridad debe acotar exactamente qué componente, en qué configuración y contra qué modelo de amenaza.

## Versiones soportadas

| Rama / Versión | Soporte |
|---|---|
| `main` (desarrollo) | sí |
| releases `v0.x` | según [CHANGELOG.md](CHANGELOG.md) |

## Reportar una vulnerabilidad

**No abras un issue público.** Usa el reporte privado de GitHub en la pestaña *Security → Report a vulnerability* del repositorio. Incluye:

1. Componente y versión afectados (o commit).
2. Descripción del problema y su impacto.
3. Pasos mínimos de reproducción.
4. Si es posible, un exploit de prueba (proof-of-concept).

Plazo de acuse: 7 días. Coordinaremos una corrección y un aviso (advisory) antes de publicar detalles.

## Ámbitos fuera del perímetro verificado

Por decisión aceptada (ver `docs/00-dictamen-tecnico-revisado.md` y `docs/04-riesgos.md`), estos ámbitos **no** se consideran verificados y no se presentarán como tales:

- Cadena de arranque (bootloader) previa al kernel.
- Pruebas binarias de seguridad en x86-64.
- MCS en x86-64 (verificado solo en RISC-V).

## Coordinación

Los hallazgos se registran con etiqueta `riesgo` y se cruzan con la tabla de riesgos R-01…R-11. Un hallazgo que dispare un riesgo aceptado se trata como «cadena rota» (ver `docs/08-produccion-y-release.md`).
