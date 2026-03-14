import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { restaurantApi, analyticsApi, paymentApi } from '../api'
import { StatCard, Card, CardTitle, Spinner, Badge, Grid } from '../components/UI'
import { PAYMENT_STATUS_COLOR } from '../constants'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const [restaurant, setRestaurant] = useState(null)
  const [summary, setSummary]       = useState(null)
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      restaurantApi.get(),
      analyticsApi.summary(),
      paymentApi.getAll(0, 6),
    ]).then(([rest, sum, pays]) => {
      setRestaurant(rest.data)
      setSummary(sum.data)
      setRecentPayments(pays.data?.content || [])
    }).catch(e => toast.error(e.message))
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="animate-fadeInUp">
      {/* Restaurant Banner */}
      {restaurant && (
        <div className={styles.banner}>
          <div className={styles.banner_left}>
            <div className={styles.rest_avatar}>{(restaurant.name||'R')[0]}</div>
            <div>
              <div className={styles.rest_name}>{restaurant.name}</div>
              <div className={styles.rest_meta}>
                <span>📍 {restaurant.address}</span>
                <span>📞 {restaurant.phoneNumber}</span>
                <span>✉️ {restaurant.email}</span>
              </div>
            </div>
          </div>
          <Badge
            bg={restaurant.isActive ? 'rgba(45,198,83,.15)' : 'rgba(230,57,70,.12)'}
            color={restaurant.isActive ? '#1a8c3b' : '#e63946'}
          >
            {restaurant.isActive ? '● Active' : '● Inactive'}
          </Badge>
        </div>
      )}

      {/* Today Stats */}
      <div className={styles.section_label}>📅 Today's Overview</div>
      <div className={`${styles.stats_row} stagger`}>
        <div className="animate-fadeInUp">
          <StatCard label="Orders Today" value={summary?.totalOrdersToday ?? '—'} icon="📋" accent="primary" />
        </div>
        <div className="animate-fadeInUp">
          <StatCard label="Revenue Today" value={`₹${(summary?.revenueToday||0).toFixed(0)}`} icon="💰" accent="green" />
        </div>
        <div className="animate-fadeInUp">
          <StatCard label="Cancelled Today" value={summary?.cancelledOrdersToday ?? '—'} icon="❌" accent="orange" />
        </div>
        <div className="animate-fadeInUp">
          <StatCard label="Monthly Revenue" value={`₹${(summary?.revenueThisMonth||0).toFixed(0)}`} icon="📈" accent="secondary" />
        </div>
      </div>

      {/* Month stats + highlights */}
      <div className={styles.section_label}>📊 This Month</div>
      <Grid cols={2} gap={20} style={{ marginBottom: 28 }}>
        <Card>
          <CardTitle icon="🏆">Top Performers</CardTitle>
          <div className={styles.highlight_row}>
            <span className={styles.highlight_label}>🍽 Most Ordered Item</span>
            <span className={styles.highlight_val}>{summary?.mostOrderedItem || '—'}</span>
          </div>
          <div className={styles.highlight_row}>
            <span className={styles.highlight_label}>🪑 Busiest Table</span>
            <span className={styles.highlight_val}>Table #{summary?.busiestTable || '—'}</span>
          </div>
          <div className={styles.highlight_row}>
            <span className={styles.highlight_label}>📦 Orders This Month</span>
            <span className={styles.highlight_val}>{summary?.totalOrdersThisMonth ?? '—'}</span>
          </div>
        </Card>

        <Card>
          <CardTitle icon="💳">Recent Payments</CardTitle>
          {recentPayments.length === 0
            ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>No payments yet</div>
            : recentPayments.map(p => {
                const c = PAYMENT_STATUS_COLOR[p.paymentStatus] || {}
                return (
                  <div key={p.paymentId} className={styles.pay_row}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Order #{p.orderId}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {p.paymentMethod} · {p.paymentTime ? new Date(p.paymentTime).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily:'Playfair Display,serif', fontWeight: 700, color:'var(--secondary)' }}>₹{p.amount?.toFixed(2)}</span>
                      <Badge bg={c.bg} color={c.color}>{p.paymentStatus}</Badge>
                    </div>
                  </div>
                )
              })
          }
        </Card>
      </Grid>
    </div>
  )
}
