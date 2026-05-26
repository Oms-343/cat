import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { EnrollPage } from './pages/EnrollPage'
import { HomePage } from './pages/HomePage'
import { SuccessPage } from './pages/SuccessPage'

function ContinueRedirect() {
  const { token } = useParams<{ token: string }>()
  return <Navigate to={`/enroll/${token}?tab=2`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/enroll/:token" element={<EnrollPage />} />
      <Route path="/enroll/:token/continue" element={<ContinueRedirect />} />
      <Route path="/enroll/:token/success" element={<SuccessPage />} />
    </Routes>
  )
}
