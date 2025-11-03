// src/services/clientId.ts
export function getClientId(): string {
  const key = 'atlas_client_id_v1';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}
