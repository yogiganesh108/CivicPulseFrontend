import React from 'react'
import './TopNav.css'
import { Link, useNavigate } from 'react-router-dom'

export default function TopNav(){
  const navigate = useNavigate()
  const token = localStorage.getItem('jwt')
  const logout = ()=>{ localStorage.removeItem('jwt'); localStorage.removeItem('role'); navigate('/') }

  return (
    <header className="topnav">
      <div className="topnav-left">
        <Link to="/dashboard"><img src="/logo.png" alt="logo" className="topnav-logo" /></Link>
        {/* <Link to="/dashboard" className="topnav-title"><img src="/logo.png" alt="CivicPulse" /></Link> */}
      </div>
      {/* center nav removed - role-specific dashboards open on login */}
      <div className="topnav-right">
        {token ? (
          <button className="btn-ghost" onClick={logout}>Logout</button>
        ) : (
          <Link to="/">Login</Link>
        )}
      </div>
    </header>
  )
}
