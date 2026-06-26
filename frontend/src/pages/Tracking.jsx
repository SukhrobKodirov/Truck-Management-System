import { useEffect, useState } from 'react'
import { getSamsaraStatus, getSamsaraVehicles, getVehicleLocation } from '../api'

export default function Tracking() {
  const [status, setStatus] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [selected, setSelected] = useState(null)
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSamsaraStatus().then(r => setStatus(r.data)).catch(() => setStatus({ configured: false }))
  }, [])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const r = await getSamsaraVehicles()
      setVehicles(r.data)
    } catch (e) { alert(e.response?.data?.detail || 'Failed to fetch vehicles') }
    setLoading(false)
  }

  const fetchLocation = async (vehicleId) => {
    setSelected(vehicleId); setLocation(null)
    try {
      const r = await getVehicleLocation(vehicleId)
      setLocation(r.data)
    } catch (e) { alert(e.response?.data?.detail || 'Failed to fetch location') }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Live Tracking</h2>
        <p className="text-gray-500 text-sm mt-1">Powered by Samsara Fleet API</p>
      </div>

      {/* Status card */}
      <div className={`rounded-xl border p-5 mb-6 ${status?.configured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{status?.configured ? '🟢' : '🟡'}</span>
          <div>
            <p className="font-semibold text-gray-800">
              {status?.configured ? 'Samsara Connected' : 'Samsara Not Configured'}
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              {status?.configured
                ? `API reachable: ${status.reachable ? 'yes' : 'no'}`
                : 'Add your SAMSARA_API_KEY to the .env file to enable live tracking.'}
            </p>
          </div>
        </div>
      </div>

      {status?.configured && (
        <>
          <button onClick={fetchVehicles} disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 mb-6 disabled:opacity-50">
            {loading ? 'Loading...' : '🔄 Load Vehicles from Samsara'}
          </button>

          {vehicles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Vehicles</p>
                <div className="space-y-2">
                  {vehicles.map(v => (
                    <button key={v.id} onClick={() => fetchLocation(v.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selected === v.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 border border-gray-200'}`}>
                      {v.name || v.id}
                    </button>
                  ))}
                </div>
              </div>

              {location && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Location</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium text-right max-w-[60%]">{location.address || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Coordinates</span><span className="font-mono text-xs">{location.latitude?.toFixed(5)}, {location.longitude?.toFixed(5)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Speed</span><span>{location.speed_mph ? `${location.speed_mph} mph` : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Heading</span><span>{location.heading ? `${location.heading}°` : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Updated</span><span>{location.updated_at ? new Date(location.updated_at).toLocaleString() : '—'}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
