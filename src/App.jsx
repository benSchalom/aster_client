import { Routes, Route, Navigate } from 'react-router-dom'
import Portail from './pages/Portail'
import PortailVerify from './pages/PortailVerify'
import MesCartes from './pages/MesCartes'

function HomeRedirect() {
  const token = localStorage.getItem('portail_token')
  return token ? <Navigate to="/cartes" replace /> : <Navigate to="/connexion" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/connexion" element={<Portail />} />
      <Route path="/connexion/verify" element={<PortailVerify />} />
      <Route path="/cartes" element={<MesCartes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
