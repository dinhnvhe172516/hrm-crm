import api from '../api'

export const departmentService = {
  getAll: (params) => api.get('/departments', { params }),
  getTree: () => api.get('/departments/tree'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  remove: (id) => api.delete(`/departments/${id}`),
}

export default departmentService

