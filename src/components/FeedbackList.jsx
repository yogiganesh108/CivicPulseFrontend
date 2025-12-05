import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import StarRating from './StarRating'

export default function FeedbackList({ grievanceId }){
  const [list, setList] = useState([])

  useEffect(()=>{ if(grievanceId) load() }, [grievanceId])
  async function load(){
    try{ const l = await api.getFeedbackForComplaint(grievanceId); setList(l || []) }catch(e){ console.error(e) }
  }

  if(!list || !list.length) return <div className="muted">No reviews yet</div>
  return (
    <div style={{marginTop:8}}>
      {list.map(f => (
        <div key={f.id} style={{padding:10,border:'1px solid #eef2ff',borderRadius:8,marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <StarRating value={f.rating} onChange={()=>{}} size={18} />
              <div style={{fontSize:12,color:'#475569'}}>by user #{f.userId}</div>
            </div>
            <div style={{fontSize:12,color:'#94a3b8'}}>{new Date(f.createdAt).toLocaleString()}</div>
          </div>
          {f.comments && <div style={{marginTop:8,color:'#334155'}}>{f.comments}</div>}
        </div>
      ))}
    </div>
  )
}
