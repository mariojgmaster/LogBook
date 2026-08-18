import type { CompositionRoot } from '@/application/composition-root';
import type { AppRequest } from '@/shared/contracts/messages';
import { broadcastEntityChange } from '../events';

type Request = Extract<AppRequest, { type: `project.${string}` }>;

export const handleProjectRequest = async (request: Request, root: CompositionRoot) => {
  if (request.type === 'project.list') {
    return root.listProjects.execute(request.payload.includeArchived);
  }
  if (request.type === 'project.remove') {
    const result = await root.removeProject.execute(
      request.payload.id,
      request.payload.expectedRevision,
    );
    broadcastEntityChange('project', request.payload.id, request.payload.expectedRevision + 1);
    return result;
  }

  const value =
    request.type === 'project.create'
      ? await root.createProject.execute(request.payload.name)
      : request.type === 'project.update'
        ? await root.updateProject.execute(
            request.payload.id,
            request.payload.name,
            request.payload.expectedRevision,
          )
        : request.type === 'project.archive'
          ? await root.archiveProject.execute(request.payload.id, request.payload.expectedRevision)
          : await root.restoreProject.execute(request.payload.id, request.payload.expectedRevision);
  broadcastEntityChange('project', value.id, value.revision);
  return value;
};
