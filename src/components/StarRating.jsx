import React from 'react'

export default function StarRating({ value = 0, onChange = () => {}, size = 22, readOnly = false }){
  const stars = [1,2,3,4,5]
  const numeric = typeof value === 'number' ? value : parseFloat(value) || 0
  const rounded = Math.round(numeric)
  return (
    <div style={{display:'flex',gap:6,alignItems:'center'}}>
      {stars.map(s => (
        <svg key={s} onClick={() => { if(!readOnly) onChange(s) }} width={size} height={size} viewBox="0 0 24 24" style={{cursor: readOnly ? 'default' : 'pointer'}} aria-hidden>
          <path fill={s <= rounded ? '#f59e0b' : '#e2e8f0'} d="M12 .587l3.668 7.431L24 9.748l-6 5.843 1.416 8.269L12 19.77 4.584 23.86 6 15.591 0 9.748l8.332-1.73z" />
        </svg>
      ))}
    </div>
  )
}
