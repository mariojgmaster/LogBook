import { test, expect } from './extension-fixture';
import { seedProject, seedRecord } from './helpers';
test('creates a project, validates an empty record and persists a task after reopen', async ({
  page,
}) => {
  await page.getByRole('menuitem', { name: 'Projetos' }).click();
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  await page.getByLabel('Nome').fill('Projeto UI');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Projeto UI', { exact: true })).toBeVisible();
  const project = await seedProject(page, 'Projeto Persistente');
  await seedRecord(page, project.id, 'Registro persistido');
  await page.reload();
  await page.getByRole('menuitem', { name: /Di.rio/ }).click();
  await expect(page.getByText('Registro persistido')).toBeVisible();
  await page
    .getByRole('button', { name: /Novo registro/ })
    .first()
    .click();
  await expect(page.getByRole('switch', { name: 'Sem hora de almoço?' })).not.toBeChecked();
  await expect(page.getByText('Campo obrigatório. Não há campo de título.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByText('Selecione um projeto.')).toBeVisible();
  await expect(page.getByText('Descreva a atividade realizada.')).toBeVisible();
});
