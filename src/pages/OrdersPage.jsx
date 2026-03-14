import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { orderApi, tableApi, menuApi } from '../api'
import { Button, Modal, Select, Input, PageHeader, Card, CardTitle, Badge, Spinner, Grid, Divider, Empty, Pagination } from '../components/UI'
import { ORDER_STATUS_COLOR, ORDER_STATUSES, PAYMENT_METHODS, CATEGORY_EMOJI } from '../constants'
import styles from './OrdersPage.module.css'

/* ─── helpers ─── */
const toDate = d => d.toISOString().split('T')[0]
const today     = () => toDate(new Date())
const yesterday = () => { const d = new Date(); d.setDate(d.getDate()-1); return toDate(d) }

/* ─── Order Created Celebration ─── */
function OrderSuccess({ order, onClose }) {
  return (
    <div className={styles.success_overlay}>
      <div className={styles.success_card}>
        <div className={styles.confetti_wrap}>
          {[...Array(16)].map((_,i)=>(
            <div key={i} className={styles.confetti} style={{
              left:`${5+Math.random()*90}%`,
              background:['#e63946','#457b9d','#2dc653','#f4a261','#f9c74f','#1d3557'][i%6],
              animationDelay:`${Math.random()*.6}s`,
              animationDuration:`${.7+Math.random()*.7}s`,
              width:`${5+Math.random()*9}px`, height:`${5+Math.random()*9}px`,
              borderRadius: Math.random()>.5?'50%':'3px',
            }}/>
          ))}
        </div>
        <div className={styles.success_icon}>🎉</div>
        <div className={styles.success_title}>Order Created!</div>
        <div className={styles.success_sub}>Order <strong>#{order.id}</strong> placed for Table #{order.tableNumber}</div>
        <div className={styles.success_chips}>
          <span className={styles.chip}>📋 {order.orderStatus}</span>
          <span className={styles.chip}>🪑 Table #{order.tableNumber}</span>
        </div>
        <p className={styles.success_hint}>Now add items to this order using the panel on the right →</p>
        <Button variant="primary" full onClick={onClose} style={{marginTop:18}}>Start Adding Items →</Button>
      </div>
    </div>
  )
}

