import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import CATEGORIES from '../utils/categories'
import ComplaintDetail from './ComplaintDetail'
import FeedbackForm from './FeedbackForm'
import FeedbackList from './FeedbackList'
import StarRating from './StarRating'
import './UserDashboard.css'
// reuse admin card styles so user complaints look the same
// import './AdminDashboard.css'

function StatusChip({ status }){
  const cls = `chip chip--${(status||'pending').toString().toLowerCase().replace(/\s+/g,'-')}`
  return <span className={cls}>{status}</span>
}

export default function UserDashboard({ view = 'raise', onSubmitted = () => {} }){
  const [title, setTitle] = useState('')
  const defaultCategory = Object.keys(CATEGORIES)[0] || 'Other'
  const [category, setCategory] = useState(defaultCategory)
  const [subcategory, setSubcategory] = useState(CATEGORIES[defaultCategory] ? CATEGORIES[defaultCategory][0] : '')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [complaints, setComplaints] = useState([])
  const [officers, setOfficers] = useState([])
  const [selectedComplaintId, setSelectedComplaintId] = useState(null)

  useEffect(()=>{ if(view === 'my') loadComplaints() }, [view])

  function onFile(e){
    const f = e.target.files && e.target.files[0]
    setImage(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function loadComplaints(){
    try{
      const list = await api.getMyGrievances()
      setComplaints(list || [])
      try{
        const of = await api.getOfficers()
        if(Array.isArray(of)) setOfficers(of)
      }catch(e){ /* ignore if endpoint restricted */ }
    }catch(e){ console.error(e) }
  }

  function resolveOfficerName(c){
    // prefer pre-fetched officers list
    const found = officers.find(o => String(o.id) === String(c.officerId));
    if(found) return found.name;
    // try common payload shapes
    if(c.officerName) return c.officerName;
    if(c.officer && c.officer.name) return c.officer.name;
    // fallback: don't show raw numeric id; show placeholder
    return c.officerId ? `Officer #${c.officerId}` : '-';
  }

  async function submit(e){
    e.preventDefault()
    setError(null)
    if(!title.trim()||!description.trim()) { setError('Please fill title and description'); return }
    setLoading(true)
    try{
      const fd = new FormData()
      fd.append('title', title)
      fd.append('description', description)
      fd.append('category', category)
      if(subcategory) fd.append('subcategory', subcategory)
      fd.append('location', location)
      if(image) fd.append('image', image)
      const res = await api.submitGrievance(fd)
      setTitle(''); setDescription(''); setImage(null); setPreview(null); setLocation('')
      // inform parent to refresh counts/list
      try{ onSubmitted() }catch(e){}
      // switch to My Complaints view if parent doesn't control
      if(view === 'raise') alert('Complaint submitted successfully')
    }catch(err){ setError(err.message || 'Submit failed') }
    setLoading(false)
  }

  return (
    <div className="user-dashboard">
      {/* Render only the active panel to avoid rendering hidden placeholders */}
      {view === 'raise' && (
        <div className="card" id="submit">
          <h3>Submit New Complaint</h3>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="form-row">
                <label>Title</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Short, descriptive title" />
              </div>
              <div className="form-row">
                <label>Category</label>
                <select value={category} onChange={e=>{
                  const val = e.target.value
                  setCategory(val)
                  const firstSub = CATEGORIES[val] && CATEGORIES[val].length ? CATEGORIES[val][0] : ''
                  setSubcategory(firstSub)
                }}>
                  {Object.keys(CATEGORIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Subcategory</label>
                <select value={subcategory} onChange={e=>setSubcategory(e.target.value)}>
                  {(CATEGORIES[category]||[]).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <label>Description</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} />
            </div>
            <div className="form-row">
              <label>Location</label>
              <input placeholder="address or coordinates" value={location} onChange={e=>setLocation(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Image (optional)</label>
              <input type="file" accept="image/*" onChange={onFile} />
              {preview && <img src={preview} alt="preview" className="file-preview-img" />}
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Complaint'}</button>
          </form>
        </div>
      )}

      {view === 'my' && (
        <div className="card" id="my">
          <h3>My Complaints</h3>
          {complaints.length === 0 ? (
            <div className="muted">No complaints yet</div>
          ) : (
            <>
              {selectedComplaintId ? (
                <div>
                  <ComplaintDetail id={selectedComplaintId} officers={officers} onClose={() => setSelectedComplaintId(null)} />
                </div>
              ) : (
                <div>
                  <ul className="complaint-list">
                    {complaints.map(c => (
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
                          <div className="list-meta">{c.category}{c.subcategory ? (' • ' + c.subcategory) : ''} • {c.priority || '—'}</div>
                          <div className="list-sub">{(c.description || '').length > 140 ? (c.description.slice(0, 140) + '…') : c.description}</div>
                          <div className="list-sub" style={{ marginTop: 6, color: '#64748b' }}>
                            Officer: {resolveOfficerName(c)} • Deadline: {c.deadline || '-'}
                          </div>
                        </div>

                        <div className={`list-status list-status-${(c.status||'').toLowerCase()}`}>{c.status}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}