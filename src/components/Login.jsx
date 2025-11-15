import { useState } from 'react'
import './Login.css'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { Link } from 'react-router-dom'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try{
      const res = await api.login({ username, password })
      const token = res.token || res.token
      localStorage.setItem('jwt', token)
      // store returned user info (backend returns user_id, username, role, token)
      if(res.user_id) localStorage.setItem('user_id', res.user_id)
      if(res.username) localStorage.setItem('username', res.username)
      if(res.role) localStorage.setItem('role', res.role)
      const role = res.role || null
  // redirect by role
  if(role && role.includes('ADMIN')) navigate('/admin')
  else if(role && role.includes('OFFICER')) navigate('/officer')
  else navigate('/dashboard')
    }catch(err){
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="auth-container">
      <div className="form-card" style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center'}}>
        <div className="illustration" style={{padding: '6px'}}>
          <img src="/logo.png" alt="Illustration" style={{width:'100%', borderRadius:12}} />
        </div>
        <div>
          <div className="brand">
          <img src="/JustLogo.png" alt="Illustration" style={{width:'100%',height:'100%', borderRadius:12}} />

          </div>
          
          <p style={{marginTop:6, marginBottom:12, color:'#64748b'}}>Sign in to access your dashboard and civic services</p>
          <form onSubmit={submit}>
            <div>
              <label htmlFor="username">Username</label>
              <input id="username" value={username} onChange={e=>setUsername(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            {error && <div className="error">{error}</div>}
            <div className="helper-row">
              <div style={{textAlign:'left'}}><Link to="/register">Create account</Link></div>
              <div style={{textAlign:'right'}}><Link to="#">Forgot?</Link></div>
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    </div>
  )
}
