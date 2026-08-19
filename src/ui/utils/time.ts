import { formatDurationHours } from '@/application/services/duration-hours-codec';

export const formatMinutes = (value: number) => `${formatDurationHours(value)} h`;