/* ─── Status Step Bar ─── */
const STATUS_STEPS = ['PLACED','PREPARING','SERVED','COMPLETED']
function StatusBar({ status }) {
  if (status === 'CANCELLED') return (
    <div className={styles.status_cancelled}>✕ Order Cancelled</div>
  )
  const idx = STATUS_STEPS.indexOf(status)
  return (
    <div className={styles.status_bar}>
      {STATUS_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`${styles.status_step} ${i<=idx?styles.step_done:''} ${i===idx?styles.step_current:''}`}>
            <div className={styles.step_dot}>{i<idx?'✓':i+1}</div>
            <div className={styles.step_label}>{s}</div>
          </div>
          {i < STATUS_STEPS.length-1 && <div className={`${styles.step_line} ${i<idx?styles.line_done:''}`}/>}
        </React.Fragment>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
export default function OrdersPage() {
  const [tables,    setTables]    = useState([])
  const [menuItems, setMenuItems] = useState([])

  /* ── Active order (right panel) ── */
  const [activeOrder,  setActiveOrder]  = useState(null)
  const [payment,      setPayment]      = useState(null)
  const [orderIdInput, setOrderIdInput] = useState('')
  const [fetchLoading, setFetchLoading] = useState(false)

  /* ── Order list (left panel) ── */
  const [listData,    setListData]    = useState(null)
  const [listPage,    setListPage]    = useState(0)
  const [listStatus,  setListStatus]  = useState('')
  const [dateFilter,  setDateFilter]  = useState('')
  const [listLoading, setListLoading] = useState(false)

  /* ── Modals ── */
  const [modal,        setModal]        = useState(null) // 'create'|'addItem'|'editItem'|'pay'|'cancel'
  const [successOrder, setSuccessOrder] = useState(null)
  const [saving,       setSaving]       = useState(false)

  /* ── Forms ── */
  const [createForm,  setCreateForm]  = useState({ tableId: '' })
  const [itemForm,    setItemForm]    = useState({ menuItemId: '', quantity: 1 })
  const [editTarget,  setEditTarget]  = useState(null)
  const [payForm,     setPayForm]     = useState({ paymentMethod: 'CASH', amount: '' })

  /* ─── Load tables + menu once ─── */
  useEffect(() => {
    tableApi.getAll().then(r => setTables(r.data||[])).catch(()=>{})
    menuApi.getAll().then(r  => setMenuItems(r.data||[])).catch(()=>{})
  }, [])

  /* ─── Load paginated order list ─── */
  const loadList = useCallback(async (pg=0) => {
    setListLoading(true)
    try {
      let start=null, end=null
      if (dateFilter==='today')     { start=today();     end=today() }
      if (dateFilter==='yesterday') { start=yesterday(); end=yesterday() }
      const r = await orderApi.getAll(pg, 8, listStatus||null, start, end)
      setListData(r.data); setListPage(pg)
    } catch(e) { toast.error(e.message) }
    finally { setListLoading(false) }
  }, [listStatus, dateFilter])

  useEffect(() => { loadList(0) }, [loadList])

  /* ─── Fetch single order ─── */
  const fetchOrder = async (id) => {
    if (!id) return
    setFetchLoading(true); setPayment(null)
    try {
      const r = await orderApi.getById(id)
      setActiveOrder(r.data)
      setOrderIdInput(String(id))
      try { const p = await orderApi.getPayment(id); setPayment(p.data) } catch {}
    } catch(e) { toast.error(e.message); setActiveOrder(null) }
    finally { setFetchLoading(false) }
  }

  /* ─── Refresh active order ─── */
  const refreshActive = async () => {
    if (activeOrder) await fetchOrder(activeOrder.id)
  }

  /* ─── Create order ─── */
  const createOrder = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const r = await orderApi.create({ tableId: parseInt(createForm.tableId) })
      setModal(null)
      setSuccessOrder(r.data)
      loadList(0)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const onSuccessClose = () => {
    const o = successOrder
    setSuccessOrder(null)
    setActiveOrder(o)
    setOrderIdInput(String(o.id))
    setPayment(null)
  }

  /* ─── Add item ─── */
  const addItem = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const r = await orderApi.addItem(activeOrder.id, {
        menuItemId: parseInt(itemForm.menuItemId),
        quantity:   parseInt(itemForm.quantity)
      })
      toast.success('Item added! 🍽')
      setActiveOrder(r.data); setModal(null)
      setItemForm({ menuItemId:'', quantity:1 })
      loadList(listPage)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  /* ─── Edit / update item quantity ─── */
  const updateItem = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const r = await orderApi.updateItem(activeOrder.id, editTarget.id, {
        menuItemId: parseInt(itemForm.menuItemId),
        quantity:   parseInt(itemForm.quantity)
      })
      toast.success('Item updated!')
      setActiveOrder(r.data); setModal(null)
      loadList(listPage)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  /* ─── Remove item ─── */
  const removeItem = async (itemId) => {
    if (!window.confirm('Remove this item?')) return
    try {
      const r = await orderApi.removeItem(activeOrder.id, itemId)
      toast.success('Item removed')
      setActiveOrder(r.data)
      loadList(listPage)
    } catch(e) { toast.error(e.message) }
  }

  /* ─── Complete order ─── */
  const completeOrder = async () => {
    if (!window.confirm('Mark order as COMPLETED? This will generate a payment.')) return
    try {
      const r = await orderApi.complete(activeOrder.id)
      toast.success('Order completed! 🎉')
      setActiveOrder(r.data)
      loadList(listPage)
    } catch(e) { toast.error(e.message) }
  }

  /* ─── Cancel order ─── */
  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return
    try {
      await orderApi.cancel(activeOrder.id)
      toast.success('Order cancelled')
      setActiveOrder(prev => ({ ...prev, orderStatus: 'CANCELLED' }))
      loadList(listPage)
    } catch(e) { toast.error(e.message) }
  }

  /* ─── Process payment ─── */
  const processPayment = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const r = await orderApi.processPayment(activeOrder.id, {
        paymentMethod: payForm.paymentMethod,
        amount: parseFloat(payForm.amount || 0)
      })
      toast.success('Payment processed! 💳')
      setPayment(r.data); setModal(null)
      loadList(listPage)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const sc = activeOrder ? ORDER_STATUS_COLOR[activeOrder.orderStatus] || {} : {}
  const canEdit = activeOrder && !['COMPLETED','CANCELLED'].includes(activeOrder.orderStatus)

  return (
    <div className="animate-fadeInUp">
      {successOrder && <OrderSuccess order={successOrder} onClose={onSuccessClose} />}

      <PageHeader title="Orders" subtitle="Manage dine-in orders end to end">
        <Button variant="primary" onClick={() => setModal('create')}>+ New Order</Button>
      </PageHeader>

      <div className={styles.layout}>

        {/* ════ LEFT — Order List ════ */}
        <div className={styles.left_panel}>
          <Card>
            <div className={styles.panel_header}>
              <CardTitle icon="📋">All Orders</CardTitle>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
              <select className={styles.filter_select} value={listStatus}
                onChange={e => { setListStatus(e.target.value); loadList(0) }}>
                <option value="">All Status</option>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className={styles.date_btns}>
                {[['','All'],['today','Today'],['yesterday','Yesterday']].map(([v,l])=>(
                  <button key={v} className={`${styles.date_btn} ${dateFilter===v?styles.date_active:''}`}
                    onClick={()=>{ setDateFilter(v); loadList(0) }}>{l}</button>
                ))}
              </div>
            </div>

            {listLoading ? <Spinner />
            : !listData?.content?.length
              ? <Empty icon="📋" text="No orders found" />
              : <>
                  <div className={styles.order_list}>
                    {listData.content.map(o => {
                      const c = ORDER_STATUS_COLOR[o.orderStatus] || {}
                      const isActive = activeOrder?.id === o.id
                      return (
                        <div key={o.id}
                          className={`${styles.order_row} ${isActive ? styles.order_row_active : ''}`}
                          onClick={() => fetchOrder(o.id)}>
                          <div className={styles.order_row_left}>
                            <div className={styles.order_row_id}>#{o.id}</div>
                            <div className={styles.order_row_table}>Table #{o.tableNumber}</div>
                            <div className={styles.order_row_time}>
                              {o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : ''}
                            </div>
                          </div>
                          <div className={styles.order_row_right}>
                            <div className={styles.order_row_amt}>₹{(o.totalAmount||0).toFixed(0)}</div>
                            <Badge bg={c.bg} color={c.color}>{o.orderStatus}</Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <Pagination
                    page={listData.page} totalPages={listData.totalPages}
                    totalElements={listData.totalElements} size={listData.size}
                    onPageChange={p => loadList(p)}
                  />
                </>
            }
          </Card>
        </div>

        {/* ════ RIGHT — Active Order Detail ════ */}
        <div className={styles.right_panel}>
          <Card>
            <div className={styles.panel_header}>
              <CardTitle icon="🔍">Order Detail</CardTitle>
              {/* Quick lookup */}
              <div className={styles.lookup_row}>
                <input className={styles.lookup_input} type="number" placeholder="Order ID..."
                  value={orderIdInput} onChange={e=>setOrderIdInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&fetchOrder(orderIdInput)} />
                <Button variant="secondary" size="sm" onClick={()=>fetchOrder(orderIdInput)} loading={fetchLoading}>Go</Button>
              </div>
            </div>

            {fetchLoading && <Spinner />}

            {!fetchLoading && !activeOrder && (
              <div className={styles.select_hint}>
                <div className={styles.hint_icon}>👈</div>
                <div className={styles.hint_text}>Select an order from the list, or enter an Order ID above</div>
              </div>
            )}

            {!fetchLoading && activeOrder && (
              <div>
                {/* Order header */}
                <div className={styles.order_detail_header}>
                  <div>
                    <div className={styles.order_detail_id}>Order #{activeOrder.id}</div>
                    <div className={styles.order_detail_meta}>
                      🪑 Table #{activeOrder.tableNumber}
                      {activeOrder.createdAt &&
                        <span> · {new Date(activeOrder.createdAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</span>
                      }
                    </div>
                  </div>
                  <Badge bg={sc.bg} color={sc.color}>{activeOrder.orderStatus}</Badge>
                </div>

                {/* Status progress bar */}
                <StatusBar status={activeOrder.orderStatus} />

                <Divider />

                {/* Items section */}
                <div className={styles.items_header}>
                  <span className={styles.items_title}>
                    🍽 Items ({(activeOrder.items||[]).length})
                  </span>
                  {canEdit && (
                    <Button size="sm" variant="primary"
                      onClick={()=>{ setItemForm({menuItemId:'',quantity:1}); setModal('addItem') }}>
                      + Add Item
                    </Button>
                  )}
                </div>

                {/* Items list */}
                {!activeOrder.items?.length
                  ? <div className={styles.empty_items}>No items yet — add items using the button above</div>
                  : <div className={styles.items_list}>
                      {activeOrder.items.map(item => (
                        <div key={item.id} className={styles.item_card}>
                          <div className={styles.item_emoji}>
                            {CATEGORY_EMOJI[item.category] || '🍽'}
                          </div>
                          <div className={styles.item_details}>
                            <div className={styles.item_name}>{item.menuItemName}</div>
                            <div className={styles.item_price}>₹{item.price} × {item.quantity}</div>
                          </div>
                          <div className={styles.item_subtotal}>₹{item.subTotal?.toFixed(2)}</div>
                          {canEdit && (
                            <div className={styles.item_btns}>
                              <button className={styles.icon_btn} title="Edit quantity"
                                onClick={()=>{
                                  setEditTarget(item)
                                  setItemForm({ menuItemId: String(item.menuItemId), quantity: item.quantity })
                                  setModal('editItem')
                                }}>✏️</button>
                              <button className={`${styles.icon_btn} ${styles.icon_btn_danger}`} title="Remove item"
                                onClick={()=>removeItem(item.id)}>🗑</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                }

                <Divider />

                {/* Total */}
                <div className={styles.total_row}>
                  <span className={styles.total_label}>Total Amount</span>
                  <span className={styles.total_value}>₹{(activeOrder.totalAmount||0).toFixed(2)}</span>
                </div>

                {/* Action buttons based on status */}
                <div className={styles.action_zone}>
                  {/* PLACED → can add items, mark preparing, cancel */}
                  {activeOrder.orderStatus === 'PLACED' && (
                    <div className={styles.action_row}>
                      <div className={styles.action_hint}>Order is placed. Add items then mark as Preparing.</div>
                      <div className={styles.action_btns}>
                        <Button variant="success" onClick={completeOrder}>✅ Complete Order</Button>
                        <Button variant="danger"  onClick={cancelOrder}>✕ Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* PREPARING */}
                  {activeOrder.orderStatus === 'PREPARING' && (
                    <div className={styles.action_row}>
                      <div className={styles.action_hint}>Kitchen is preparing the order.</div>
                      <div className={styles.action_btns}>
                        <Button variant="success" onClick={completeOrder}>✅ Complete Order</Button>
                        <Button variant="danger"  onClick={cancelOrder}>✕ Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* SERVED */}
                  {activeOrder.orderStatus === 'SERVED' && (
                    <div className={styles.action_row}>
                      <div className={styles.action_hint}>Order served. Complete to generate payment.</div>
                      <div className={styles.action_btns}>
                        <Button variant="success" onClick={completeOrder}>✅ Complete & Bill</Button>
                        <Button variant="danger"  onClick={cancelOrder}>✕ Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* COMPLETED — show payment section */}
                  {activeOrder.orderStatus === 'COMPLETED' && (
                    <div className={styles.payment_zone}>
                      <div className={styles.payment_zone_title}>💳 Payment</div>
                      {payment ? (
                        <div className={styles.payment_detail_grid}>
                          <div className={styles.payment_detail_item}>
                            <span className={styles.pd_label}>Payment ID</span>
                            <span className={styles.pd_value}>#{payment.paymentId}</span>
                          </div>
                          <div className={styles.payment_detail_item}>
                            <span className={styles.pd_label}>Amount</span>
                            <span className={styles.pd_value} style={{color:'var(--primary)',fontFamily:'Playfair Display,serif',fontWeight:800}}>₹{payment.amount?.toFixed(2)}</span>
                          </div>
                          <div className={styles.payment_detail_item}>
                            <span className={styles.pd_label}>Method</span>
                            <span className={styles.pd_value}>{payment.paymentMethod}</span>
                          </div>
                          <div className={styles.payment_detail_item}>
                            <span className={styles.pd_label}>Status</span>
                            <span className={styles.pd_value} style={{
                              color: payment.paymentStatus==='PAID'?'#1a8c3b':payment.paymentStatus==='FAILED'?'#e63946':'#a07800',
                              fontWeight:700
                            }}>{payment.paymentStatus}</span>
                          </div>
                          {payment.paymentTime && (
                            <div className={styles.payment_detail_item} style={{gridColumn:'span 2'}}>
                              <span className={styles.pd_label}>Paid At</span>
                              <span className={styles.pd_value}>{new Date(payment.paymentTime).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className={styles.action_hint}>Order complete! Process payment to finish.</div>
                          <Button variant="primary" style={{marginTop:10}}
                            onClick={()=>{
                              setPayForm({ paymentMethod:'CASH', amount: String(activeOrder.totalAmount||'') })
                              setModal('pay')
                            }}>
                            💳 Process Payment
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeOrder.orderStatus === 'CANCELLED' && (
                    <div className={styles.cancelled_note}>This order has been cancelled.</div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── CREATE ORDER MODAL ── */}
      {modal==='create' && (
        <Modal title="Create New Order" onClose={()=>setModal(null)} size="sm">
          <form onSubmit={createOrder}>
            <Select label="Select Table (Available only)" value={createForm.tableId}
              onChange={e=>setCreateForm({tableId:e.target.value})} required>
              <option value="">-- Choose a table --</option>
              {tables.filter(t=>t.status==='AVAILABLE').map(t=>(
                <option key={t.id} value={t.id}>Table #{t.tableNumber} · Seats {t.capacity}</option>
              ))}
            </Select>
            {!tables.filter(t=>t.status==='AVAILABLE').length && (
              <div className={styles.warn_msg}>⚠️ No available tables right now.</div>
            )}
            <Grid cols={2} gap={12} style={{marginTop:18}}>
              <Button type="button" variant="ghost" full onClick={()=>setModal(null)}>Cancel</Button>
              <Button type="submit" variant="primary" full loading={saving}>Create Order</Button>
            </Grid>
          </form>
        </Modal>
      )}

      {/* ── ADD ITEM MODAL ── */}
      {modal==='addItem' && (
        <Modal title={`Add Item — Order #${activeOrder?.id}`} onClose={()=>setModal(null)} size="sm">
          <form onSubmit={addItem}>
            <Select label="Select Menu Item" value={itemForm.menuItemId}
              onChange={e=>setItemForm(p=>({...p,menuItemId:e.target.value}))} required>
              <option value="">-- Choose item --</option>
              {menuItems.filter(m=>m.isAvailable).map(m=>(
                <option key={m.id} value={m.id}>{m.name} · ₹{m.price}</option>
              ))}
            </Select>
            <Input label="Quantity" type="number" min="1" max="99"
              value={itemForm.quantity}
              onChange={e=>setItemForm(p=>({...p,quantity:e.target.value}))} required />
            {/* Preview price */}
            {itemForm.menuItemId && itemForm.quantity && (
              <div className={styles.preview_price}>
                Subtotal: ₹{(
                  (menuItems.find(m=>m.id==itemForm.menuItemId)?.price||0) * itemForm.quantity
                ).toFixed(2)}
              </div>
            )}
            <Grid cols={2} gap={12} style={{marginTop:18}}>
              <Button type="button" variant="ghost" full onClick={()=>setModal(null)}>Cancel</Button>
              <Button type="submit" variant="primary" full loading={saving}>Add to Order</Button>
            </Grid>
          </form>
        </Modal>
      )}

      {/* ── EDIT ITEM MODAL ── */}
      {modal==='editItem' && (
        <Modal title={`Edit Item — ${editTarget?.menuItemName}`} onClose={()=>setModal(null)} size="sm">
          <form onSubmit={updateItem}>
            <Select label="Menu Item" value={itemForm.menuItemId}
              onChange={e=>setItemForm(p=>({...p,menuItemId:e.target.value}))} required>
              <option value="">-- Choose item --</option>
              {menuItems.filter(m=>m.isAvailable).map(m=>(
                <option key={m.id} value={m.id}>{m.name} · ₹{m.price}</option>
              ))}
            </Select>
            <Input label="Quantity (set 0 to remove)" type="number" min="0" max="99"
              value={itemForm.quantity}
              onChange={e=>setItemForm(p=>({...p,quantity:e.target.value}))} required />
            <Grid cols={2} gap={12} style={{marginTop:18}}>
              <Button type="button" variant="ghost" full onClick={()=>setModal(null)}>Cancel</Button>
              <Button type="submit" variant="primary" full loading={saving}>Update Item</Button>
            </Grid>
          </form>
        </Modal>
      )}

      {/* ── PAYMENT MODAL ── */}
      {modal==='pay' && (
        <Modal title={`Process Payment — Order #${activeOrder?.id}`} onClose={()=>setModal(null)} size="sm">
          <form onSubmit={processPayment}>
            <div className={styles.pay_amount_display}>
              <span>Order Total</span>
              <span>₹{activeOrder?.totalAmount?.toFixed(2)}</span>
            </div>
            <Input label="Amount to Collect (₹)" type="number" step="0.01" min="0"
              value={payForm.amount}
              onChange={e=>setPayForm(p=>({...p,amount:e.target.value}))} required />
            <Select label="Payment Method" value={payForm.paymentMethod}
              onChange={e=>setPayForm(p=>({...p,paymentMethod:e.target.value}))}>
              {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
            </Select>
            <Grid cols={2} gap={12} style={{marginTop:18}}>
              <Button type="button" variant="ghost" full onClick={()=>setModal(null)}>Cancel</Button>
              <Button type="submit" variant="primary" full loading={saving}>💳 Confirm Payment</Button>
            </Grid>
          </form>
        </Modal>
      )}
    </div>
  )
}
