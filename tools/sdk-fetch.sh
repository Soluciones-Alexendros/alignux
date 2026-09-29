#!/usr/bin/env bash
# ALIGNUX — fetch and verify the seL4/Microkit SDK against VERSIONS.toml.
#
# M0: controlled failure is CORRECT when the SDK is absent or the SHA-256 is
# not yet pinned. The real download + integrity check lands in T0-02.
#
# Usage:
#   tools/sdk-fetch.sh                  # fetch/check SDK
#   tools/sdk-fetch.sh --verify-sha256  # fail unless SHA-256 is pinned
#   tools/sdk-fetch.sh --check-ready    # exit 0 only if SDK is fetchable+verifiable
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
VERSIONS="$ROOT/VERSIONS.toml"
SDK_DIR="$ROOT/sdk"

get_field() {
  # get_field <section> <key>  -> value (strips quotes/comments)
  awk -v sec="$1" -v key="$2" '
    $0 ~ "^\\[" { in_sec = ($0 ~ "^\\[" sec "\\]") }
    in_sec && $1 == key {
      sub(/^[^=]*=[[:space:]]*/, "");
      sub(/[[:space:]]*#.*$/, "");
      gsub(/"/, "");
      print; exit
    }' "$VERSIONS"
}

SEL4_SHA="$(get_field "sel4" "sha256")"
SEL4_VER="$(get_field "sel4" "version")"
MICROKIT_VER="$(get_field "microkit" "version")"

pin_pending() {
  [ -z "$SEL4_SHA" ] || [ "$SEL4_SHA" = "PENDIENTE" ]
}

pending_reason() {
  if pin_pending; then
    echo "SHA-256 sin fijar en $VERSIONS (seL4 $SEL4_VER, Microkit $MICROKIT_VER)."
  elif [ ! -d "$SDK_DIR" ]; then
    echo "SDK no presente en $SDK_DIR."
  fi
}

if [ "${1:-}" = "--check-ready" ]; then
  if pin_pending || [ ! -d "$SDK_DIR" ]; then
    echo "ALIGNUX: SDK no listo — $(pending_reason)"
    echo "  Etapa esperada en M0; se habilita tras T0-02."
    exit 1
  fi
  echo "ALIGNUX: SDK listo en $SDK_DIR (SHA-256 fijado)."
  exit 0
fi

if [ "${1:-}" = "--verify-sha256" ]; then
  if pin_pending; then
    echo "ALIGNUX: ERROR — SHA-256 del SDK aún no fijado en $VERSIONS." >&2
    echo "  Pin de versión fijado: seL4 $SEL4_VER, Microkit $MICROKIT_VER, rust-sel4 (ver VERSIONS.toml)." >&2
    echo "  Completa el checksum desde el manifiesto oficial antes del primer build real (T0-02)." >&2
    echo "  Este fallo controlado es esperado en M0." >&2
    exit 1
  fi
fi

if [ ! -d "$SDK_DIR" ]; then
  echo "ALIGNUX: ERROR — SDK no presente en $SDK_DIR." >&2
  echo "  Descarga e instala el SDK (T0-02) y fija su SHA-256 en $VERSIONS.toml." >&2
  echo "  Este fallo controlado es esperado en M0." >&2
  exit 1
fi

echo "ALIGNUX: SDK presente en $SDK_DIR."
echo "ALIGNUX: verificación de integridad SHA-256 pendiente de T0-02 (manifiesto oficial)."
exit 0
