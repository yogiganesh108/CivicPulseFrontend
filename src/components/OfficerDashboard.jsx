import React, { useEffect, useState } from 'react'
import TopNav from './TopNav'
import ComplaintDetail from './ComplaintDetail'
import api from '../utils/api'
import './AdminDashboard.css'
import './OfficerDashboard.css'

function OfficerSideNav({ active = 'assigned', onSelect = () => {} }) {
  return (
    <nav className="sidenav" aria-label="Officer navigation">
      <ul>
        <li>
          <button
            className={active === 'assigned' ? 'active' : ''}
            onClick={() => onSelect('assigned')}
          >
            Assigned
          </button>
        </li>
        <li>
          <button
            className={active === 'inprogress' ? 'active' : ''}
            onClick={() => onSelect('inprogress')}
          >
            In Progress
          </button>
        </li>
        <li>
          <button
            className={active === 'resolved' ? 'active' : ''}
            onClick={() => onSelect('resolved')}
          >
            Resolved
          </button>
        </li>
      </ul>
    </nav>
  )
}

export default function OfficerDashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [officers, setOfficers] = useState([])
  const [activeTab, setActiveTab] = useState('assigned')
  const [selectedComplaintId, setSelectedComplaintId] = useState(null)

  useEffect(() => {
    loadAssigned()
  }, [])

  async function loadAssigned() {
    setLoading(true)
    setError(null)
    try {
      const list = await api.getAssignedComplaints()
      setComplaints(list || [])
      try{
        const of = await api.getOfficers()
        if(Array.isArray(of)) setOfficers(of)
      }catch(e){ /* ignore if restricted */ }
    } catch (e) {
      setError(e.message || 'Failed to load')
    }
    setLoading(false)
  }

  function resolveOfficerName(c){
    const found = officers.find(o => String(o.id) === String(c.officerId))
    if(found) return found.name
    if(c.officerName) return c.officerName
    if(c.officer && c.officer.name) return c.officer.name
    return c.officerId ? `Officer #${c.officerId}` : '-'
  }

  

  return (
    <div className="dashboard-container">
      <div className="topnav-wrapper">
        <TopNav />
      </div>

      <div className="app-shell">
        <div className="sidenav-wrapper">
          <OfficerSideNav active={activeTab} onSelect={t => setActiveTab(t)} />
        </div>

        <main className="main-content">
          <div className="card">
            <h3>
              {activeTab === 'assigned'
                ? 'Assigned to Me'
                : activeTab === 'inprogress'
                ? 'In Progress'
                : activeTab === 'resolved'
                ? 'Resolved Complaints'
                : 'Profile'}
            </h3>

            {loading && <div>Loading...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {!loading && complaints.length === 0 && (
              <div className="muted">No assigned complaints</div>
            )}

            {selectedComplaintId ? (
              <div>
                <ComplaintDetail id={selectedComplaintId} officers={officers} onClose={() => { setSelectedComplaintId(null); loadAssigned(); }} onAssigned={() => loadAssigned()} />
              </div>
            ) : (
              <div>
                <ul className="complaint-list" style={{ marginTop: 12 }}>
                  {complaints
                    .filter(c => {
                      const st = (c.status || '').toString()
                      if (activeTab === 'assigned') return st === 'ASSIGNED'
                      if (activeTab === 'inprogress') return st === 'IN_PROGRESS'
                      if (activeTab === 'resolved') return st === 'RESOLVED'
                      return false
                    })
                    .map(c => (
                      <li key={c.id} className="complaint-list-item" onClick={() => setSelectedComplaintId(c.id)}>
                        <div className="thumb-small">
                          {c.resolutionImageBlobUrl ? (
                            <img src={c.resolutionImageBlobUrl} alt={c.title} />
                          ) : c.imageBlobUrl ? (
                            <img src={c.imageBlobUrl} alt={c.title} />
                          ) : c.imageUrl ? (
                            <img src={c.imageUrl} alt={c.title} crossOrigin="anonymous" />
                          ) : (
                            <div style={{ color: '#94a3b8', fontSize: 13 }}>No image</div>
                          )}
                        </div>

                        <div className="list-body">
                          <div className="list-title">{c.title}</div>
                          <div className="list-meta">{c.category} • Priority: {c.priority || '—'}</div>
                          <div className="list-sub">{(c.description || '').length > 140 ? (c.description.slice(0, 140) + '…') : c.description}</div>
                          <div className="list-sub" style={{ marginTop: 6, color: '#64748b' }}>Officer: {resolveOfficerName(c)} • Deadline: {c.deadline || '-'}</div>
                        </div>

                        <div>
                          <div className={`list-status list-status-${(c.status || '').toLowerCase()}`}>{c.status}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>

      
    </div>
  )
}
