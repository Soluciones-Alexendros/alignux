import { isoShort, badgeFor, gateStateLabel, GATE_NAMES } from '/src/utils/format.js';
import { SOURCES } from '/src/data/sources.js';
import { RISKS } from '/src/data/risks.js';
import { initTypewriters } from '/src/scripts/terminal-typewriter.js';

const REPO = 'Soluciones-Alexendros/alignux';
const ISSUES_URL = `https://github.com/${REPO}/issues`;

interface StatusData {
  generated_at: string;
  data_fresh: boolean;
  last_good_at: string | null;
  phase_current: string;
  gates: Array<{ id: string; state: 'current' | 'pending' | 'passed' }>;
  tasks: {
    total: number;
    must: number;
    should: number;
    could: number;
    by_phase: Record<string, number>;
  };
  ci: {
    main: { status: string; last_run: string; url: string } | null;
    nightly: { status: string; last_run: string; url: string } | null;
    last_run: string | null;
  };
  milestones: Array<{ id: string; due: string; open: number; closed: number }>;
  risks_active: number;
  pin: { sel4: string; microkit: string; rust_sel4: string };
}

function renderFuentes() {
  const grid = document.getElementById('fuentes-grid');
  if (!grid) return;
  grid.innerHTML = SOURCES.map(([title, url, desc]) =>
    `<a class="card-link" href="${url}" target="_blank" rel="noopener" title="${desc}">
       <h4>${title}</h4>
       <p class="muted" style="font-size:.85rem">${desc}</p>
     </a>`
  ).join('');
}

function renderRisks() {
  const el = document.getElementById('riesgos-lista');
  if (!el) return;
  el.innerHTML = '<div class="grid g2" style="margin-top:var(--space-3)">' + RISKS.map(([id, sev, title, desc]) =>
    `<div class="card"><h4>${id} · ${title}</h4>
       <span class="badge ${sev === 'high' ? 'bad' : 'neutral'}">severidad ${sev}</span>
       <p class="muted" style="font-size:.85rem;margin-top:var(--space-2)">${desc}</p></div>`
  ).join('') + '</div>';
}

