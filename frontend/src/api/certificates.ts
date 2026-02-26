import api from './axios'

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  certificate_url: string
  status: 'pending' | 'issued'
  issued_at: string
}

// Student endpoints
export const getMyCertificates = (userId: string) =>
  api.get(`/api/certificates/user/${userId}`)

export const getDashboardStats = () =>
  api.get('/api/dashboard/stats')

// Admin endpoints
export const getPendingCertificates = () =>
  api.get('/api/certificates/pending')

export const approveCertificate = (certificateId: string) =>
  api.put(`/api/certificates/approve/${certificateId}`)

// Request certificate (after passing exam)
export const requestCertificate = (courseId: string) =>
  api.post('/api/certificates/request', { course_id: courseId })
