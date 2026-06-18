import api from './client.js';

// ─── Nodes ────────────────────────────────────────────────────────────────────
export const nodeApi = {
  getRoots:    ()         => api.get('/nodes'),
  getChildren: (id, p=1) => api.get(`/nodes/${id}/children?page=${p}&limit=50`),
  getBySlug:   (slug)    => api.get(`/nodes/slug/${slug}`),
  create:      (data)    => api.post('/nodes', data),
  update:      (id, data)=> api.put(`/nodes/${id}`, data),
  delete:      (id)      => api.delete(`/nodes/${id}`),
};

// ─── Screens ──────────────────────────────────────────────────────────────────
export const screenApi = {
  getByNode:  (nodeId)    => api.get(`/screens/node/${nodeId}`),
  create:     (data)      => api.post('/screens', data),
  update:     (id, data)  => api.put(`/screens/${id}`, data),
  setStatus:  (id, status)=> api.patch(`/screens/${id}/status`, { status }),
  delete:     (id)        => api.delete(`/screens/${id}`),
};

// ─── Sections ─────────────────────────────────────────────────────────────────
export const sectionApi = {
  getByScreen: (screenId, params = {}) => {
    const q = new URLSearchParams({ page: 1, limit: 100, ...params }).toString();
    return api.get(`/sections/screen/${screenId}?${q}`);
  },
  getById:    (id)       => api.get(`/sections/${id}`),
  create:     (data)     => api.post('/sections', data),
  createMany: (data)     => api.post('/sections/bulk', data),
  update:     (id, data) => api.put(`/sections/${id}`, data),
  reorder:    (sections) => api.patch('/sections/reorder', { sections }),
  delete:     (id)       => api.delete(`/sections/${id}`),
};

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const quizApi = {
  getById:  (id)        => api.get(`/quizzes/${id}`),
  create:   (data)      => api.post('/quizzes', data),
  update:   (id, data)  => api.put(`/quizzes/${id}`, data),
  submit:   (id, data)  => api.post(`/quizzes/${id}/submit`, data),
  delete:   (id)        => api.delete(`/quizzes/${id}`),
};

// ─── Models ───────────────────────────────────────────────────────────────────
export const modelApi = {
  search:   (params = {}) => {
    const q = new URLSearchParams({ page: 1, limit: 20, ...params }).toString();
    return api.get(`/models/search?${q}`);
  },
  getById:  (id)        => api.get(`/models/${id}`),
  create:   (data)      => api.post('/models', data),
  update:   (id, data)  => api.put(`/models/${id}`, data),
  delete:   (id)        => api.delete(`/models/${id}`),
};

// ─── Upload ───────────────────────────────────────────────────────────────────
export const uploadApi = {
  single: (formData) => api.post('/upload/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  many: (formData) => api.post('/upload/many', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  presign: (data)   => api.post('/upload/presign', data),
  delete:  (key)    => api.delete('/upload', { data: { key } }),
};
