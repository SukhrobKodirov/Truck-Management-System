import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Loads from './pages/Loads'
import LoadDetail from './pages/LoadDetail'
import LoadForm from './pages/LoadForm'
import Trucks from './pages/Trucks'
import Tracking from './pages/Tracking'

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/loads" element={<Loads />} />
          <Route path="/loads/new" element={<LoadForm />} />
          <Route path="/loads/:id" element={<LoadDetail />} />
          <Route path="/loads/:id/edit" element={<LoadForm />} />
          <Route path="/trucks" element={<Trucks />} />
          <Route path="/tracking" element={<Tracking />} />
        </Routes>
      </main>
    </div>
  )
}
