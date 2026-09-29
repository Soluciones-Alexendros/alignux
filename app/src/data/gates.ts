export const GATES = [
  { id: 'G0', name: 'Cimientos', order: 0 },
  { id: 'G1', name: 'Servicios', order: 1 },
  { id: 'G2', name: 'Drivers', order: 2 },
  { id: 'G3', name: 'SMP + dinámico', order: 3 },
  { id: 'G4', name: 'Hardware real', order: 4 },
  { id: 'G5', name: 'Compatibilidad', order: 5 },
] as const;

export const GATE_STATE_LABELS = {
  current: 'actual',
  pending: 'pendiente',
  passed: 'superada',
} as const;
