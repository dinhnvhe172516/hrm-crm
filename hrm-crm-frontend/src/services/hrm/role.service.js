import api from '../api'

export const roleService = {
  getRoles: (params) => api.get('/roles', { params }),
  getRoleById: (id) => api.get(`/roles/${id}`),
  createRole: (data) => api.post('/roles', data),
  updateRole: (id, data) => api.put(`/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/roles/${id}`),
  getPermissions: () => api.get('/roles/permissions'),
}

