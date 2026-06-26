const STATUS_STYLES = {
  rolling:     'bg-green-100 text-green-800',
  at_shipper:  'bg-blue-100 text-blue-800',
  at_receiver: 'bg-purple-100 text-purple-800',
  stopped:     'bg-yellow-100 text-yellow-800',
  issue:       'bg-red-100 text-red-800',
  delivered:   'bg-gray-100 text-gray-700',
  pending:     'bg-orange-100 text-orange-700',
  cancelled:   'bg-gray-200 text-gray-500',
}

const STATUS_LABELS = {
  rolling:     '🟢 Rolling',
  at_shipper:  '🔵 At Shipper',
  at_receiver: '🟣 At Receiver',
  stopped:     '🟡 Stopped',
  issue:       '🔴 Issue',
  delivered:   '✅ Delivered',
  pending:     '🟠 Pending',
  cancelled:   '⚫ Cancelled',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
