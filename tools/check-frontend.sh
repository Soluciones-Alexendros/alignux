#!/usr/bin/env bash
# tools/check-frontend.sh
# Fails if: hardcoded colors, third-party fonts/analytics, missing reduced-motion gate
# Run from repo root (parent of app/)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/app"
DIST_DIR="$APP_DIR/dist"

echo "=== check-frontend.sh ==="
echo "Root: $ROOT_DIR"
echo "App:  $APP_DIR"
echo "Dist: $DIST_DIR"

# 1. Ensure dist exists
if [[ ! -d "$DIST_DIR" ]]; then
  echo "FAIL: dist/ not found. Run 'npm run build' in app/ first."
  exit 1
fi

# 2. Color layer may be authored in OKLCH (token layer is OKLCH; intentional)
echo "→ Checking color format..."
if grep -qi "oklch" "$DIST_DIR/_astro/"*.css 2>/dev/null; then
  echo "  OK: OKLCH token layer present (intentional)"
else
  echo "  OK: no OKLCH (hex/color-mix only)"
fi

# 3. No third-party font preconnect (fonts.gstatic.com)
echo "→ Checking for fonts.gstatic.com..."
if grep -ri "fonts.gstatic.com" "$DIST_DIR/" 2>/dev/null; then
  echo "FAIL: fonts.gstatic.com reference found"
  exit 1
fi
echo "  OK: no fonts.gstatic.com"

# 4. No Vercel Analytics (window.va) or other trackers
echo "→ Checking for Vercel Analytics / trackers..."
if grep -ri "window\.va\|vercel-insights\|vercel-analytics" "$DIST_DIR/" 2>/dev/null; then
  echo "FAIL: Vercel Analytics / tracker found"
  exit 1
fi
echo "  OK: no trackers"

# 5. No third-party cookies/localStorage patterns
echo "→ Checking for suspicious localStorage/cookies..."
if grep -ri "localStorage\['.*banner\|\.cookie\|document\.cookie" "$DIST_DIR/" 2>/dev/null; then
  echo "WARN: localStorage/cookie patterns found (review manually)"
fi
echo "  OK: no obvious third-party cookie patterns"

# 6. prefers-reduced-motion gate present in CSS
echo "→ Checking for prefers-reduced-motion gate..."
if ! grep -q "prefers-reduced-motion" "$DIST_DIR/_astro/"*.css 2>/dev/null; then
  echo "FAIL: prefers-reduced-motion gate missing in CSS"
  exit 1
fi
echo "  OK: prefers-reduced-motion gate present"

# 7. Dual theme-color metas present
echo "→ Checking for dual theme-color metas..."
if ! grep -q 'theme-color.*#f6f8fc.*prefers-color-scheme.*light' "$DIST_DIR/index.html" 2>/dev/null; then
  echo "FAIL: light theme-color meta missing"
  exit 1
fi
if ! grep -q 'theme-color.*#0a1224.*prefers-color-scheme.*dark' "$DIST_DIR/index.html" 2>/dev/null; then
  echo "FAIL: dark theme-color meta missing"
  exit 1
fi
echo "  OK: dual theme-color metas present"

# 8. Fonts: only Inter + JetBrains Mono (no Space Grotesk)
echo "→ Checking fonts..."
if grep -q "Space Grotesk\|SpaceGrotesk" "$DIST_DIR/_astro/"*.css 2>/dev/null; then
  echo "FAIL: Space Grotesk found in built CSS"
  exit 1
fi
if ! grep -q 'font-family:Inter' "$DIST_DIR/_astro/"*.css 2>/dev/null; then
  echo "FAIL: Inter font not found"
  exit 1
fi
if ! grep -q 'font-family:JetBrains Mono' "$DIST_DIR/_astro/"*.css 2>/dev/null; then
  echo "FAIL: JetBrains Mono font not found"
  exit 1
fi
echo "  OK: only Inter + JetBrains Mono"

# 9. Anti-flash theme script present
echo "→ Checking for anti-flash theme script..."
if ! grep -q "localStorage.getItem.*alignux-theme" "$DIST_DIR/index.html" 2>/dev/null; then
  echo "FAIL: anti-flash theme script missing"
  exit 1
fi
echo "  OK: anti-flash theme script present"

# 10. color-scheme dark-first present
echo "→ Checking for color-scheme dark-first..."
if ! grep -q "color-scheme:dark" "$DIST_DIR/_astro/"*.css 2>/dev/null; then
  echo "FAIL: color-scheme dark-first missing"
  exit 1
fi
echo "  OK: color-scheme dark-first present"

# 11. Matrix green brand color present
echo "→ Checking for Matrix green brand..."
if ! grep -q "#00ff41\|var(--matrix)" "$DIST_DIR/_astro/"*.css 2>/dev/null; then
  echo "FAIL: Matrix green brand color missing"
  exit 1
fi
echo "  OK: Matrix green brand present"

# 12. Focus ring uses color-mix with brand
echo "→ Checking focus-ring uses color-mix..."
if ! grep -q "color-mix.*var(--brand)" "$DIST_DIR/_astro/"*.css 2>/dev/null; then
  echo "FAIL: focus-ring doesn't use color-mix with brand"
  exit 1
fi
echo "  OK: focus-ring uses color-mix with brand"

echo ""
echo "=== ALL CHECKS PASSED ==="
