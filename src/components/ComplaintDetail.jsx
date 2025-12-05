import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import FeedbackList from './FeedbackList';
import FeedbackForm from './FeedbackForm';
import './ComplaintDetail.css';

export default function ComplaintDetail({ id: propId, onClose, officers = [], onAssigned }) {
  const params = useParams();
  const navigate = useNavigate();
  const id = propId || params.id;

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const role = (localStorage.getItem('role') || '').toUpperCase();
  const isAdmin = role.includes('ADMIN');
  const isOfficer = role.includes('OFFICER');
  const isCitizen = !isAdmin && !isOfficer;

  const [assignData, setAssignData] = useState({
    officer_id: '',
    priority: 'Medium',
    deadline: ''
  });

  const [assigning, setAssigning] = useState(false);
  const [officersList, setOfficersList] = useState(officers || []);

  // Resolve modal
  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  // Reopen modal (for citizens)
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenNote, setReopenNote] = useState('');
  const [reopenFile, setReopenFile] = useState(null);
  const [reopenPreview, setReopenPreview] = useState(null);
  const [reopenProcessing, setReopenProcessing] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const c = await api.getComplaint(id);
      setComplaint(c);

      if (c) {
        setAssignData({
          officer_id: c.officerId || '',
          priority: c.priority || 'Medium',
          deadline: c.deadline || ''
        });
      }
    } catch (e) {
      setError(e.message || 'Failed to load');
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  // keep local officers list in sync; fetch if none provided
  useEffect(() => {
    if (officers && officers.length) {
      setOfficersList(officers);
    } else {
      api.getOfficers().then(list => { if (Array.isArray(list)) setOfficersList(list) }).catch(() => {});
    }
  }, [officers]);

  useEffect(() => { load(); }, [id]);

  async function submitAssign(e) {
    e.preventDefault();
    if (!complaint) return;

    try {
      setAssigning(true);
      await api.assignComplaint(complaint.id, {
        officer_id: Number(assignData.officer_id),
        priority: assignData.priority,
        deadline: assignData.deadline
      });

      await load();
      onAssigned && onAssigned();
      alert('Assigned successfully.');
    } catch (err) {
      alert('Assign failed: ' + err.message);
    }
    setAssigning(false);
  }

  async function markInProgress() {
    try {
      setProcessing(true);
      await api.updateComplaintResolution(complaint.id, { status: 'IN_PROGRESS' });
      await load();
      onAssigned && onAssigned();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setProcessing(false);
  }

  function openResolveModal() {
    if ((complaint.status || '') !== 'IN_PROGRESS') {
      alert('Only complaints in In Progress state can be resolved.');
      return;
    }
    setNote('');
    setFile(null);
    setPreviewUrl(null);
    setModalOpen(true);
  }

  function openReopenModal() {
    if ((complaint.status || '') !== 'RESOLVED') {
      alert('Only resolved complaints can be reopened.');
      return;
    }
    setReopenNote('');
    setReopenFile(null);
    setReopenPreview(null);
    setReopenOpen(true);
  }

  async function submitResolution(e) {
    e.preventDefault();
    try {
      setProcessing(true);
      await api.updateComplaintResolution(complaint.id, {
        status: 'RESOLVED',
        resolutionNote: note,
        imageFile: file
      });

      setModalOpen(false);
      previewUrl && URL.revokeObjectURL(previewUrl);
      await load();
      onAssigned && onAssigned();
    } catch (err) {
      alert('Submit failed: ' + err.message);
    }
    setProcessing(false);
  }

  async function submitReopen(e){
    e.preventDefault();
    try{
      setReopenProcessing(true);
      // determine target status: if an officer is assigned, move to IN_PROGRESS, else ASSIGNED
      const targetStatus = complaint.officerId ? 'IN_PROGRESS' : 'ASSIGNED';
      await api.updateComplaintResolution(complaint.id, {
        status: targetStatus,
        resolutionNote: reopenNote,
        imageFile: reopenFile
      });
      // persist the reopen evidence (image + note) without overwriting the original main image
      if(reopenFile || reopenNote){
        try{
          await api.updateReopenEvidence(complaint.id, { imageFile: reopenFile, note: reopenNote });
        }catch(e){
          console.warn('Persisting reopen evidence failed', e);
        }
      }
      setReopenOpen(false);
      await load();
      onAssigned && onAssigned();
      alert('Complaint reopened.');
    }catch(err){
      alert('Reopen failed: ' + err.message);
    }
    setReopenProcessing(false);
  }

  if (loading) return <div className="cd-card">Loading...</div>;
  if (error) return <div className="cd-card error">{error}</div>;
  if (!complaint) return <div className="cd-card">No data</div>;

  return (
    <div className="cd-card">

      {/* Back Button */}
      <button className="cd-back-btn" onClick={() => onClose ? onClose() : navigate(-1)}>
        ← Back
      </button>

      {/* Layout */}
      <div className="cd-grid">

        {/* Left Image Column */}
        <div className="cd-media">
          {complaint.imageBlobUrl || complaint.imageUrl ? (
            <img
              src={complaint.imageBlobUrl || complaint.imageUrl}
              alt={complaint.title}
            />
          ) : (
            <div className="cd-placeholder">No image available</div>
          )}

          {/* Completed work moved under the main image for visual grouping */}
          {complaint.resolutionImageUrl && (
            <div className="cd-resolution-box">
              <h4>Completed Work</h4>
              <img
                src={complaint.resolutionImageBlobUrl || complaint.resolutionImageUrl}
                alt="resolution"
              />
              {complaint.resolutionNote && (
                <div className="cd-resolution-note">{complaint.resolutionNote}</div>
              )}
            </div>
          )}
        </div>

        {/* Right Details Column */}
        <div className="cd-body">

          <h2 className="cd-title">{complaint.title}</h2>

          <div className="cd-meta">Category: {complaint.category}</div>
          <div className="cd-meta">Priority: {complaint.priority || '—'}</div>
          <div className="cd-meta">Assigned Officer: {(() => {
            const found = officersList && officersList.find(o => String(o.id) === String(complaint.officerId));
            if(found) return found.name;
            if(complaint.officerName) return complaint.officerName;
            if(complaint.officer && complaint.officer.name) return complaint.officer.name;
            return complaint.officerId ? `Officer #${complaint.officerId}` : '-';
          })()}</div>
          <div className="cd-meta">Deadline: {complaint.deadline || '-'}</div>

          {/* ADMIN: Assignment Section */}
          {isAdmin && (
            <div className="cd-section">
              <h4>Assign / Reassign Officer</h4>
              <form onSubmit={submitAssign} className="cd-assign-form">
                <select
                  required
                  value={assignData.officer_id}
                  onChange={(e) => setAssignData({ ...assignData, officer_id: e.target.value })}
                >
                  <option value="">Select officer</option>
                  {officers.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.email})
                    </option>
                  ))}
                </select>

                <select
                  value={assignData.priority}
                  onChange={(e) => setAssignData({ ...assignData, priority: e.target.value })}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

                <input
                  type="date"
                  value={assignData.deadline}
                  onChange={(e) => setAssignData({ ...assignData, deadline: e.target.value })}
                />

                <button className="btn-primary" disabled={assigning}>
                  {assigning ? 'Saving...' : 'Assign'}
                </button>
              </form>
            </div>
          )}

          {/* OFFICER ACTIONS */}
          {isOfficer && (
            <div className="cd-actions">
              {complaint.status === 'ASSIGNED' && (
                <button className="btn-primary" onClick={markInProgress} disabled={processing}>
                  {processing ? 'Updating...' : 'Mark In Progress'}
                </button>
              )}

              {complaint.status === 'IN_PROGRESS' && (
                <button className="btn-secondary" onClick={openResolveModal}>
                  Mark Resolved
                </button>
              )}
            </div>
          )}

          {/* CITIZEN: Reopen button when complaint resolved */}
          {isCitizen && complaint.status === 'RESOLVED' && (
            <div style={{ marginTop: 12 }}>
              <button className="btn-muted cd-reopen-btn" onClick={openReopenModal}>Reopen Complaint</button>
            </div>
          )}

          <div className="cd-description">{complaint.description}</div>

          {/* visual separator between upper details and lower sections */}
          <div className="cd-separator" />
          {/* REOPEN EVIDENCE (if the citizen submitted evidence when reopening) */}
          {complaint.reopenImageUrl && (
            <div className="cd-section">
              <h4>Reopen Evidence</h4>
              <div>
                <img src={complaint.reopenImageBlobUrl || complaint.reopenImageUrl} alt="reopen evidence" style={{ maxWidth: 360, borderRadius: 8 }} />
              </div>
              {complaint.reopenNote && <div style={{ marginTop: 8 }}>{complaint.reopenNote}</div>}
            </div>
          )}

          {/* RESOLUTION DETAILS moved to left column for visual grouping with images */}

          {/* FEEDBACK */}
          <div className="cd-feedback">
            <h4>User Feedback</h4>
            <FeedbackList grievanceId={complaint.id} />

            <div className="cd-feedback-submit">
              {isCitizen && complaint.status === 'RESOLVED' ? (
                <FeedbackForm grievanceId={complaint.id} onSubmitted={load} />
              ) : (
                <div className="cd-hint">
                  {isAdmin || isOfficer
                    ? 'Only citizens can submit feedback.'
                    : (complaint.status !== 'RESOLVED' && 'Feedback can be submitted once the complaint is resolved.')
                  }
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* RESOLUTION MODAL */}
      {modalOpen && (
        <div className="cd-modal-overlay">
          <div className="cd-modal">
            <h3>Resolve Complaint</h3>
            <form onSubmit={submitResolution}>

              <label>Notes</label>
              <textarea value={note} rows={4} onChange={e => setNote(e.target.value)} />

              <label>Upload Proof Image</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                if (f) setPreviewUrl(URL.createObjectURL(f));
              }} />

              {previewUrl && <img src={previewUrl} alt="preview" className="cd-preview" />}

              <div className="cd-modal-footer">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={processing}>
                  {processing ? 'Submitting...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REOPEN MODAL (citizen) */}
      {reopenOpen && (
        <div className="cd-modal-overlay">
          <div className="cd-modal">
            <h3>Reopen Complaint</h3>
            <form onSubmit={submitReopen}>

              <label>Notes (describe why you're reopening)</label>
              <textarea value={reopenNote} rows={4} onChange={e => setReopenNote(e.target.value)} />

              <label>Upload Evidence (optional)</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                setReopenFile(f);
                if (reopenPreview) try{ URL.revokeObjectURL(reopenPreview) }catch{};
                if (f) setReopenPreview(URL.createObjectURL(f));
              }} />

              {reopenPreview && <img src={reopenPreview} alt="preview" className="cd-preview" />}

              <div className="cd-modal-footer">
                <button type="button" onClick={() => { if(reopenPreview) try{ URL.revokeObjectURL(reopenPreview) }catch{} setReopenOpen(false) }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={reopenProcessing}>
                  {reopenProcessing ? 'Reopening...' : 'Reopen Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
