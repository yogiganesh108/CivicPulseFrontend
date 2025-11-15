import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import './UserDashboard.css'
// reuse admin card styles so user complaints look the same
// import './AdminDashboard.css'

function StatusChip({ status }){
  const cls = `chip chip--${(status||'pending').toString().toLowerCase().replace(/\s+/g,'-')}`
  return <span className={cls}>{status}</span>
}

export default function UserDashboard({ view = 'raise', onSubmitted = () => {} }){
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('water')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [complaints, setComplaints] = useState([])

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
    }catch(e){ console.error(e) }
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
                <select value={category} onChange={e=>setCategory(e.target.value)}>
                  <option value="water">Water</option>
                  <option value="street-light">Street Light</option>
                  <option value="road">Road / Pothole</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="other">Other</option>
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
            <div className="complaint-grid">
              {complaints.map(c => (
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
                    <div className="complaint-meta">{c.category} • {c.priority || '—'}</div>
                    <div className="complaint-desc">{c.description || ''}</div>
                    <div className="complaint-footer">
                      <div className="assigned">Officer: {c.officerId || '-'}</div>
                      <div className="deadline">Deadline: {c.deadline || '-'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}