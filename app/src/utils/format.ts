export function isoShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export function badgeFor(status: string | null | undefined): string {
  if (status === 'success') return '<span class="badge ok">verde</span>';
  if (status === 'failure') return '<span class="badge bad">rojo</span>';
  if (status === 'cancelled' || status === 'skipped') return '<span class="badge neutral">cancelado</span>';
  if (status === 'pending' || status === 'in_progress') return '<span class="badge pending">en curso</span>';
  return '<span class="badge neutral">' + (status || '—') + '</span>';
}

export function gateStateLabel(state: string): string {
  const labels: Record<string, string> = {
    current: 'actual',
    pending: 'pendiente',
    passed: 'superada',
  };
  return labels[state] || state;
}

export const GATE_NAMES: Record<string, string> = {
  G0: 'Cimientos',
  G1: 'Servicios',
  G2: 'Drivers',
  G3: 'SMP + dinámico',
  G4: 'Hardware real',
  G5: 'Compatibilidad',
};
