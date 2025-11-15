import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, allowedRoles }){
  const token = localStorage.getItem('jwt')
  if(!token) return <Navigate to="/" replace />
  if(allowedRoles && allowedRoles.length){
    const role = localStorage.getItem('role')
    if(!role) return <Navigate to="/" replace />
    const ok = allowedRoles.some(r => role.includes(r))
    if(!ok) return <Navigate to="/" replace />
  }
  return children
}
