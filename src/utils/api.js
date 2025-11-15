const API = {
  base: 'http://localhost:9090/springapp2',
  async login(creds){
    const res = await fetch(`${this.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    })
    if(!res.ok) {
      let errText = 'Login failed'
      try { const errBody = await res.json(); if(errBody && errBody.error) errText = errBody.error } catch(e) {}
      throw new Error(errText)
    }
    return res.json()
  }
  ,
  async register(role, payload){
    const res = await fetch(`${this.base}/api/auth/register?role=${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if(!res.ok) {
      let errText = 'Registration failed'
      try { const errBody = await res.json(); if(errBody && errBody.error) errText = errBody.error } catch(e) {}
      throw new Error(errText)
    }
    return res.json()
  }

  // grievance endpoints
  ,async submitGrievance(formData){
    const token = localStorage.getItem('jwt')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await fetch(`${this.base}/api/grievances`, { method: 'POST', headers, body: formData })
    if(!res.ok){
      let err = 'Submit failed'
      try{ const b = await res.json(); if(b && b.error) err = b.error }catch(e){}
      throw new Error(err)
    }
    const body = await res.json()
    if(body && body.imageUrl && body.imageUrl.startsWith('/')) body.imageUrl = this.base + body.imageUrl
    return body
  }

  ,async getMyGrievances(){
    const token = localStorage.getItem('jwt')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await fetch(`${this.base}/api/grievances/me`, { headers })
    if(!res.ok) return []
    const list = await res.json()
    if(Array.isArray(list)){
      // normalize urls and fetch protected images as blobs (with auth) returning object URLs
      const normalized = list.map(item => {
        if(item && item.imageUrl && item.imageUrl.startsWith('/')) item.imageUrl = this.base + item.imageUrl
        return item
      })
      // fetch image blobs in parallel (if token provided)
      if(token){
        await Promise.all(normalized.map(async itm => {
          if(itm && itm.imageUrl){
            try{
              const r = await fetch(itm.imageUrl, { headers })
              if(r.ok){
                const blob = await r.blob()
                // create object URL for use in <img>
                itm.imageBlobUrl = URL.createObjectURL(blob)
              }
            }catch(e){ /* ignore image fetch errors */ }
          }
        }))
      }
      return normalized
    }
    return list
  }

    ,async getAllComplaints(){
      const token = localStorage.getItem('jwt')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${this.base}/api/complaints`, { headers })
      if(!res.ok){
        // If 403, attempt diagnostic whoami call and surface helpful message
        if(res.status === 403){
          try{
            const who = await this.whoami()
            // provide diagnostic payload via thrown error
            throw new Error(`Forbidden (403). Server reports: ${JSON.stringify(who)}`)
          }catch(e){
            // whoami may also fail; fall back to default message
            throw new Error('Forbidden (403). Please re-login as an admin.')
          }
        }
        let err = `Request failed (${res.status})`
        try{ const body = await res.json(); if(body && body.error) err = body.error }catch(e){}
        throw new Error(err)
      }
      return res.json()
    }

    ,async assignComplaint(id, body){
      const token = localStorage.getItem('jwt')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
      const res = await fetch(`${this.base}/api/complaints/${id}/assign`, { method: 'PUT', headers, body: JSON.stringify(body) })
      if(!res.ok) {
        let err = 'Assign failed'
        try{ const b = await res.json(); if(b && b.error) err = b.error }catch(e){}
        throw new Error(err)
      }
      return res.json()
    }

    ,async addOfficer(payload){
      const token = localStorage.getItem('jwt')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
      const res = await fetch(`${this.base}/api/officers`, { method: 'POST', headers, body: JSON.stringify(payload) })
      if(!res.ok){
        let err = 'Add officer failed'
        try{ const b = await res.json(); if(b && b.error) err = b.error }catch(e){}
        throw new Error(err)
      }
      return res.json()
    }

    ,async getOfficers(){
      const token = localStorage.getItem('jwt')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${this.base}/api/officers`, { headers })
      if(!res.ok){
        let err = `Request failed (${res.status})`
        try{ const body = await res.json(); if(body && body.error) err = body.error }catch(e){}
        throw new Error(err)
      }
      return res.json()
    }

    ,async getAssignedComplaints(officerId){
      // If officerId is omitted, ask server for 'me' assigned complaints
      const token = localStorage.getItem('jwt')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const url = officerId ? `${this.base}/api/complaints/officer/${officerId}` : `${this.base}/api/complaints/officer/me`
      const res = await fetch(url, { headers })
      if(!res.ok){
        let err = `Request failed (${res.status})`
        try{ const body = await res.json(); if(body && body.error) err = body.error }catch(e){}
        throw new Error(err)
      }
      return res.json()
    }

    ,async whoami(){
      const token = localStorage.getItem('jwt')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${this.base}/debug/whoami`, { headers })
      if(!res.ok){
        let err = `Request failed (${res.status})`
        try{ const body = await res.json(); if(body && body.error) err = body.error }catch(e){}
        throw new Error(err)
      }
      return res.json()
    }

    ,async updateComplaintResolution(id, { status, resolutionNote, imageFile }){
      const token = localStorage.getItem('jwt')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      // If there's an imageFile, send multipart/form-data, else JSON
      if(imageFile){
        const fd = new FormData()
        if(status) fd.append('status', status)
        if(resolutionNote) fd.append('resolutionNote', resolutionNote)
        fd.append('resolutionImage', imageFile)
        const res = await fetch(`${this.base}/api/complaints/${id}/update`, { method: 'PUT', headers, body: fd })
        if(!res.ok){
          let err = 'Update failed'
          try{ const b = await res.json(); if(b && b.error) err = b.error }catch(e){}
          throw new Error(err)
        }
        return res.json()
      }else{
        const res = await fetch(`${this.base}/api/complaints/${id}/update`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ status, resolutionNote }) })
        if(!res.ok){
          let err = 'Update failed'
          try{ const b = await res.json(); if(b && b.error) err = b.error }catch(e){}
          throw new Error(err)
        }
        return res.json()
      }
    }
}

export default API