function renderStatus(data: StatusData) {
  const aviso = document.getElementById('aviso');
  const fresh = document.getElementById('footer-fresh');

  if (!data.data_fresh) {
    aviso.hidden = false;
    aviso.className = 'banner error';
    aviso.innerHTML = `<strong>Datos no disponibles.</strong> La API de GitHub no respondió en la última exportación. Última fecha con datos buenos: <code>${data.last_good_at ? isoShort(data.last_good_at) : 'nunca'}</code>.`;
  }

  if (fresh) fresh.textContent = `· última exportación ${isoShort(data.generated_at)}`;

  const pin = data.pin || {};
  const t = data.tasks || { total: 0, must: 0, should: 0, could: 0, by_phase: {} };

  const estadoEl = document.getElementById('estado-dinamico');
  if (estadoEl) {
    estadoEl.innerHTML = `
      <h3 class="reveal-up">Estado en vivo</h3>
      <div class="grid g3" style="margin:var(--space-4) 0">
        <div class="card reveal-up"><div class="stat">${data.phase_current || '—'}</div><div class="stat-label">fase actual</div></div>
        <div class="card reveal-up"><div class="stat">${t.total || 0}</div><div class="stat-label">tareas en backlog</div></div>
        <div class="card reveal-up"><div class="stat">${data.risks_active != null ? data.risks_active : '—'}</div><div class="stat-label">riesgos activos</div></div>
      </div>
      <div class="grid g2" style="margin-top:var(--space-3)">
        <div class="card reveal-up"><h4>Pin congelado</h4>
          <div class="kv"><span class="k">seL4</span><span class="v">${pin.sel4 || '—'}</span></div>
          <div class="kv"><span class="k">Microkit</span><span class="v">${pin.microkit || '—'}</span></div>
          <div class="kv"><span class="k">rust-sel4</span><span class="v">${pin.rust_sel4 || '—'}</span></div></div>
        <div class="card reveal-up"><h4>CI</h4>
          <div class="kv"><span class="k">main</span>${badgeFor(data.ci?.main?.status || null)}</div>
          <div class="kv"><span class="k">nightly</span>${badgeFor(data.ci?.nightly?.status || null)}</div>
          <div class="kv"><span class="k">último run</span><span class="v">${isoShort(data.ci?.last_run || null)}</span></div></div>
      </div>
      <p class="muted reveal-up" style="margin-top:var(--space-4)">Verificado a fecha de <code>${isoShort(data.generated_at)}</code>. El aseguramiento se comunica por plataforma y configuración; véase la pestaña <em>Fuentes</em>.</p>
    `;
  }

  const roadmapEl = document.getElementById('roadmap-dinamico');
  if (roadmapEl) {
    roadmapEl.innerHTML = (data.milestones || []).map(m => {
      const tot = m.open + m.closed;
      const pct = tot > 0 ? Math.round(100 * m.closed / tot) : 0;
      const cur = data.phase_current === m.id;
      return `<a class="card-link reveal-up" style="margin-bottom:var(--space-3)" href="${ISSUES_URL}?q=milestone%3A%22${encodeURIComponent(m.id)}%22" target="_blank" rel="noopener">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <h4>${m.id} ${cur ? '<span class="badge pending">actual</span>' : ''}</h4>
          <span class="muted" style="font-family:var(--font-mono);font-size:.8rem">${m.open} abiertas · ${m.closed} cerradas · vence ${m.due}</span>
        </div>
        <div class="bar" style="margin-top:var(--space-2)"><span style="width:${pct}%"></span></div>
      </a>`;
    }).join('');
  }

  const phases = ['M0','M1','M2','M3','M4','M5','S','V','CI','P'];
  const tareasEl = document.getElementById('tareas-dinamico');
  if (tareasEl) {
    tareasEl.innerHTML = `
      <div class="grid g3 reveal-up" style="margin:var(--space-4) 0">
        <div class="card"><div class="stat">${t.must || 0}</div><div class="stat-label">prio:must</div></div>
        <div class="card"><div class="stat">${t.should || 0}</div><div class="stat-label">prio:should</div></div>
        <div class="card"><div class="stat">${t.could || 0}</div><div class="stat-label">prio:could</div></div>
      </div>
      <div class="card reveal-up"><h4>Por fase</h4>${phases.map(p => {
        const n = (t.by_phase && t.by_phase[p]) || 0;
        return `<div class="kv"><span class="k">${p}</span><span class="v">${n}</span></div>`;
      }).join('')}</div>
    `;
  }

  const gatesEl = document.getElementById('gates-dinamico');
  if (gatesEl) {
    gatesEl.innerHTML = (data.gates || []).map(g =>
      `<div class="gate reveal-up"><span class="dot ${g.state || 'pending'}"></span>
        <div><strong>${g.id} — ${GATE_NAMES[g.id] || ''}</strong>
        <span class="muted">(${gateStateLabel(g.state)})</span></div></div>`
    ).join('');
  }

  const riesgosCountEl = document.getElementById('riesgos-dinamico');
  if (riesgosCountEl) {
    riesgosCountEl.innerHTML = `<div class="card reveal-up" style="margin:var(--space-4) 0;display:inline-block"><div class="stat">${data.risks_active != null ? data.risks_active : '—'}</div><div class="stat-label">riesgos activos</div></div>`;
  }
}

async function load() {
  renderFuentes();
  renderRisks();

  try {
    const res = await fetch('status.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: StatusData = await res.json();
    renderStatus(data);
    initTypewriters();
  } catch (e) {
    const aviso = document.getElementById('aviso');
    aviso.hidden = false;
    aviso.className = 'banner error';
    aviso.innerHTML = '<strong>Datos no disponibles.</strong> No se pudo cargar <code>status.json</code>. El panel sigue siendo legible; los datos vivos volverán cuando se publique la exportación.';

    document.getElementById('estado-dinamico')!.innerHTML = '<p class="muted">Sin datos vivos.</p>';
    document.getElementById('roadmap-dinamico')!.innerHTML = '<p class="muted">Sin datos de milestones.</p>';
    document.getElementById('tareas-dinamico')!.innerHTML = '<p class="muted">Sin contadores.</p>';
    document.getElementById('gates-dinamico')!.innerHTML = '<p class="muted">Sin puertas.</p>';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', load);
} else {
  load();
}
