import type { ProjectProps } from '@/domain/entities/project';

export const PROJECT_COLOR_SLOT_COUNT = 12;

export const assignProjectColorSlot = (projects: readonly ProjectProps[]): number => {
  const usage = Array.from({ length: PROJECT_COLOR_SLOT_COUNT }, () => 0);
  for (const project of projects) {
    if (project.colorSlot !== undefined) usage[project.colorSlot]! += 1;
  }
  return usage.reduce((best, count, slot) => (count < usage[best]! ? slot : best), 0);
};
