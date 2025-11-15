import React from 'react'
import './SideNav.css'

export default function SideNav({ active = 'dashboard', onSelect = () => {}, complaintCount = 0 }){
  return (
    <nav className="sidenav" aria-label="Main navigation">
      <ul>
        <li>
          <button className={active === 'dashboard' ? 'active' : ''} onClick={() => onSelect('dashboard')}>
            Dashboard
          </button>
        </li>
        <li>
          <button className={active === 'raise' ? 'active' : ''} onClick={() => onSelect('raise')}>
            Raise Complaint
          </button>
        </li>
        <li>
          <button className={active === 'my' ? 'active' : ''} onClick={() => onSelect('my')}>
            My Complaints <span className="sidenav-count">{complaintCount}</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
