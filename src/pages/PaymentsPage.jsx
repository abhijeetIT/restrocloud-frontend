import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { paymentApi } from '../api'
import { Button, Modal, Select, PageHeader, Card, CardTitle, Badge, Table, Th, Td, Spinner, Empty, Grid, StatCard, Pagination } from '../components/UI'
import { PAYMENT_STATUS_COLOR, PAYMENT_STATUSES, PAYMENT_METHODS } from '../constants'
import styles from './PaymentsPage.module.css'

const toDate = d => d.toISOString().split('T')[0]
const today     = () => toDate(new Date())
const yesterday = () => { const d = new Date(); d.setDate(d.getDate()-1); return toDate(d) }

export default function PaymentsPage() {
  const [data, setData]         = useState(null)
  const [page, setPage]         = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter]     = useState('') // ''|'today'|'yesterday'
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [methodModal, setMethodModal] = useState(null)
  const [statusForm, setStatusForm] = useState('PAID')
  const [methodForm, setMethodForm] = useState('CASH')
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async (pg = 0) => {
    setLoading(true)
    try {
      let start = null, end = null
      if (dateFilter === 'today')     { start = today();     end = today() }
      if (dateFilter === 'yesterday') { start = yesterday(); end = yesterday() }
      const r = await paymentApi.getAll(pg, 10, statusFilter||null, start, end)
      setData(r.data); setPage(pg)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [statusFilter, dateFilter])

  useEffect(() => { load(0) }, [load])

  const updateStatus = async e => {
    e.preventDefault(); setSaving(true)
    try { await paymentApi.updateStatus(modal.paymentId, { paymentStatus: statusForm }); toast.success('Status updated!'); setModal(null); load(page) }
    catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const updateMethod = async e => {
    e.preventDefault(); setSaving(true)
    try { await paymentApi.updateMethod(methodModal.paymentId, { paymentMethod: methodForm, amount: methodModal.amount }); toast.success('Method updated!'); setMethodModal(null); load(page) }
    catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const content = data?.content || []
  const totalPaid = content.filter(p=>p.paymentStatus==='PAID').reduce((s,p)=>s+p.amount,0)

  return (
    <div className="animate-fadeInUp">
      <PageHeader title="Payments" subtitle={`${data?.totalElements || 0} total records`} />

      <div className={`${styles.stats_row} stagger`}>
        <div className="animate-fadeInUp"><StatCard label="Showing Paid" value={`₹${totalPaid.toFixed(0)}`} icon="💰" accent="green" /></div>
        <div className="animate-fadeInUp"><StatCard label="Records on Page" value={content.length} icon="📄" accent="blue" /></div>
        <div className="animate-fadeInUp"><StatCard label="Total Records" value={data?.totalElements ?? '—'} icon="📊" accent="secondary" /></div>
        <div className="animate-fadeInUp"><StatCard label="Total Pages" value={data?.totalPages ?? '—'} icon="📑" accent="orange" /></div>
      </div>

      {/* Filters */}
      <Card>
        <div className={styles.filters}>
          {/* Status */}
          <div className={styles.filter_group}>
            <span className={styles.filter_label}>Status</span>
            <div className={styles.filter_tabs}>
              <button className={`${styles.tab} ${statusFilter===''?styles.tab_active:''}`} onClick={()=>{ setStatusFilter(''); load(0) }}>All</button>
              {PAYMENT_STATUSES.map(s=>(
                <button key={s} className={`${styles.tab} ${statusFilter===s?styles.tab_active:''}`} onClick={()=>{ setStatusFilter(s); load(0) }}>{s}</button>
              ))}
            </div>
          </div>
          {/* Date */}
          <div className={styles.filter_group}>
            <span className={styles.filter_label}>Date</span>
            <div className={styles.filter_tabs}>
              <button className={`${styles.tab} ${dateFilter===''?styles.tab_active:''}`} onClick={()=>{ setDateFilter(''); load(0) }}>All Time</button>
              <button className={`${styles.tab} ${dateFilter==='today'?styles.tab_active:''}`} onClick={()=>{ setDateFilter('today'); load(0) }}>Today</button>
              <button className={`${styles.tab} ${dateFilter==='yesterday'?styles.tab_active:''}`} onClick={()=>{ setDateFilter('yesterday'); load(0) }}>Yesterday</button>
            </div>
          </div>
        </div>

        {loading ? <Spinner />
        : content.length===0 ? <Empty icon="💳" text="No payments found for selected filters" />
        : <>
            <Table>
              <thead>
                <tr>
                  <Th>Pay ID</Th><Th>Order ID</Th><Th>Amount</Th><Th>Method</Th><Th>Status</Th><Th>Time</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {content.map(p=>{
                  const c = PAYMENT_STATUS_COLOR[p.paymentStatus]||{}
                  return (
                    <tr key={p.paymentId}>
                      <Td><span className={styles.id_col}>#{p.paymentId}</span></Td>
                      <Td><span className={styles.id_col}>#{p.orderId}</span></Td>
                      <Td><span className={styles.amount}>₹{p.amount?.toFixed(2)}</span></Td>
                      <Td><span className={styles.method_tag}>{p.paymentMethod}</span></Td>
                      <Td><Badge bg={c.bg} color={c.color}>{p.paymentStatus}</Badge></Td>
                      <Td><span className={styles.time_col}>{p.paymentTime ? new Date(p.paymentTime).toLocaleString() : '—'}</span></Td>
                      <Td>
                        <div style={{display:'flex',gap:5}}>
                          <Button variant="ghost" size="sm" onClick={()=>{ setStatusForm(p.paymentStatus); setModal(p) }}>Status</Button>
                          <Button variant="blue"  size="sm" onClick={()=>{ setMethodForm(p.paymentMethod); setMethodModal(p) }}>Method</Button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} size={data.size} onPageChange={p=>load(p)} />
          </>
        }
      </Card>

      {modal && (
        <Modal title={`Update Payment #${modal.paymentId} Status`} onClose={()=>setModal(null)} size="sm">
          <form onSubmit={updateStatus}>
            <Select label="Payment Status" value={statusForm} onChange={e=>setStatusForm(e.target.value)}>
              {PAYMENT_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
            </Select>
            <Grid cols={2} gap={12} style={{marginTop:16}}>
              <Button type="button" variant="ghost" full onClick={()=>setModal(null)}>Cancel</Button>
              <Button type="submit" variant="primary" full loading={saving}>Update</Button>
            </Grid>
          </form>
        </Modal>
      )}

      {methodModal && (
        <Modal title={`Update Payment #${methodModal.paymentId} Method`} onClose={()=>setMethodModal(null)} size="sm">
          <form onSubmit={updateMethod}>
            <Select label="Payment Method" value={methodForm} onChange={e=>setMethodForm(e.target.value)}>
              {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
            </Select>
            <Grid cols={2} gap={12} style={{marginTop:16}}>
              <Button type="button" variant="ghost" full onClick={()=>setMethodModal(null)}>Cancel</Button>
              <Button type="submit" variant="primary" full loading={saving}>Update</Button>
            </Grid>
          </form>
        </Modal>
      )}
    </div>
  )
}
