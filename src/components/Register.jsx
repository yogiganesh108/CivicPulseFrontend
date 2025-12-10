import { useState } from 'react'
import './Register.css'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Register(){
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpStatus, setOtpStatus] = useState('')
  const [otpError, setOtpError] = useState(null)
  const [isOtpBusy, setIsOtpBusy] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !username.trim() || !password.trim() || !fullname.trim()) {
      setError('Please fill in all fields')
      return
    }
    setIsSubmitting(true)
    try{
      await api.registerOtp({ email, username, password, fullname })
      setPendingEmail(email)
      setOtp('')
      setOtpStatus(`We sent a 6-digit OTP to ${email}. It will expire in 10 minutes.`)
      setOtpError(null)
      setOtpModalOpen(true)
    }catch(err){
      setError(err.message || 'Registration failed')
    }finally{
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if(!pendingEmail) return
    if(!otp.trim()){
      setOtpError('Please enter the code you received')
      return
    }
    setIsOtpBusy(true)
    setOtpError(null)
    try{
      await api.verifyOtp(pendingEmail, otp.trim())
      alert('OTP verified! You can now log in.')
      setOtpModalOpen(false)
      navigate('/')
    }catch(err){
      setOtpError(err.message || 'Invalid OTP')
    }finally{
      setIsOtpBusy(false)
    }
  }

  const handleResendOtp = async () => {
    if(!pendingEmail) return
    setIsOtpBusy(true)
    setOtpError(null)
    try{
      await api.resendOtp(pendingEmail)
      setOtpStatus(`A new OTP was sent to ${pendingEmail}`)
    }catch(err){
      setOtpError(err.message || 'Could not resend OTP')
    }finally{
      setIsOtpBusy(false)
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
            <div><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><label>Username</label><input value={username} onChange={e=>setUsername(e.target.value)} /></div>
            <div><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
            <div><label>Full name</label><input value={fullname} onChange={e=>setFullname(e.target.value)} /></div>
            {error && <div className="error">{error}</div>}
            <div className="helper-row">
              <div style={{textAlign:'left'}}></div>
              <div style={{textAlign:'right'}}></div>
            </div>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending OTP...' : 'Register'}</button>
          </form>
        </div>
      </div>
      {otpModalOpen && (
        <div className="otp-modal">
          <div className="otp-modal__backdrop" onClick={() => !isOtpBusy && setOtpModalOpen(false)}></div>
          <div className="otp-modal__content">
            <h3>Verify your email</h3>
            <p>{otpStatus}</p>
            <form onSubmit={handleVerifyOtp}>
              <label>OTP Code</label>
              <input value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} inputMode="numeric" />
              {otpError && <div className="error">{otpError}</div>}
              <div className="otp-actions">
                <button type="button" onClick={handleResendOtp} disabled={isOtpBusy}>Resend OTP</button>
                <div style={{flex:1}} />
                <button type="submit" disabled={isOtpBusy}>{isOtpBusy ? 'Working...' : 'Verify OTP'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
