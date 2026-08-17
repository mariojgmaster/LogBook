export const formatMinutes = (value: number) =>
  `${Math.floor(value / 60)}h ${String(value % 60).padStart(2, '0')}min`;
