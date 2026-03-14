import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { tableApi } from '../api'
import { Button, Modal, Input, Select, PageHeader, Empty, Spinner, Badge, Card, Grid } from '../components/UI'
import { TABLE_STATUSES, TABLE_STATUS_COLOR } from '../constants'
import styles from './TablesPage.module.css'

const DEFAULT_FORM = { tableNumber: '', capacity: '', status: 'AVAILABLE' }

export default function TablesPage() {
  const [tables, setTables]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(DEFAULT_FORM)
  const [saving, setSaving]   = useState(false)
  const [filter, setFilter]   = useState('ALL')

  const load = async () => {
    try { const r = await tableApi.getAll(); setTables(r.data || []) }
    catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(DEFAULT_FORM); setModal('add') }
  const openEdit = t  => { setForm({ tableNumber: String(t.tableNumber), capacity: String(t.capacity), status: t.status }); setModal(t) }
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async e => {
    e.preventDefault(); setSaving(true)
    const body = { tableNumber: parseInt(form.tableNumber), capacity: parseInt(form.capacity), status: form.status }
    try {
      if (modal === 'add') { await tableApi.create(body); toast.success('Table added!') }
      else { await tableApi.update(modal.id, body); toast.success('Table updated!') }
      setModal(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const del = async t => {
    if (!window.confirm(`Delete Table #${t.tableNumber}?`)) return
    try { await tableApi.delete(t.id); toast.success('Deleted!'); load() }
    catch (e) { toast.error(e.message) }
  }

  const filtered = filter === 'ALL' ? tables : tables.filter(t => t.status === filter)

  return (
    <div>
      <PageHeader title="Dining Tables" subtitle={`${tables.length} tables total`}>
        <Button onClick={openAdd}>+ Add Table</Button>
      </PageHeader>

      {/* Summary */}
      <Grid cols={4} gap={14} style={{ marginBottom: 24 }}>
        <button className={`${styles.sum_card} ${filter==='ALL'?styles.sum_active:''}`} onClick={() => setFilter('ALL')}>
          <div className={styles.sum_num}>{tables.length}</div>
          <div className={styles.sum_label}>All Tables</div>
        </button>
        {TABLE_STATUSES.map(s => {
          const c = TABLE_STATUS_COLOR[s]
          return (
            <button key={s} className={`${styles.sum_card} ${filter===s?styles.sum_active:''}`} onClick={() => setFilter(s)}
              style={filter === s ? { borderColor: c.color } : {}}>
              <div className={styles.sum_num} style={{ color: filter === s ? c.color : undefined }}>
                {tables.filter(t => t.status === s).length}
              </div>
              <div className={styles.sum_label}>{s}</div>
            </button>
          )
        })}
      </Grid>

      {loading ? <Spinner />
      : filtered.length === 0 ? <Empty icon="🪑" text="No tables found" />
      : (
        <div className={styles.grid}>
          {filtered.map(t => {
            const c = TABLE_STATUS_COLOR[t.status] || {}
            return (
              <div key={t.id} className={styles.table_card} style={{ borderColor: c.border }}>
                <div className={styles.table_num}># {t.tableNumber}</div>
                <div className={styles.table_cap}>👥 Capacity: {t.capacity}</div>
                <Badge bg={`${c.color}22`} color={c.color}>{t.status}</Badge>
                <div className={styles.table_actions}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>✏️ Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => del(t)}>🗑</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Table' : `Edit Table #${modal.tableNumber}`} onClose={() => setModal(null)} size="sm">
          <form onSubmit={save}>
            <Grid cols={2} gap={14}>
              <Input label="Table Number" type="number" min="1" placeholder="1" value={form.tableNumber} onChange={set('tableNumber')} required />
              <Input label="Capacity" type="number" min="1" placeholder="4" value={form.capacity} onChange={set('capacity')} required />
            </Grid>
            <Select label="Status" value={form.status} onChange={set('status')}>
              {TABLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Grid cols={2} gap={12} style={{ marginTop: 20 }}>
              <Button type="button" variant="ghost" full onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit" full loading={saving}>Save</Button>
            </Grid>
          </form>
        </Modal>
      )}
    </div>
  )
}
