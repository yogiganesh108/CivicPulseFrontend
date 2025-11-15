import { useState } from 'react'
import './Register.css'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Register(){
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [role, setRole] = useState('citizen')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    // client-side validation
    if (!email.trim() || !username.trim() || !password.trim() || !fullname.trim()) {
      setError('Please fill in all fields')
      return
    }
    try{
      await api.register(role, { email, username, password, fullname })
      // after registration, redirect to login
      alert('Registration successful! Please login.');
      navigate('/')
    }catch(err){
      setError(err.message || 'Registration failed')
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
          <h2>Create account</h2>
          <p style={{marginTop:6, marginBottom:12, color:'#64748b'}}>Register to access local civic services and track requests</p>
          <form onSubmit={submit}>
            <div><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><label>Username</label><input value={username} onChange={e=>setUsername(e.target.value)} /></div>
            <div><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
            <div><label>Full name</label><input value={fullname} onChange={e=>setFullname(e.target.value)} /></div>
            {error && <div className="error">{error}</div>}
            <div className="helper-row">
              <div style={{textAlign:'left'}}></div>
              <div style={{textAlign:'right'}}></div>
            </div>
            <button type="submit">Register</button>
          </form>
        </div>
      </div>
    </div>
  )
}
