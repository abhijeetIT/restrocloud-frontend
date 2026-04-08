import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi, otpApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Grid } from '../components/UI'
import styles from './AuthPage.module.css'

/* ── OTP 4-box input ── */
function OtpBoxes({ value, onChange, disabled }) {
  const inputs = useRef([])
  const digits = (value || '').split('').concat(['','','','']).slice(0,4)

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits]; next[i] = ''
      onChange(next.join(''))
      if (i > 0) inputs.current[i-1]?.focus()
    }
  }
  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g,'').slice(-1)
    const next = [...digits]; next[i] = v
    onChange(next.join(''))
    if (v && i < 3) inputs.current[i+1]?.focus()
  }
  const handlePaste = e => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,4)
    onChange(pasted.padEnd(4,'').slice(0,4))
    inputs.current[Math.min(pasted.length, 3)]?.focus()
    e.preventDefault()
  }

  return (
    <div className={styles.otp_wrap}>
      {digits.map((d,i) => (
        <input key={i} ref={el => inputs.current[i]=el}
          className={`${styles.otp_input} ${d?styles.filled:''}`}
          type="text" inputMode="numeric" maxLength={1}
          value={d} disabled={disabled}
          onChange={e => handleChange(i,e)}
          onKeyDown={e => handleKey(i,e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  )
}

/* ── Countdown timer ── */
function Countdown({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    setLeft(seconds)
    const t = setInterval(() => setLeft(p => { if (p<=1){ clearInterval(t); onExpire(); return 0; } return p-1; }), 1000)
    return () => clearInterval(t)
  }, [seconds])
  const m = String(Math.floor(left/60)).padStart(2,'0')
  const s = String(left%60).padStart(2,'0')
  return <span className={styles.countdown_num}>{m}:{s}</span>
}

/* ══════════════════════════════════════════════════════ */
export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  // ── Login state ──
  const [loginForm, setLoginForm] = useState({ email:'', password:'' })
  const [loginLoading, setLoginLoading] = useState(false)

  // ── Forgot password flow: 'email' | 'otp' | 'password' | 'done' ──
  const [mode, setMode] = useState('login') // 'login' | 'forgot'
  const [forgotStep, setForgotStep] = useState('email')
  const [forgotEmail, setForgotEmail]     = useState('')
  const [forgotOtp, setForgotOtp]         = useState('')
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false)
  const [newPassword, setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpLoading, setOtpLoading]       = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [changeLoading, setChangeLoading] = useState(false)
  const [canResend, setCanResend]         = useState(false)
  const [countdownKey, setCountdownKey]   = useState(0)
  const [showOtpTimer, setShowOtpTimer]   = useState(false)

  const setL = k => e => setLoginForm(p => ({...p, [k]: e.target.value}))

  /* ── Login submit ── */
  const handleLogin = async e => {
    e.preventDefault(); setLoginLoading(true)
    try {
      const res = await authApi.login(loginForm)
      login(res.data.token, { email: res.data.email })
      toast.success('Welcome back! 🎉')
      navigate('/dashboard')
    } catch(err) { toast.error(err.message) }
    finally { setLoginLoading(false) }
  }

  /* ── Send OTP for forgot password ── */
  const sendForgotOtp = async e => {
    e?.preventDefault()
    if (!forgotEmail) { toast.error('Enter your email first'); return }
    setOtpLoading(true)
    try {
      await otpApi.send({ email: forgotEmail, purpose: 'FORGOT_PASSWORD' })
      toast.success('OTP sent to your email! 📧')
      setForgotStep('otp')
      setCanResend(false)
      setShowOtpTimer(true)
      setCountdownKey(k => k+1)
    } catch(err) { toast.error(err.message) }
    finally { setOtpLoading(false) }
  }

  /* ── Verify OTP ── */
  const verifyForgotOtp = async () => {
    if (forgotOtp.length < 4) { toast.error('Enter 4-digit OTP'); return }
    setVerifyLoading(true)
    try {
      const res = await otpApi.verify({ email: forgotEmail, otp: forgotOtp })
      if (res.success) {
        toast.success('OTP verified! ✅')
        setForgotOtpVerified(true)
        setForgotStep('password')
      } else {
        toast.error('Wrong OTP. Please try again.')
        setForgotOtp('')
      }
    } catch(err) { toast.error(err.message) }
    finally { setVerifyLoading(false) }
  }

  /* ── Change password ── */
  const handleChangePassword = async e => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match!'); return }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setChangeLoading(true)
    try {
      await otpApi.changePassword({ email: forgotEmail, password: newPassword })
      toast.success('Password changed! Please login. 🎉')
      setForgotStep('done')
    } catch(err) { toast.error(err.message) }
    finally { setChangeLoading(false) }
  }

  /* ── Reset forgot flow ── */
  const resetForgot = () => {
    setMode('login'); setForgotStep('email'); setForgotEmail('')
    setForgotOtp(''); setForgotOtpVerified(false)
    setNewPassword(''); setConfirmPassword('')
    setCanResend(false); setShowOtpTimer(false)
  }

  const pwStrength = p => {
    if (!p) return 0
    let s = 0
    if (p.length >= 6) s++
    if (p.length >= 10) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }
  const strength = pwStrength(newPassword)
  const strengthColor = ['#e2e6f0','#e63946','#f4a261','#f9c74f','#2dc653','#1a8c3b'][strength]
  const strengthWidth = `${(strength/5)*100}%`

  return (
    <div className={styles.wrap}>
      <div className={styles.blob + ' ' + styles.blob1}/>
      <div className={styles.blob + ' ' + styles.blob2}/>
      <div className={styles.blob + ' ' + styles.blob3}/>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo_wrap}>
          <div className={styles.logo_icon}>🍽</div>
          <div>
            <div className={styles.logo}>RestroCloud</div>
          </div>
        </div>

        {/* ══ LOGIN FORM ══ */}
        {mode === 'login' && (
          <>
            <div className={styles.sub}>Sign in to manage your restaurant</div>
            <form onSubmit={handleLogin} className={styles.form}>
              <Input label="Email Address" type="email" placeholder="you@restaurant.com"
                value={loginForm.email} onChange={setL('email')} required />
              <Input label="Password" type="password" placeholder="••••••••"
                value={loginForm.password} onChange={setL('password')} required />
              <div style={{textAlign:'right',marginTop:-10,marginBottom:14}}>
                <span className={styles.link} style={{fontSize:12}} onClick={()=>setMode('forgot')}>
                  Forgot password?
                </span>
              </div>
              <Button type="submit" variant="primary" full loading={loginLoading} size="lg">
                Sign In →
              </Button>
            </form>
            <div className={styles.switch}>
              No account?{' '}
              <Link to="/register" className={styles.link}>Register Restaurant</Link>
            </div>
          </>
        )}

        {/* ══ FORGOT PASSWORD FLOW ══ */}
        {mode === 'forgot' && (
          <>
            <div className={styles.sub}>
              {forgotStep==='email'    && 'Reset your password — enter your registered email'}
              {forgotStep==='otp'      && 'Enter the 4-digit OTP sent to your email'}
              {forgotStep==='password' && 'Create a new password for your account'}
              {forgotStep==='done'     && 'Password changed successfully!'}
            </div>

            {/* Step indicator */}
            <div className={styles.steps}>
              {[['email','Email'],['otp','OTP'],['password','New Pass']].map(([s,l],i,arr)=>{
                const stepIdx   = ['email','otp','password'].indexOf(forgotStep)
                const thisIdx   = i
                const isDone    = stepIdx > thisIdx
                const isCurrent = stepIdx === thisIdx
                return (
                  <React.Fragment key={s}>
                    <div className={styles.step_item}>
                      <div className={`${styles.step_num} ${isDone?styles.done:''} ${isCurrent?styles.current:''}`}>
                        {isDone ? '✓' : i+1}
                      </div>
                      <span className={`${styles.step_text} ${isDone?styles.done:''} ${isCurrent?styles.current:''}`}>{l}</span>
                    </div>
                    {i < arr.length-1 && <div className={`${styles.step_line} ${isDone?styles.done:''}`}/>}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Step 1 — Email */}
            {forgotStep==='email' && (
              <div className={styles.section_fade}>
                <div className={styles.info_box}>
                  ℹ️ We'll send a 4-digit OTP to your registered email address.
                </div>
                <form onSubmit={sendForgotOtp} className={styles.form}>
                  <Input label="Registered Email" type="email" placeholder="you@restaurant.com"
                    value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} required />
                  <Button type="submit" variant="primary" full loading={otpLoading} size="lg">
                    Send OTP →
                  </Button>
                </form>
              </div>
            )}

            {/* Step 2 — OTP */}
            {forgotStep==='otp' && (
              <div className={styles.section_fade}>
                <div className={styles.info_box}>
                  📧 OTP sent to <strong>{forgotEmail}</strong>. Valid for 2 minutes.
                </div>
                <OtpBoxes value={forgotOtp} onChange={setForgotOtp} disabled={verifyLoading} />
                <div className={styles.countdown}>
                  {canResend ? (
                    <button className={styles.resend_btn} onClick={sendForgotOtp} disabled={otpLoading}>
                      {otpLoading ? 'Sending...' : 'Resend OTP'}
                    </button>
                  ) : (
                    <>Resend in{' '}
                      <Countdown key={countdownKey} seconds={120} onExpire={()=>setCanResend(true)} />
                    </>
                  )}
                </div>
                <Button variant="primary" full loading={verifyLoading}
                  disabled={forgotOtp.length < 4}
                  onClick={verifyForgotOtp} size="lg">
                  Verify OTP ✓
                </Button>
              </div>
            )}

            {/* Step 3 — New password */}
            {forgotStep==='password' && (
              <div className={styles.section_fade}>
                <form onSubmit={handleChangePassword} className={styles.form}>
                  <Input label="New Password" type="password" placeholder="Min 6 characters"
                    value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
                  {/* Strength bar */}
                  {newPassword && (
                    <div className={styles.strength_bar}>
                      <div className={styles.strength_fill} style={{width:strengthWidth,background:strengthColor}}/>
                    </div>
                  )}
                  <Input label="Confirm Password" type="password" placeholder="Repeat password"
                    value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
                  <Button type="submit" variant="primary" full loading={changeLoading}
                    disabled={!newPassword || newPassword!==confirmPassword} size="lg">
                    Change Password →
                  </Button>
                </form>
              </div>
            )}

            {/* Step done */}
            {forgotStep==='done' && (
              <div className={styles.section_fade} style={{textAlign:'center'}}>
                <div className={styles.success_tick}>✅</div>
                <p style={{color:'var(--muted)',fontSize:13,marginBottom:20}}>
                  Your password has been changed. Please sign in with your new password.
                </p>
                <Button variant="primary" full onClick={resetForgot} size="lg">
                  Go to Sign In →
                </Button>
              </div>
            )}

            {forgotStep !== 'done' && (
              <div className={styles.switch}>
                <span className={styles.link} onClick={resetForgot}>← Back to Sign In</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
