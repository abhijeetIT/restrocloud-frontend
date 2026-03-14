import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/UI'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await authApi.login(form)
      login(res.data.token, { email: res.data.email })
      toast.success('Welcome back! 🎉')
      navigate('/dashboard')
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo_wrap}>
          <div className={styles.logo_icon}>🍽</div>
          <div className={styles.logo}>RestroCloud</div>
        </div>
        <div className={styles.sub}>Sign in to manage your restaurant</div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input label="Email Address" type="email" placeholder="you@restaurant.com" value={form.email} onChange={set('email')} required />
          <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          <Button type="submit" variant="primary" full loading={loading} size="lg" style={{ marginTop: 8 }}>
            Sign In →
          </Button>
        </form>
        <div className={styles.switch}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.link}>Register Restaurant</Link>
        </div>
      </div>
    </div>
  )
}
