import { useEffect, useState } from 'react'
import { getTrucks, createTruck, deleteTruck } from '../api'

const EMPTY = { truck_number: '', driver_name: '', driver_phone: '', license_plate: '', trailer_number: '', samsara_vehicle_id: '', notes: '' }

export default function Trucks() {
  const [trucks, setTrucks] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetch = () => getTrucks().then(r => setTrucks(r.data))
  useEffect(() => { fetch() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await createTruck(form)
      setForm(EMPTY); setShowForm(false); fetch()
    } catch (err) { setError(err.response?.data?.detail || 'Error') }
    setSaving(false)
  }

  const handleDelete = async (id, num) => {
    if (!confirm(`Delete truck ${num}?`)) return
    await deleteTruck(id); fetch()
  }

  const F = ({ label, name, placeholder = '' }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input value={form[name]} onChange={e => set(name, e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Trucks</h2>
        <button onClick={() => setShowForm(v => !v)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ Add Truck'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">New Truck</h3>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <F label="Truck Number *" name="truck_number" />
            <F label="Driver Name *" name="driver_name" />
            <F label="Driver Phone" name="driver_phone" />
            <F label="License Plate" name="license_plate" />
            <F label="Trailer Number" name="trailer_number" />
            <F label="Samsara Vehicle ID" name="samsara_vehicle_id" />
          </div>
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Truck'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {['Truck #', 'Driver', 'Phone', 'License', 'Trailer', 'Samsara ID', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trucks.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No trucks yet.</td></tr>
            )}
            {trucks.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{t.truck_number}</td>
                <td className="px-4 py-3">{t.driver_name}</td>
                <td className="px-4 py-3 text-gray-600">{t.driver_phone || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{t.license_plate || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{t.trailer_number || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.samsara_vehicle_id || '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(t.id, t.truck_number)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
