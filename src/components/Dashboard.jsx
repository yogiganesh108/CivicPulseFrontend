import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import UserDashboard from './UserDashboard'
import TopNav from './TopNav'
import SideNav from './SideNav'
import api from '../utils/api'
import './Dashboard.css'

export default function Dashboard(){
  const [params] = useSearchParams()
  const role = params.get('role') || 'citizen'
  const [userInfo, setUserInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [complaintCount, setComplaintCount] = useState(0)

  useEffect(()=>{
    const token = localStorage.getItem('jwt')
    if(!token) return setUserInfo(null)
    fetch('http://localhost:8081/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json()).then(setUserInfo).catch(()=>setUserInfo(null))
    refreshCounts()
  },[])

  async function refreshCounts(){
    try{
      const list = await api.getMyGrievances()
      setComplaintCount(Array.isArray(list) ? list.length : 0)
    }catch(e){ setComplaintCount(0) }
  }

  const logout = ()=>{
    localStorage.removeItem('jwt')
    window.location.href = '/'
  }

  return (
    <div className="dashboard-container">
      <div className="topnav-wrapper">
        <TopNav />
        </div>
      <div className="app-shell">
        <div className="sidenav-wrapper"><SideNav active={activeTab} onSelect={t=>setActiveTab(t)} complaintCount={complaintCount} /></div>
        <main  className="main-content" style={{flex:1}}>
          <div className="card" style={{display:'flex',justifyContent:'center',alignItems:'center',marginBottom:12}}>
            <div className='Welcomedashboard'>
              <h2 style={{margin:0}}>Dashboard ({role})</h2>
              {userInfo && <div style={{color:'#64748b', fontSize:13}}>Welcome, {userInfo.username}</div>}
            </div>
            {/* <div>
              <button className="btn-ghost" onClick={logout}>Logout</button>
            </div> */}
          </div>

          {/* Tabs content */}
          {activeTab === 'dashboard' && (
            <div className="card summary-card">
              <h3>Overview</h3>
              <div style={{display:'flex', gap:20, marginTop:12}}>
                <div className="stat">
                  <div className="stat-value">{complaintCount}</div>
                  <div className="stat-label">My Complaints</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{/* TODO: other stats */}—</div>
                  <div className="stat-label">Other</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'raise' && (
            <div className="card">
              <UserDashboard view="raise" onSubmitted={refreshCounts} />
            </div>
          )}

          {activeTab === 'my' && (
            <div className="card">
              <UserDashboard view="my" />
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
