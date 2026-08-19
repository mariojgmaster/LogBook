export type HolidayScope = 'national' | 'state' | 'municipal';

export interface HolidayOccurrence {
  date: string;
  name: string;
  scope: HolidayScope;
}
