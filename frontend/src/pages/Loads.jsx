import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLoads, deleteLoad } from '../api'
import StatusBadge from '../components/StatusBadge'

const STATUSES = ['', 'pending', 'at_shipper', 'rolling', 'stopped', 'issue', 'at_receiver', 'delivered', 'cancelled']

export default function Loads() {
  const [loads, setLoads] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const fetch = () => {
    setLoading(true)
    getLoads({ search: search || undefined, status: status || undefined })
      .then(r => setLoads(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [search, status])

  const handleDelete = async (id, loadNum) => {
    if (!confirm(`Delete load ${loadNum}?`)) return
    await deleteLoad(id)
    fetch()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Loads</h2>
          <p className="text-gray-500 text-sm mt-1">{loads.length} loads found</p>
        </div>
        <Link to="/loads/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + New Load
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search load #, location, driver..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s ? s.replace('_', ' ').toUpperCase() : 'All Statuses'}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['Load #', 'Truck', 'Driver', 'Ship From', 'Ship To', 'PU Date', 'Del Date', 'Miles', 'Rate', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              )}
              {!loading && loads.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">No loads found.</td></tr>
              )}
              {loads.map(load => (
                <tr key={load.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold">
                    <Link to={`/loads/${load.id}`} className="text-blue-600 hover:underline">{load.load_number}</Link>
                  </td>
                  <td className="px-4 py-3">{load.truck_number || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{load.driver_name || '—'}</td>
                  <td className="px-4 py-3 max-w-[140px] truncate text-gray-600" title={load.ship_from}>{load.ship_from}</td>
                  <td className="px-4 py-3 max-w-[140px] truncate text-gray-600" title={load.ship_to}>{load.ship_to}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{load.pickup_date || '—'} {load.pickup_time || ''}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{load.delivery_date || '—'} {load.delivery_time || ''}</td>
                  <td className="px-4 py-3">{load.mileage ? `${load.mileage} mi` : '—'}</td>
                  <td className="px-4 py-3">{load.rate ? `$${load.rate.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={load.status} /></td>
                  <td className="px-4 py-3 flex gap-2">
                    <Link to={`/loads/${load.id}/edit`} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</Link>
                    <button onClick={() => handleDelete(load.id, load.load_number)} className="text-red-400 hover:text-red-600 text-xs font-medium">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
