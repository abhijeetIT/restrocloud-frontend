import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

const NAV = [
  { to: '/dashboard', label: 'Dashboard',  icon: '⊞',  section: 'OVERVIEW' },
  { to: '/menu',      label: 'Menu Items', icon: '🍽',  section: 'MANAGE' },
  { to: '/tables',    label: 'Tables',     icon: '🪑',  section: 'MANAGE' },
  { to: '/orders',    label: 'Orders',     icon: '📋',  section: 'MANAGE' },
  { to: '/payments',  label: 'Payments',   icon: '💳',  section: 'MANAGE' },
  { to: '/settings',  label: 'Settings',   icon: '⚙️',  section: 'ACCOUNT' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const sections = [...new Set(NAV.map(n => n.section))]

  return (
    <div className={`${styles.wrap} ${collapsed ? styles.collapsed : ''}`}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logo_icon}>🍽</span>
          {!collapsed && (
            <div>
              <div className={styles.logo_text}>RestroCloud</div>
              <div className={styles.logo_sub}>Management System</div>
            </div>
          )}
          <button className={styles.collapse_btn} onClick={() => setCollapsed(p => !p)} title="Toggle sidebar">
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className={styles.nav}>
          {sections.map(sec => (
            <div key={sec}>
              {!collapsed && <div className={styles.nav_section}>{sec}</div>}
              {NAV.filter(n => n.section === sec).map(n => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    `${styles.nav_item} ${isActive ? styles.nav_active : ''}`
                  }
                  title={collapsed ? n.label : undefined}
                >
                  <span className={styles.nav_icon}>{n.icon}</span>
                  {!collapsed && <span>{n.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebar_bottom}>
          {!collapsed && (
            <div className={styles.user_card}>
              <div className={styles.avatar}>
                {(user?.email || 'R')[0].toUpperCase()}
              </div>
              <div className={styles.user_info}>
                <div className={styles.user_name}>My Restaurant</div>
                <div className={styles.user_email}>{user?.email}</div>
              </div>
            </div>
          )}
          <button className={styles.logout_btn} onClick={handleLogout} title="Logout">
            <span>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbar_left}>
            <span className={styles.api_dot} title="API: localhost:8081">● localhost:8081</span>
          </div>
          <div className={styles.topbar_right}>
            <div className={styles.topbar_user}>
              <div className={styles.topbar_avatar}>
                {(user?.email || 'R')[0].toUpperCase()}
              </div>
              <span className={styles.topbar_email}>{user?.email}</span>
            </div>
          </div>
        </div>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
