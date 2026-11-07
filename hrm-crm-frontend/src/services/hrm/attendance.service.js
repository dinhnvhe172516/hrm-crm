import api from '../api'

export const attendanceService = {
  checkIn: (data) => api.post('/attendance/check-in', data),
  checkOut: (data) => api.post('/attendance/check-out', data),
  getTodayStatus: () => api.get('/attendance/today'),
  getMyTimesheet: (params) => api.get('/attendance/my-timesheet', { params }),
  getAll: (params) => api.get('/attendance', { params }),
  adjustAttendance: (id, data) => api.put(`/attendance/${id}/adjust`, data),
  getShifts: () => api.get('/attendance/shifts'),
  createShift: (data) => api.post('/attendance/shifts', data),
  updateShift: (id, data) => api.put(`/attendance/shifts/${id}`, data),
  deleteShift: (id) => api.delete(`/attendance/shifts/${id}`),
}

export default attendanceService

