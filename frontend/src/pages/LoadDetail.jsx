import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getLoad, updateLoad, getVehicleLocation } from '../api'
import StatusBadge from '../components/StatusBadge'

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const STATUSES = ['pending', 'at_shipper', 'rolling', 'stopped', 'issue', 'at_receiver', 'delivered', 'cancelled']

export default function LoadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [load, setLoad] = useState(null)
  const [tracking, setTracking] = useState(null)
  const [trackLoading, setTrackLoading] = useState(false)

  useEffect(() => {
    getLoad(id).then(r => setLoad(r.data)).catch(() => navigate('/loads'))
  }, [id])

  const handleStatusChange = async (newStatus) => {
    const updated = await updateLoad(id, { status: newStatus })
    setLoad(updated.data)
  }

  const fetchTracking = async () => {
    if (!load?.samsara_vehicle_id) return
    setTrackLoading(true)
    try {
      const r = await getVehicleLocation(load.samsara_vehicle_id)
      setTracking(r.data)
    } catch (e) {
      alert('Could not fetch Samsara location: ' + (e.response?.data?.detail || e.message))
    }
    setTrackLoading(false)
  }

  const mapUrl = load?.ship_from && load?.ship_to
    ? `https://www.google.com/maps/embed/v1/directions?key=${GMAPS_KEY}&origin=${encodeURIComponent(load.ship_from)}&destination=${encodeURIComponent(load.ship_to)}&mode=driving`
    : null

  if (!load) return <div className="p-8 text-center text-gray-400">Loading...</div>

  const Row = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || '—'}</span>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-gray-900 font-mono">{load.load_number}</h2>
            <StatusBadge status={load.status} />
          </div>
          <p className="text-gray-500 text-sm">{load.ship_from} → {load.ship_to}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/loads/${id}/edit`} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            Edit
          </Link>
          <Link to="/loads" className="text-gray-400 hover:text-gray-600 px-3 py-2 text-sm">← Back</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-1 space-y-4">

          {/* Quick Status Change */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => handleStatusChange(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    load.status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-400'
                  }`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Load details */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Load Details</p>
            <Row label="Truck" value={load.truck_number} />
            <Row label="Driver" value={load.driver_name} />
            <Row label="Driver Phone" value={load.driver_phone} />
            <Row label="Commodity" value={load.commodity} />
            <Row label="Weight" value={load.weight ? `${load.weight.toLocaleString()} lbs` : null} />
            <Row label="Rate" value={load.rate ? `$${load.rate.toLocaleString()}` : null} />
            <Row label="Mileage" value={load.mileage ? `${load.mileage} mi` : null} />
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Schedule</p>
            <Row label="Pickup" value={load.pickup_date && `${load.pickup_date} ${load.pickup_time || ''}`} />
            <Row label="Delivery" value={load.delivery_date && `${load.delivery_date} ${load.delivery_time || ''}`} />
            <Row label="Actual Pickup" value={load.actual_pickup_at ? new Date(load.actual_pickup_at).toLocaleString() : null} />
            <Row label="Actual Delivery" value={load.actual_delivery_at ? new Date(load.actual_delivery_at).toLocaleString() : null} />
          </div>

          {/* Broker */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Broker</p>
            <Row label="Name" value={load.broker_name} />
            <Row label="Phone" value={load.broker_phone} />
            <Row label="Reference" value={load.reference_number} />
          </div>

          {/* Samsara tracking */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Live Tracking (Samsara)</p>
            {load.samsara_vehicle_id ? (
              <>
                <p className="text-xs text-gray-500 mb-2">Vehicle ID: <span className="font-mono">{load.samsara_vehicle_id}</span></p>
                <button onClick={fetchTracking} disabled={trackLoading}
                  className="w-full bg-blue-50 text-blue-700 border border-blue-200 text-sm px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50">
                  {trackLoading ? 'Fetching...' : '📍 Refresh Location'}
                </button>
                {tracking && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p><span className="text-gray-500">Location:</span> {tracking.address || `${tracking.latitude}, ${tracking.longitude}`}</p>
                    <p><span className="text-gray-500">Speed:</span> {tracking.speed_mph ? `${tracking.speed_mph} mph` : '—'}</p>
                    <p><span className="text-gray-500">Updated:</span> {tracking.updated_at ? new Date(tracking.updated_at).toLocaleTimeString() : '—'}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">No Samsara vehicle ID linked. <Link to={`/loads/${id}/edit`} className="text-blue-600 hover:underline">Add one →</Link></p>
            )}
          </div>

          {load.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{load.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full min-h-[500px]">
            {mapUrl && GMAPS_KEY ? (
              <iframe src={mapUrl} width="100%" height="100%" style={{ minHeight: 500, border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Route map" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-gray-400 gap-3">
                <span className="text-5xl">🗺️</span>
                <p className="text-sm">
                  {!GMAPS_KEY ? 'Set VITE_GOOGLE_MAPS_API_KEY in .env to enable the map.' : 'Add ship from and ship to addresses to see the route.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
