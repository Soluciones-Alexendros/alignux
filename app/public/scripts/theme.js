const THEME_KEY = 'alignux-theme';
const THEMES = ['system', 'dark', 'light'] as const;
type Theme = typeof THEMES[number];

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getEffectiveTheme(theme: Theme): 'dark' | 'light' {
  return theme === 'system' ? getSystemTheme() : theme;
}

function applyTheme(theme: Theme) {
  const effective = getEffectiveTheme(theme);
  document.documentElement.setAttribute('data-theme', effective);
  localStorage.setItem(THEME_KEY, theme);
  updateToggleButton(theme);
}

function updateToggleButton(theme: Theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const labels: Record<Theme, string> = {
    system: 'Sistema',
    dark: 'Oscuro',
    light: 'Claro',
  };
  btn.textContent = labels[theme];
  btn.setAttribute('aria-label', `Tema actual: ${labels[theme]}. Click para cambiar.`);
}

function createToggleButton() {
  const container = document.querySelector('.theme-toggle-container');
  if (!container) return;

  const btn = document.createElement('button');
  btn.id = 'theme-toggle';
  btn.type = 'button';
  btn.className = 'theme-toggle-btn';
  btn.style.cssText = `
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    padding: 6px 12px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--fg);
    cursor: pointer;
    transition: border-color var(--duration-fast), background-color var(--duration-fast);
  `;

  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  const initialTheme = (stored && THEMES.includes(stored)) ? stored : 'system';
  updateToggleButton(initialTheme);

  btn.addEventListener('click', () => {
    const current = (localStorage.getItem(THEME_KEY) as Theme) || 'system';
    const idx = THEMES.indexOf(current);
    const next = THEMES[(idx + 1) % THEMES.length];
    applyTheme(next);
  });

  container.appendChild(btn);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = (localStorage.getItem(THEME_KEY) as Theme) || 'system';
    if (current === 'system') {
      applyTheme('system');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createToggleButton);
} else {
  createToggleButton();
}
