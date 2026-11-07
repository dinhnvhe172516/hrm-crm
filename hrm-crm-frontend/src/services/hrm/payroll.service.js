import api from '../api'

export const payrollService = {
  getAll: (params) => api.get('/payroll', { params }),
  getMyPayslip: (params) => api.get('/payroll/my-payslip', { params }),
  generateMonthlyPayroll: (data) => api.post('/payroll/generate', data),
  approvePayroll: (id) => api.put(`/payroll/${id}/approve`),
  markAsPaid: (id, data) => api.put(`/payroll/${id}/pay`, data),
}

export default payrollService

