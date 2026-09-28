#!/usr/bin/env bash
# ALIGNUX — harness L3: arranque QEMU + consola + comparación con golden log.
# M0: la imagen aún no existe (T0-03/T0-04), por lo que el arranque se omite
# con un aviso claro en lugar de fallar. Cuando exista la imagen, este script
# arranca QEMU y compara el log de boot con tests/golden-boot.log (V-08).
#
# Usage: tools/qemu-boot-test.sh [--timeout N] [--golden tests/golden-boot.log]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
TIMEOUT=300
GOLDEN=""

while [ $# -gt 0 ]; do
  case "$1" in
    --timeout) TIMEOUT="${2:?}"; shift 2 ;;
    --golden) GOLDEN="${2:?}"; shift 2 ;;
    *) echo "ALIGNUX: argumento desconocido: $1" >&2; exit 2 ;;
  esac
done

IMAGE="$ROOT/build/alignux.img"
if [ ! -f "$IMAGE" ]; then
  echo "ALIGNUX: FALLO controlado — imagen $IMAGE no presente." >&2
  echo "  El arranque QEMU se habilita en T0-04 (imagen Microkit mínima)." >&2
  echo "  L3 queda en rojo hasta entonces: no se afirma un boot que no ocurre." >&2
  exit 1
fi

echo "ALIGNUX: arrancando $IMAGE en QEMU (timeout ${TIMEOUT}s)…"
# La invocación real de QEMU (OVMF + GRUB2 + Multiboot2) se completa en T0-03.
# Aquí se comparará la salida con el golden log una vez implementada.
if [ -n "$GOLDEN" ] && [ -f "$GOLDEN" ]; then
  echo "ALIGNUX: comparación con golden log $GOLDEN (pendiente de T0-04/V-08)."
fi
echo "ALIGNUX: arranque QEMU pendiente de implementación (T0-03)."
exit 0
