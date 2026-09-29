export function initTabs(initialTab?: string) {
  const tabs = document.querySelectorAll('.tab-btn[role="tab"]');
  const panels = document.querySelectorAll('section.panel[role="tabpanel"]');

  function activate(id: string) {
    tabs.forEach(t => {
      const sel = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', String(sel));
      t.tabIndex = sel ? 0 : -1;
    });
    panels.forEach(p => p.setAttribute('data-active', String(p.id === `panel-${id}`)));

    const activePanel = document.getElementById(`panel-${id}`);
    if (activePanel) {
      triggerTypewriter(activePanel);
      triggerScrollReveal(activePanel);
    }
  }

  if (initialTab) {
    activate(initialTab);
  } else {
    const activeTab = document.querySelector('.tab-btn[aria-selected="true"]');
    if (activeTab) {
      activate(activeTab.getAttribute('aria-controls') || 'estado');
    }
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activate(t.getAttribute('aria-controls') || ''));
    t.addEventListener('keydown', (e: KeyboardEvent) => {
      let idx = -1;
      if (e.key === 'ArrowRight') idx = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') idx = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') idx = 0;
      else if (e.key === 'End') idx = tabs.length - 1;
      if (idx >= 0) {
        tabs[idx].focus();
        activate(tabs[idx].getAttribute('aria-controls') || '');
        e.preventDefault();
      }
    });
  });
}

export function initPanels() {
  const panels = document.querySelectorAll('section.panel[role="tabpanel"]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.getAttribute('data-active') === 'true') {
        triggerTypewriter(entry.target as HTMLElement);
        triggerScrollReveal(entry.target as HTMLElement);
      }
    });
  }, { rootMargin: '0px', threshold: 0.1 });

  panels.forEach(p => observer.observe(p));
}

function triggerTypewriter(panel: HTMLElement) {
  const elements = panel.querySelectorAll('.terminal-typewriter:not(.done)');
  elements.forEach((el, i) => {
    const text = el.textContent || '';
    el.textContent = '';
    el.classList.add('typing');
    setTimeout(() => typewriter(el as HTMLElement, text), i * 60);
  });
}

function typewriter(el: HTMLElement, text: string, speed = 30) {
  let i = 0;
  function tick() {
    if (i < text.length) {
      el.textContent += text[i++];
      requestAnimationFrame(tick);
    } else {
      el.classList.remove('typing');
      el.classList.add('done');
    }
  }
  setTimeout(tick, speed);
}

function triggerScrollReveal(panel: HTMLElement) {
  const elements = panel.querySelectorAll('.reveal-up:not(.revealed), .reveal-fade:not(.revealed)');
  elements.forEach((el, i) => {
    (el as HTMLElement).style.transitionDelay = `${i * 60}ms`;
    requestAnimationFrame(() => el.classList.add('revealed'));
  });
}
