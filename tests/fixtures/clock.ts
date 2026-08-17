import type { Clock, IdGenerator } from '@/application/ports/platform';

export class FixedClock implements Clock {
  constructor(private current: Date) {}
  now() {
    return new Date(this.current);
  }
  advance(minutes: number) {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}
export class SequentialIds implements IdGenerator {
  private index = 0;
  next() {
    this.index += 1;
    return `00000000-0000-4000-8000-${String(this.index).padStart(12, '0')}`;
  }
}
