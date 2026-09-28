export function isoShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export function badgeFor(status) {
  if (status === 'success') return '<span class="badge ok">verde</span>';
  if (status === 'failure') return '<span class="badge bad">rojo</span>';
  if (status === 'cancelled' || status === 'skipped') return '<span class="badge neutral">cancelado</span>';
  if (status === 'pending' || status === 'in_progress') return '<span class="badge pending">en curso</span>';
  return '<span class="badge neutral">' + (status || '—') + '</span>';
}

export function gateStateLabel(state) {
  const labels = { current: 'actual', pending: 'pendiente', passed: 'superada' };
  return labels[state] || state;
}

export const GATE_NAMES = {
  G0: 'Cimientos', G1: 'Servicios', G2: 'Drivers', G3: 'SMP + dinámico', G4: 'Hardware real', G5: 'Compatibilidad',
};
