import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Holidays from 'date-holidays';

const now = new Date();
const currentYear = Number(process.env.LOGBOOK_HOLIDAY_YEAR || now.getFullYear());
const minYear = currentYear - 5;
const maxYear = currentYear + 2;
const target = path.resolve('public/data/holidays');
const staging = path.resolve('public/data/.holidays-staging');
const states = new Holidays('BR').getStates('BR');

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const stable = (value) => `${JSON.stringify(value, null, 2)}\n`;
const localDate = (holiday) => holiday.date.slice(0, 10);

await rm(staging, { recursive: true, force: true });
await mkdir(staging, { recursive: true });

let municipalities;
try {
  const response = await fetch(
    'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome',
  );
  if (!response.ok) throw new Error(`IBGE HTTP ${response.status}`);
  const raw = await response.json();
  municipalities = raw.map((item) => ({
    code: String(item.id),
    name: item.nome,
    uf: item['regiao-imediata']['regiao-intermediaria'].UF.sigla,
  }));
} catch (error) {
  const previous = await readFile(path.join(target, 'municipalities.json'), 'utf8').catch(
    () => undefined,
  );
  if (!previous) throw error;
  municipalities = JSON.parse(previous).municipalities;
}

const municipalityBody = stable({ source: 'IBGE Localidades', municipalities });
await writeFile(path.join(staging, 'municipalities.json'), municipalityBody, 'utf8');

const files = {};
for (let year = minYear; year <= maxYear; year += 1) {
  const nationalProvider = new Holidays('BR');
  const national = nationalProvider.getHolidays(year).filter((item) => item.type === 'public');
  const nationalKeys = new Set(national.map((item) => `${localDate(item)}|${item.name}`));
  const entries = national.map((item) => ({
    date: localDate(item),
    name: item.name,
    scope: 'national',
  }));
  for (const uf of Object.keys(states)) {
    const stateProvider = new Holidays('BR', uf);
    for (const item of stateProvider
      .getHolidays(year)
      .filter((holiday) => holiday.type === 'public')) {
      if (!nationalKeys.has(`${localDate(item)}|${item.name}`)) {
        entries.push({ date: localDate(item), name: item.name, scope: 'state', uf });
      }
    }
  }
  entries.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.scope.localeCompare(b.scope) ||
      (a.uf ?? '').localeCompare(b.uf ?? ''),
  );
  const body = stable({ year, entries });
  const fileName = `holidays-${year}.json`;
  await writeFile(path.join(staging, fileName), body, 'utf8');
  files[fileName] = sha256(body);
}

files['municipalities.json'] = sha256(municipalityBody);
const manifest = stable({
  schemaVersion: 1,
  revision: `${currentYear}.1-date-holidays-${Holidays.version ?? '3.35.0'}`,
  generatedAt: now.toISOString(),
  minYear,
  maxYear,
  states: Object.entries(states).map(([code, name]) => ({ code, name })),
  files,
  sources: [
    { name: 'date-holidays', license: 'MIT', url: 'https://github.com/commenthol/date-holidays' },
    {
      name: 'IBGE Localidades',
      license: 'dados públicos',
      url: 'https://servicodados.ibge.gov.br/api/docs/localidades',
    },
  ],
});
await writeFile(path.join(staging, 'manifest.json'), manifest, 'utf8');

const backup = `${target}.backup`;
await rm(backup, { recursive: true, force: true });
await rename(target, backup).catch(() => undefined);
try {
  await rename(staging, target);
  await rm(backup, { recursive: true, force: true });
} catch (error) {
  await rename(backup, target).catch(() => undefined);
  throw error;
}

console.log(
  `Holiday catalog generated for ${minYear}-${maxYear} (${municipalities.length} municipalities).`,
);
