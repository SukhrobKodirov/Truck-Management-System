import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// ── Loads ──────────────────────────────────────────────
export const getLoads = (params = {}) => api.get('/api/loads/', { params })
export const getLoad = (id) => api.get(`/api/loads/${id}`)
export const createLoad = (data) => api.post('/api/loads/', data)
export const updateLoad = (id, data) => api.patch(`/api/loads/${id}`, data)
export const deleteLoad = (id) => api.delete(`/api/loads/${id}`)
export const getStats = () => api.get('/api/loads/stats')

// ── Trucks ─────────────────────────────────────────────
export const getTrucks = () => api.get('/api/trucks/')
export const getTruck = (id) => api.get(`/api/trucks/${id}`)
export const createTruck = (data) => api.post('/api/trucks/', data)
export const updateTruck = (id, data) => api.patch(`/api/trucks/${id}`, data)
export const deleteTruck = (id) => api.delete(`/api/trucks/${id}`)

// ── Maps ───────────────────────────────────────────────
export const calculateRoute = (origin, destination) =>
  api.post('/api/maps/route', { origin, destination })

// ── Samsara ────────────────────────────────────────────
export const getSamsaraStatus = () => api.get('/api/samsara/status')
export const getSamsaraVehicles = () => api.get('/api/samsara/vehicles')
export const getVehicleLocation = (vehicleId) =>
  api.get(`/api/samsara/vehicles/${vehicleId}/location`)
