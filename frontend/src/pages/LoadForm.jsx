import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createLoad, updateLoad, getLoad, calculateRoute, getTrucks } from '../api'
import PlacesAutocomplete from '../components/PlacesAutocomplete'

const STATUSES = ['pending', 'at_shipper', 'rolling', 'stopped', 'issue', 'at_receiver', 'delivered', 'cancelled']

const EMPTY = {
  load_number: '', truck_number: '', driver_name: '', driver_phone: '',
  ship_from: '', ship_to: '',
  pickup_date: '', pickup_time: '', delivery_date: '', delivery_time: '',
  status: 'pending', commodity: '', weight: '', rate: '',
  broker_name: '', broker_phone: '', reference_number: '',
  samsara_vehicle_id: '', notes: '',
}

// ── Field is defined OUTSIDE so React doesn't remount it on every keystroke ──
const Field = ({ label, name, type = 'text', form, onChange, ...rest }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input
      type={type}
      value={form[name]}
      onChange={e => onChange(name, e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...rest}
    />
  </div>
)

export default function LoadForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(EMPTY)
  const [mileage, setMileage] = useState(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [truckOptions, setTruckOptions] = useState([])

  // Load existing load data when editing
  useEffect(() => {
    if (isEdit) {
      getLoad(id).then(r => {
        const d = r.data
        setForm({
          load_number: d.load_number || '',
          truck_number: d.truck_number || '',
          driver_name: d.driver_name || '',
          driver_phone: d.driver_phone || '',
          ship_from: d.ship_from || '',
          ship_to: d.ship_to || '',
          pickup_date: d.pickup_date || '',
          pickup_time: d.pickup_time || '',
          delivery_date: d.delivery_date || '',
          delivery_time: d.delivery_time || '',
          status: d.status || 'pending',
          commodity: d.commodity || '',
          weight: d.weight || '',
          rate: d.rate || '',
          broker_name: d.broker_name || '',
          broker_phone: d.broker_phone || '',
          reference_number: d.reference_number || '',
          samsara_vehicle_id: d.samsara_vehicle_id || '',
          notes: d.notes || '',
        })
        setMileage(d.mileage)
      })
    }
  }, [id])

  // Load trucks from database for dropdown
  useEffect(() => {
    getTrucks().then(r => setTruckOptions(r.data)).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleTruckSelect = (truckNumber) => {
    const selected = truckOptions.find(t => t.truck_number === truckNumber)
    set('truck_number', truckNumber)
    if (selected) {
      set('driver_name', selected.driver_name || '')
      set('driver_phone', selected.driver_phone || '')
      set('samsara_vehicle_id', selected.samsara_vehicle_id || '')
    }
  }

  const handleCalcMileage = async () => {
    if (!form.ship_from || !form.ship_to) return
    setCalcLoading(true)
    try {
      const r = await calculateRoute(form.ship_from, form.ship_to)
      setMileage(r.data.distance_miles)
    } catch {}
    setCalcLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        weight: form.weight ? +form.weight : null,
        rate: form.rate ? +form.rate : null,
      }
      if (isEdit) await updateLoad(id, payload)
      else await createLoad(payload)
      navigate('/loads')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Load' : 'New Load'}</h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Load Info ──────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Load Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Load Number *" name="load_number" form={form} onChange={set} required />
            <Field label="Reference #" name="reference_number" form={form} onChange={set} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Driver & Truck ─────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Driver & Truck</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* Truck dropdown — pulls from your trucks database */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Truck Number</label>
              <select
                value={form.truck_number}
                onChange={e => handleTruckSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select truck —</option>
                {truckOptions.map(t => (
                  <option key={t.id} value={t.truck_number}>
                    {t.truck_number} — {t.driver_name}
                  </option>
                ))}
              </select>
            </div>

            <Field label="Driver Name" name="driver_name" form={form} onChange={set} />
            <Field label="Driver Phone" name="driver_phone" type="tel" form={form} onChange={set} />
            <Field label="Samsara Vehicle ID" name="samsara_vehicle_id" form={form} onChange={set} placeholder="Auto-filled from truck" />
          </div>
        </section>

        {/* ── Route ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Route</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ship From *</label>
              <PlacesAutocomplete
                value={form.ship_from}
                onChange={val => set('ship_from', val)}
                placeholder="City, State or full address"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ship To *</label>
              <PlacesAutocomplete
                value={form.ship_to}
                onChange={val => set('ship_to', val)}
                placeholder="City, State or full address"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCalcMileage}
              disabled={calcLoading || !form.ship_from || !form.ship_to}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {calcLoading ? 'Calculating...' : '📍 Calculate Mileage'}
            </button>
            {mileage !== null && (
              <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                {mileage} miles
              </span>
            )}
          </div>
        </section>

        {/* ── Schedule ──────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Schedule</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Pickup Date" name="pickup_date" type="date" form={form} onChange={set} />
            <Field label="Pickup Time" name="pickup_time" type="time" form={form} onChange={set} />
            <Field label="Delivery Date" name="delivery_date" type="date" form={form} onChange={set} />
            <Field label="Delivery Time" name="delivery_time" type="time" form={form} onChange={set} />
          </div>
        </section>

        {/* ── Load Details ───────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Load Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Commodity" name="commodity" form={form} onChange={set} />
            <Field label="Weight (lbs)" name="weight" type="number" form={form} onChange={set} />
            <Field label="Rate ($)" name="rate" type="number" form={form} onChange={set} />
            <Field label="Broker Name" name="broker_name" form={form} onChange={set} />
            <Field label="Broker Phone" name="broker_phone" type="tel" form={form} onChange={set} />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        {/* ── Actions ────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Load'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/loads')}
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
