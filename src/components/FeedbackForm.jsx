import React, { useState, useEffect } from 'react'
import StarRating from './StarRating'
import api from '../utils/api'

export default function FeedbackForm({ grievanceId, onSubmitted = () => {} }){
  const [rating, setRating] = useState(0)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [existing, setExisting] = useState(null)

  useEffect(()=>{
    async function load(){
      try{ const list = await api.getFeedbackForComplaint(grievanceId); if(list && list.length) setExisting(list[0]) }catch(e){}
    }
    load()
  }, [grievanceId])

  if(existing) return (
    <div style={{paddingTop:8}}>
      <strong>Your rating</strong>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <StarRating value={existing.rating} onChange={()=>{}} />
        <div style={{fontSize:13,color:'#475569'}}>{existing.comments}</div>
      </div>
    </div>
  )

  async function submit(e){
    e.preventDefault()
    if(rating < 1) return alert('Please select rating')
    setSubmitting(true)
    try{
      await api.submitFeedback({ grievanceId, rating, comments })
      setRating(0); setComments('')
      onSubmitted()
      alert('Thanks for your feedback')
    }catch(e){ alert('Failed: '+e.message) }
    setSubmitting(false)
  }

  return (
    <form onSubmit={submit} style={{marginTop:8}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <StarRating value={rating} onChange={setRating} />
        <small style={{color:'#64748b'}}>Rate the resolution (1-5)</small>
      </div>
      <div style={{marginTop:8}}>
        <textarea placeholder="Optional comments" value={comments} onChange={e=>setComments(e.target.value)} style={{width:'100%',minHeight:80,padding:8,borderRadius:8,border:'1px solid #e6eefb'}} />
      </div>
      <div style={{marginTop:8,display:'flex',justifyContent:'flex-end'}}>
        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Feedback'}</button>
      </div>
    </form>
  )
}
