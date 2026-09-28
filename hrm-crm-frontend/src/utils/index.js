import dayjs from 'dayjs'

export const formatDate = (date, format = 'DD/MM/YYYY') =>
  date ? dayjs(date).format(format) : '---'

export const formatDateTime = (date) =>
  date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '---'

export const formatCurrency = (amount, currency = 'VND') => {
  if (amount === null || amount === undefined) return '---'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount)
}

export const truncate = (str, length = 50) =>
  str?.length > length ? `${str.substring(0, length)}...` : str

export const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

export const buildQueryString = (params) => {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  return new URLSearchParams(filtered).toString()
}
