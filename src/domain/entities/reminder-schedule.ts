import { AppError } from '@/domain/errors/app-error';
import { LocalDate } from '@/domain/value-objects/local-date';
import { parseClockTime } from '@/domain/value-objects/time-range';

export interface ReminderScheduleProps {
  enabled: boolean;
  weekdays: number[];
  times: string[];
  snoozeMinutes: number;
  revision: number;
}
export interface ReminderOccurrence {
  slotId: string;
  when: number;
  targetLocalDate: string;
}

export class ReminderSchedule {
  private constructor(readonly props: Readonly<ReminderScheduleProps>) {}
  static create(props: ReminderScheduleProps): ReminderSchedule {
    const weekdays = [...new Set(props.weekdays)].sort();
    const times = [...new Set(props.times)].sort();
    if (
      weekdays.length === 0 ||
      weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
    ) {
      throw new AppError('VALIDATION', { weekdays: 'Selecione pelo menos um dia válido.' });
    }
    if (times.length === 0)
      throw new AppError('VALIDATION', { times: 'Informe pelo menos um horário.' });
    times.forEach(parseClockTime);
    if (
      !Number.isInteger(props.snoozeMinutes) ||
      props.snoozeMinutes < 1 ||
      props.snoozeMinutes > 2_880
    ) {
      throw new AppError('VALIDATION', {
        snoozeMinutes: 'O adiamento deve ficar entre 1 minuto e 48 horas.',
      });
    }
    return new ReminderSchedule({ ...props, weekdays, times });
  }

  nextOccurrences(now: Date, count = 16): ReminderOccurrence[] {
    if (!this.props.enabled) return [];
    const occurrences: ReminderOccurrence[] = [];
    const today = LocalDate.fromDate(now);
    for (let offset = 0; offset <= 14 && occurrences.length < count; offset += 1) {
      const localDate = today.addDays(offset);
      if (!this.props.weekdays.includes(localDate.dayOfWeek())) continue;
      const [year, month, day] = localDate.parts();
      for (const time of this.props.times) {
        const minute = parseClockTime(time);
        const when = new Date(year, month - 1, day, Math.floor(minute / 60), minute % 60).getTime();
        if (when > now.getTime())
          occurrences.push({
            slotId: `${localDate.value}@${time}`,
            when,
            targetLocalDate: localDate.value,
          });
      }
    }
    return occurrences.sort((a, b) => a.when - b.when).slice(0, count);
  }

  snooze(occurrence: ReminderOccurrence, minutes: number, now: Date): ReminderOccurrence {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 2_880)
      throw new AppError('VALIDATION', { snoozeMinutes: 'Use de 1 a 2.880 minutos.' });
    return {
      ...occurrence,
      slotId: `${occurrence.slotId}:snooze`,
      when: now.getTime() + minutes * 60_000,
    };
  }
}
