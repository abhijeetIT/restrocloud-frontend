import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../api'
import { Button, Input, Grid } from '../components/UI'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', phoneNumber: '' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      await authApi.register(form)
      toast.success('Restaurant registered! Please login. 🎉')
      navigate('/login')
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card} style={{ maxWidth: 520 }}>
        <div className={styles.logo_wrap}>
          <div className={styles.logo_icon}>🍽</div>
          <div className={styles.logo}>RestroCloud</div>
        </div>
        <div className={styles.sub}>Register your restaurant to get started</div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Grid cols={2} gap={14}>
            <Input label="Restaurant Name" placeholder="The Grand Bistro" value={form.name} onChange={set('name')} required />
            <Input label="Phone" placeholder="+91 9876543210" value={form.phoneNumber} onChange={set('phoneNumber')} required />
          </Grid>
          <Input label="Email" type="email" placeholder="contact@restaurant.com" value={form.email} onChange={set('email')} required />
          <Input label="Password" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />
          <Input label="Address" placeholder="123 Food Street, Mumbai" value={form.address} onChange={set('address')} required />
          <Button type="submit" variant="primary" full loading={loading} size="lg" style={{ marginTop: 8 }}>
            Create Restaurant →
          </Button>
        </form>
        <div className={styles.switch}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign In</Link>
        </div>
      </div>
    </div>
  )
}
