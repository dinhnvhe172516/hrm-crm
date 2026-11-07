import api from '../api'

export const employeeService = {
  getAll: (params) => api.get('/users', { params }),
  getStats: () => api.get('/users/stats'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
  remove: (id) => api.delete(`/users/${id}`),
}

export default employeeService

