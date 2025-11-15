import React, { useEffect, useState, useRef } from 'react'
import TopNav from './TopNav'
import api from '../utils/api'
import './AdminDashboard.css'
import './OfficerDashboard.css'

function OfficerSideNav({ active = 'assigned', onSelect = () => {} }){
  return (
    <nav className="sidenav" aria-label="Officer navigation">
      <ul>
        <li><button className={active === 'assigned' ? 'active' : ''} onClick={() => onSelect('assigned')}>Assigned</button></li>
        <li><button className={active === 'inprogress' ? 'active' : ''} onClick={() => onSelect('inprogress')}>In Progress</button></li>
        <li><button className={active === 'resolved' ? 'active' : ''} onClick={() => onSelect('resolved')}>Resolved</button></li>
      </ul>
    </nav>
  )
}

export default function OfficerDashboard(){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [activeComplaint, setActiveComplaint] = useState(null)
  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const fileRef = useRef()
  const [activeTab, setActiveTab] = useState('assigned')
  const [processingId, setProcessingId] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(()=>{ loadAssigned() }, [])

  async function loadAssigned(){
    setLoading(true); setError(null)
    try{
      const list = await api.getAssignedComplaints()
      setComplaints(list || [])
    }catch(e){ setError(e.message || 'Failed to load') }
    setLoading(false)
  }

  function openResolveModal(c){
    // only allow opening resolve modal when complaint is in IN_PROGRESS
    if(!c || (c.status || '').toString() !== 'IN_PROGRESS'){
      alert('Only complaints in In Progress state can be resolved by this officer.')
      return
    }
    setActiveComplaint(c)
    setNote('')
    setFile(null)
    setPreviewUrl(null)
    setModalOpen(true)
  }

  async function markInProgress(id){
    if(!id) return
    setProcessingId(id)
    try{
      // optimistic UI update
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'IN_PROGRESS' } : c))
      await api.updateComplaintResolution(id, { status: 'IN_PROGRESS' })
      // refresh from server for canonical data
      await loadAssigned()
    }catch(e){
      alert('Failed: '+e.message)
      // revert optimistic update by reloading
      await loadAssigned()
    }finally{
      setProcessingId(null)
    }
  }

  async function submitResolution(e){
    e.preventDefault()
    if(!activeComplaint) return
    try{
      setProcessingId(activeComplaint.id)
      await api.updateComplaintResolution(activeComplaint.id, { status: 'RESOLVED', resolutionNote: note, imageFile: file })
      setModalOpen(false)
      // revoke preview
      if(previewUrl){ try{ URL.revokeObjectURL(previewUrl) }catch{} setPreviewUrl(null) }
      await loadAssigned()
    }catch(e){ alert('Submit failed: '+e.message) }
    finally{ setProcessingId(null) }
  }

  return (
    <div className="dashboard-container">
      <div className="topnav-wrapper"><TopNav /></div>
      <div className="app-shell">
        <div className="sidenav-wrapper"><OfficerSideNav active={activeTab} onSelect={t=>setActiveTab(t)} /></div>
        <main className="main-content">
          <div className="card">
            <h3>{activeTab === 'assigned' ? 'Assigned to Me' : activeTab === 'inprogress' ? 'In Progress' : activeTab === 'resolved' ? 'Resolved Complaints' : 'Profile'}</h3>
            {loading && <div>Loading...</div>}
            {error && <div style={{color:'red'}}>{error}</div>}
            {!loading && complaints.length === 0 && <div className="muted">No assigned complaints</div>}
            <div className="complaint-grid" style={{marginTop:12}}>
              {complaints
                .filter(c => {
                  // show only complaints matching the selected tab
                  const st = (c.status || '').toString()
                  if(activeTab === 'assigned') return st === 'ASSIGNED'
                  if(activeTab === 'inprogress') return st === 'IN_PROGRESS'
                  if(activeTab === 'resolved') return st === 'RESOLVED'
                  return false
                })
                .map(c => (
                <div key={c.id} className="complaint-card">
                  <div className="complaint-media">
                    {c.imageBlobUrl ? (
                      <img src={c.imageBlobUrl} alt={c.title} className="complaint-image" />
                    ) : c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.title} className="complaint-image" crossOrigin="anonymous" />
                    ) : (
                      <div className="complaint-image placeholder">No image</div>
                    )}
                  </div>
                  <div className="complaint-body">
                    <div className="complaint-header">
                      <h4 className="complaint-title">{c.title}</h4>
                      <div className={`status-badge status-${(c.status||'').toLowerCase()}`}>{c.status}</div>
                    </div>
                    <div className="complaint-meta">{c.category} • Priority: {c.priority || '—'}</div>
                    <div className="complaint-desc">{c.description}</div>
                    <div className="complaint-footer">
                      <div className="deadline">Deadline: {c.deadline || '-'}</div>
                    </div>
                        <div className="complaint-actions">
                          {/* Only show one action at a time depending on current status */}
                          { (c.status === 'ASSIGNED') && (
                            <button className="btn-primary" onClick={()=>markInProgress(c.id)} disabled={processingId===c.id}>
                              {processingId===c.id ? 'Updating...' : 'Mark In Progress'}
                            </button>
                          )}
                          { (c.status === 'IN_PROGRESS') && (
                            <button className="btn-muted" onClick={()=>openResolveModal(c)}>
                              Mark Resolved
                            </button>
                          )}
                        </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h4 className="modal-title">Resolve Complaint</h4>
            <div className="subtitle">Add resolution notes and optionally upload a proof image.</div>
            {/* form id used so submit button can live in footer outside scrollable body */}
            <form id="resolveForm" onSubmit={submitResolution}>
              <div className="form-body">
                <div className="form-section">
                  <label>Notes</label>
                  <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} />
                </div>
                <div className="form-section">
                  <label>Upload proof image</label>
                  <input type="file" accept="image/*" ref={fileRef} onChange={e=>{
                    const f = e.target.files && e.target.files[0]
                    if(!f){ setFile(null); if(previewUrl){ try{ URL.revokeObjectURL(previewUrl) }catch{} setPreviewUrl(null) } ; return }
                    setFile(f)
                    try{ if(previewUrl) URL.revokeObjectURL(previewUrl) }catch{}
                    const obj = URL.createObjectURL(f)
                    setPreviewUrl(obj)
                  }} />
                  {previewUrl && (
                    <div className="preview">
                      <label className="hint">Preview</label>
                      <img src={previewUrl} alt="preview" />
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="modal-footer">
              <button type="button" className="btn-muted" onClick={()=>{ if(previewUrl){ try{ URL.revokeObjectURL(previewUrl) }catch{} setPreviewUrl(null) } setModalOpen(false) }}>Cancel</button>
              <button type="submit" form="resolveForm" className="btn-primary" disabled={processingId===activeComplaint?.id}>{processingId===activeComplaint?.id ? 'Submitting...' : 'Submit Resolution'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
