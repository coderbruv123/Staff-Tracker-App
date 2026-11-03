// API client for the .NET 10 backend. The base URL comes from `.env`.
import axios from 'axios'

export const api = axios.create({
  baseURL: '/',
  withCredentials: true, // cookie-based auth (ASP.NET Core Identity)
})

export type Status = 'Pending' | 'InProgress' | 'Reached' | 'NotReached'

export interface User {
  id: string
  email: string
  displayName: string
  isAdmin: boolean
  isStaff: boolean
}

export interface Staff {
  id: number
  employeeNumber: string
  displayName: string
  phone: string
  department: string | null
  status: string
  email: string | null
  registrationStatus: string | null
}

export interface Location {
  id: number
  name: string
  address: string | null
  notes: string | null
}

export interface DailyAssignment {
  id: number
  staffId: number
  staffDisplayName: string
  staffEmployeeNumber: string
  locationId: number
  locationName: string
  locationAddress: string | null
  status: Status
  note: string | null
  checkedInAt: string | null
  checkedOutAt: string | null
}

export interface DashboardSummary {
  date: string
  total: number
  reached: number
  inProgress: number
  pending: number
  notReached: number
  assignments: DailyAssignment[]
}

export const apiAuth = {
  // { email, password } -> { message, user }
  login: (email: string, password: string) =>
    api.post('/api/Auth/login', { email, password }),

  logout: () => api.post('/api/Auth/logout', {}),

  // GET /api/Auth/me  -> current user or 401
  me: () => api.get('/api/Auth/me'),
}

export const staffApi = {
  list: () => api.get<Staff[]>('/api/Staff'),
  add: (data: { employeeNumber: string; displayName: string; phone: string; department: string }) =>
    api.post('/api/Staff', data),
  approve: (id: number) => api.post(`/api/Staff/approve/${id}`),
  pending: () => api.get<Staff[]>('/api/Staff/pending'),
  me: () => api.get<any>('/api/Staff/me'),
  updateProfile: (data: { displayName: string; phone: string }) =>
    api.post('/api/Staff/me', data),
}

export const locationApi = {
  list: () => api.get<Location[]>('/api/locations'),
  add: (data: { name: string; address: string; notes: string }) =>
    api.post('/api/locations', data),
}

export const assignmentApi = {
  today: () => api.get<DashboardSummary>('/api/assignments/today'),
  list: (date?: string) => api.get<DashboardSummary>(`/api/assignments?date=${date}`),
  create: (data: { staffId: number; locationId: number }) =>
    api.post('/api/assignments', data),
  updateStatus: (id: number, status: string, note?: string) =>
    api.patch(`/api/assignments/${id}/status`, { status, note }),
  history: (staffId: number) => api.get<DashboardSummary>(`/api/assignments/history/${staffId}`),
}

export const checkInApi = {
  checkIn: (lat?: string, lng?: string) =>
    api.post('/api/checkins', { lat, lng }),
  checkOut: (id: number) => api.post(`/api/checkins/${id}/checkout`),
  getLogs: () => api.get('/api/checkins'),
}
