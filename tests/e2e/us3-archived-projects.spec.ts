import { test, expect } from './extension-fixture';
import { seedProject, seedRecord, send } from './helpers';

type ProjectResult = {
  id: string;
  name: string;
  status: 'active' | 'archived';
  revision: number;
};

test('keeps an archived card on restore conflicts and retries without losing linked records', async ({
  page,
}) => {
  const original = await seedProject(page, 'Projeto Histórico');
  await seedRecord(page, original.id, 'Registro preservado');
  const archived = await send<ProjectResult>(page, {
    type: 'project.archive',
    payload: { id: original.id, expectedRevision: original.revision },
  });
  const duplicate = await seedProject(page, 'PROJETO HISTÓRICO');

  await page.getByRole('menuitem', { name: 'Projetos' }).click();
  await page.getByText('Arquivados', { exact: true }).click();
  const originalCard = page.getByRole('group', { name: original.name, exact: true });
  await originalCard.getByRole('button', { name: 'Restaurar' }).click();
  await expect(originalCard.getByRole('alert')).toContainText('Já existe');
  await expect(originalCard).toBeFocused();

  await send(page, {
    type: 'project.archive',
    payload: { id: duplicate.id, expectedRevision: duplicate.revision },
  });
  await expect(page.getByRole('group', { name: duplicate.name, exact: true })).toBeVisible();
  await originalCard.getByRole('button', { name: 'Restaurar' }).click();
  await expect(originalCard).toHaveCount(0);

  const projects = await send<ProjectResult[]>(page, {
    type: 'project.list',
    payload: { includeArchived: true },
  });
  const restored = projects.find((project) => project.id === archived.id);
  expect(restored?.status).toBe('active');
  await send(page, {
    type: 'project.archive',
    payload: { id: restored?.id, expectedRevision: restored?.revision },
  });
  await expect(originalCard).toBeVisible();
  await originalCard.getByRole('button', { name: 'Remover' }).click();
  await page.getByRole('button', { name: 'Remover definitivamente' }).click();
  await expect(originalCard.getByRole('alert')).toContainText('registros vinculados');
  await expect(originalCard).toBeFocused();
});

test('removes an empty archived project only after named irreversible confirmation', async ({
  page,
}) => {
  const project = await seedProject(page, 'Projeto Descartável');
  await send(page, {
    type: 'project.archive',
    payload: { id: project.id, expectedRevision: project.revision },
  });

  await page.getByRole('menuitem', { name: 'Projetos' }).click();
  await page.getByText('Arquivados', { exact: true }).click();
  const card = page.getByRole('group', { name: project.name, exact: true });
  await card.getByRole('button', { name: 'Remover' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(`Remover “${project.name}”?`);
  await expect(dialog).toContainText('irreversível');
  await dialog.getByRole('button', { name: 'Remover definitivamente' }).click();
  await expect(card).toHaveCount(0);
});
