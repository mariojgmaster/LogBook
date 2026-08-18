export const broadcastEntityChange = (
  entity: 'project' | 'record' | 'settings' | 'reminder' | 'draft' | 'preferences',
  id: string,
  revision: number,
) => {
  void chrome.runtime
    .sendMessage({ type: 'entity.changed', entity, id, revision })
    .catch(() => undefined);
};
