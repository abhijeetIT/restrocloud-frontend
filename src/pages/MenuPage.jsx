import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { menuApi } from '../api'
import { Button, Modal, Input, Textarea, Select, Checkbox, PageHeader, Empty, Spinner, Badge, Grid } from '../components/UI'
import { CATEGORIES, CATEGORY_EMOJI } from '../constants'
import styles from './MenuPage.module.css'

const DEFAULT_FORM = { name:'', price:'', description:'', imageUrl:'', isAvailable:true, category:'STARTER' }

export default function MenuPage() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(DEFAULT_FORM)
  const [saving, setSaving]   = useState(false)
  const [catFilter, setCatFilter] = useState('ALL')
  const [search, setSearch]   = useState('')

  const load = async () => {
    try { const r = await menuApi.getAll(); setItems(r.data||[]) }
    catch(e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const openAdd  = () => { setForm(DEFAULT_FORM); setModal('add') }
  const openEdit = item => {
    setForm({ name:item.name, price:String(item.price), description:item.description||'',
      imageUrl:item.imageUrl||'', isAvailable:item.isAvailable, category:item.category })
    setModal(item)
  }
  const set = k => e => setForm(p=>({...p,[k]:e.target?e.target.value:e}))

  const save = async e => {
    e.preventDefault(); setSaving(true)
    const body = {...form, price:parseFloat(form.price)}
    try {
      if (modal==='add') { await menuApi.create(body); toast.success('Item added! 🍽') }
      else { await menuApi.update(modal.id,body); toast.success('Updated!') }
      setModal(null); load()
    } catch(e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const del = async item => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    try { await menuApi.deleteById(item.id); toast.success('Deleted!'); load() }
    catch(e) { toast.error(e.message) }
  }

  const filtered = items
    .filter(i => catFilter==='ALL' || i.category===catFilter)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="animate-fadeInUp">
      <PageHeader title="Menu Items" subtitle={`${items.length} total items`}>
        <Button variant="primary" onClick={openAdd}>+ Add Item</Button>
      </PageHeader>

      <div className={styles.filters}>
        <input className={styles.search} placeholder="🔍 Search items..." value={search} onChange={e=>setSearch(e.target.value)} />
        <div className={styles.cat_filters}>
          <button className={`${styles.cat_btn} ${catFilter==='ALL'?styles.active:''}`} onClick={()=>setCatFilter('ALL')}>All</button>
          {CATEGORIES.map(c=>(
            <button key={c} className={`${styles.cat_btn} ${catFilter===c?styles.active:''}`} onClick={()=>setCatFilter(c)}>
              {CATEGORY_EMOJI[c]} {c.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner />
      : filtered.length===0 ? <Empty icon="🍽" text="No menu items found" />
      : (
        <div className={styles.grid}>
          {filtered.map(item=>(
            <div key={item.id} className={styles.item_card}>
              <div className={styles.item_thumb}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} className={styles.item_img}
                      onError={e=>{e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} />
                  : null}
                <div className={styles.item_emoji} style={{display:item.imageUrl?'none':'flex'}}>
                  {CATEGORY_EMOJI[item.category]||'🍽'}
                </div>
                <div className={styles.item_cat_badge}>{item.category.replace('_',' ')}</div>
              </div>
              <div className={styles.item_body}>
                <div className={styles.item_top}>
                  <div className={styles.item_name}>{item.name}</div>
                  <Badge
                    bg={item.isAvailable?'rgba(45,198,83,.15)':'rgba(230,57,70,.12)'}
                    color={item.isAvailable?'#1a8c3b':'#e63946'}
                  >{item.isAvailable?'Available':'Unavailable'}</Badge>
                </div>
                {item.description && <div className={styles.item_desc}>{item.description}</div>}
                <div className={styles.item_footer}>
                  <div className={styles.item_price}>₹{item.price}</div>
                  <div className={styles.item_actions}>
                    <Button variant="ghost" size="sm" onClick={()=>openEdit(item)}>✏️ Edit</Button>
                    <Button variant="danger" size="sm" onClick={()=>del(item)}>🗑</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal==='add'?'Add Menu Item':'Edit Menu Item'} onClose={()=>setModal(null)}>
          <form onSubmit={save}>
            <Grid cols={2} gap={14}>
              <Input label="Item Name" placeholder="Butter Chicken" value={form.name} onChange={set('name')} required />
              <Input label="Price (₹)" type="number" step="0.01" min="0" placeholder="299.00" value={form.price} onChange={set('price')} required />
            </Grid>
            <Select label="Category" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c=><option key={c} value={c}>{c.replace('_',' ')}</option>)}
            </Select>
            <Textarea label="Description" placeholder="Describe the dish..." value={form.description} onChange={set('description')} />
            <Input label="Image URL (optional)" placeholder="https://..." value={form.imageUrl} onChange={set('imageUrl')} />
            <Checkbox label="Available on menu" checked={form.isAvailable} onChange={e=>setForm(p=>({...p,isAvailable:e.target.checked}))} />
            <Grid cols={2} gap={12} style={{marginTop:20}}>
              <Button type="button" variant="ghost" full onClick={()=>setModal(null)}>Cancel</Button>
              <Button type="submit" variant="primary" full loading={saving}>Save Item</Button>
            </Grid>
          </form>
        </Modal>
      )}
    </div>
  )
}
