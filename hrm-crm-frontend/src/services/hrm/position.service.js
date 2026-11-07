import api from '../api'

export const positionService = {
  getAll: (params) => api.get('/positions', { params }),
  getById: (id) => api.get(`/positions/${id}`),
  create: (data) => api.post('/positions', data),
  update: (id, data) => api.put(`/positions/${id}`, data),
  remove: (id) => api.delete(`/positions/${id}`),
}

export default positionService

