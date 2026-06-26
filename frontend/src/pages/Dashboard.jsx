import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats, getLoads } from '../api'
import StatusBadge from '../components/StatusBadge'

const STAT_CARDS = [
  { key: 'total_loads', label: 'Total Loads',   color: 'bg-blue-50 border-blue-200',   text: 'text-blue-700' },
  { key: 'rolling',     label: 'Rolling',        color: 'bg-green-50 border-green-200', text: 'text-green-700' },
  { key: 'stopped',     label: 'Stopped',        color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
  { key: 'issue',       label: 'Issues',         color: 'bg-red-50 border-red-200',     text: 'text-red-700' },
  { key: 'at_shipper',  label: 'At Shipper',     color: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
  { key: 'delivered',   label: 'Delivered',      color: 'bg-gray-50 border-gray-200',   text: 'text-gray-700' },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])

  useEffect(() => {
    getStats().then(r => setStats(r.data)).catch(console.error)
    getLoads({ limit: 8 }).then(r => setRecent(r.data)).catch(console.error)
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Fleet overview at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, color, text }) => (
          <div key={key} className={`rounded-xl border p-4 ${color}`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${text}`}>
              {stats ? stats[key] ?? 0 : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Recent loads table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Recent Loads</h3>
          <Link to="/loads" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['Load #', 'Truck', 'From', 'To', 'PU Date', 'Status', 'Miles'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No loads yet. <Link to="/loads/new" className="text-blue-600 hover:underline">Add one →</Link></td></tr>
              )}
              {recent.map(load => (
                <tr key={load.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold">
                    <Link to={`/loads/${load.id}`} className="text-blue-600 hover:underline">{load.load_number}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{load.truck_number || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{load.ship_from}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{load.ship_to}</td>
                  <td className="px-4 py-3 text-gray-600">{load.pickup_date || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={load.status} /></td>
                  <td className="px-4 py-3 text-gray-700">{load.mileage ? `${load.mileage} mi` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
