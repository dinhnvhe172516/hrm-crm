import api from '../api'

export const leaveService = {
  getLeaveTypes: () => api.get('/leave/types'),
  createLeaveType: (data) => api.post('/leave/types', data),
  updateLeaveType: (id, data) => api.put(`/leave/types/${id}`, data),
  getMyBalances: (params) => api.get('/leave/balances/my', { params }),
  createRequest: (data) => api.post('/leave/requests', data),
  getRequests: (params) => api.get('/leave/requests', { params }),
  approveRequest: (id, data) => api.put(`/leave/requests/${id}/approve`, data),
  rejectRequest: (id, data) => api.put(`/leave/requests/${id}/reject`, data),
  cancelRequest: (id) => api.put(`/leave/requests/${id}/cancel`),
}

export default leaveService

