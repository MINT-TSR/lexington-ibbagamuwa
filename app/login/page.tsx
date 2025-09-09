"use client"
import { useState } from 'react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ password }),
        credentials: 'include' // Ensure cookies are included
      })
      
      console.log('Login response:', res.status, res.ok)
      
      if (res.ok) {
        // Check if we can access the dashboard
        const dashboardRes = await fetch('/', { credentials: 'include' })
        console.log('Dashboard access:', dashboardRes.status)
        
        if (dashboardRes.ok) {
          window.location.replace('/')
        } else {
          // Try a full page reload to ensure cookies are processed
          window.location.reload()
        }
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6 space-y-4">
        <div className="text-center space-y-1">
          <div className="text-lg font-semibold">Finance Dashboard</div>
          <div className="text-xs text-gray-600">Sign in</div>
        </div>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <button onClick={submit} disabled={loading} className="w-full text-sm">{loading ? 'Signing in...' : 'Sign in'}</button>
      </div>
    </main>
  )
}

