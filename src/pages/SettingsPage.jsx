import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { restaurantApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Modal, PageHeader, Card, CardTitle, Grid, Spinner, Badge, Divider } from '../components/UI'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { logout } = useAuth()
  const navigate   = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [delModal, setDelModal]     = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', phoneNumber: '' })

  useEffect(() => {
    restaurantApi.get()
      .then(r => {
        setRestaurant(r.data)
        const d = r.data
        setForm({ name: d.name || '', email: d.email || '', password: '', address: d.address || '', phoneNumber: d.phoneNumber || '' })
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleUpdate = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await restaurantApi.update(form)
      toast.success('Details updated! ✅')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await restaurantApi.delete()
      toast.success('Restaurant deleted')
      logout()
      navigate('/login')
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <Spinner />

  return (
    <div className={styles.wrap}>
      <PageHeader title="Settings" subtitle="Manage your restaurant account" />

      {/* Profile Info (read-only card) */}
      {restaurant && (
        <Card style={{ marginBottom: 20 }}>
          <CardTitle icon="🏪">Restaurant Profile</CardTitle>
          <div className={styles.profile_grid}>
            <div className={styles.profile_avatar}>{(restaurant.name || 'R')[0]}</div>
            <div className={styles.profile_info}>
              <div className={styles.profile_name}>{restaurant.name}</div>
              <div className={styles.profile_detail}>✉️ {restaurant.email}</div>
              <div className={styles.profile_detail}>📞 {restaurant.phoneNumber}</div>
              <div className={styles.profile_detail}>📍 {restaurant.address}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge bg={restaurant.isActive ? 'rgba(76,175,125,.15)' : 'rgba(224,82,82,.15)'} color={restaurant.isActive ? '#4caf7d' : '#e05252'}>
                  {restaurant.isActive ? '● Active' : '● Inactive'}
                </Badge>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Joined {restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Update Form */}
      <Card style={{ marginBottom: 20 }}>
        <CardTitle icon="✏️">Update Details</CardTitle>
        <form onSubmit={handleUpdate}>
          <Grid cols={2} gap={14}>
            <Input label="Restaurant Name" placeholder="The Grand Bistro" value={form.name} onChange={set('name')} required />
            <Input label="Phone Number" placeholder="+91 9876543210" value={form.phoneNumber} onChange={set('phoneNumber')} required />
          </Grid>
          <Input label="Email Address" type="email" placeholder="contact@restaurant.com" value={form.email} onChange={set('email')} required />
          <Input label="New Password" type="password" placeholder="Leave blank to keep current" value={form.password} onChange={set('password')} />
          <Input label="Address" placeholder="123 Food Street, Mumbai" value={form.address} onChange={set('address')} required />
          <Button type="submit" loading={saving} style={{ marginTop: 4 }}>Save Changes</Button>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card style={{ borderColor: 'rgba(224,82,82,.3)' }}>
        <CardTitle icon="⚠️">Danger Zone</CardTitle>
        <p className={styles.danger_text}>
          Permanently delete your restaurant account and all associated data — tables, menu items, orders, and payments. This action is irreversible.
        </p>
        <Button variant="danger" onClick={() => setDelModal(true)}>Delete Restaurant Account</Button>
      </Card>

      {delModal && (
        <Modal title="Confirm Deletion" onClose={() => setDelModal(false)} size="sm">
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            Are you absolutely sure? This will permanently delete <strong style={{ color: 'var(--text)' }}>{restaurant?.name}</strong> and all its data. You cannot undo this.
          </p>
          <Grid cols={2} gap={12}>
            <Button variant="ghost" full onClick={() => setDelModal(false)}>Cancel</Button>
            <Button variant="danger" full onClick={handleDelete}>Yes, Delete Everything</Button>
          </Grid>
        </Modal>
      )}
    </div>
  )
}
