import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi, otpApi } from '../api'
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
    inputs.current[Math.min(pasted.length,3)]?.focus()
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

/* ── Countdown ── */
function Countdown({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    setLeft(seconds)
    const t = setInterval(() => setLeft(p => { if(p<=1){clearInterval(t);onExpire();return 0;} return p-1; }),1000)
    return () => clearInterval(t)
  }, [seconds])
  const m = String(Math.floor(left/60)).padStart(2,'0')
  const s = String(left%60).padStart(2,'0')
  return <span className={styles.countdown_num}>{m}:{s}</span>
}

/* ══════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const navigate = useNavigate()

  // Steps: 'details' → 'otp' → 'done'
  const [step, setStep] = useState('details')

  // Step 1 — Restaurant details
  const [form, setForm] = useState({ name:'', email:'', password:'', address:'', phoneNumber:'' })
  const [detailsValid, setDetailsValid] = useState(false)

  // Step 2 — OTP
  const [otp, setOtp]           = useState('')
  const [otpSent, setOtpSent]   = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [countdownKey, setCountdownKey] = useState(0)

  // Loading states
  const [sendLoading, setSendLoading]     = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)

  const set = k => e => setForm(p => ({...p, [k]: e.target.value}))

  // Validate form fields
  useEffect(() => {
    const { name, email, password, address, phoneNumber } = form
    setDetailsValid(
      name.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      password.length >= 6 &&
      address.trim().length >= 3 &&
      phoneNumber.trim().length >= 6
    )
  }, [form])

  /* ── Send OTP ── */
  const sendOtp = async () => {
    setSendLoading(true)
    try {
      await otpApi.send({ email: form.email, purpose: 'SIGNUP' })
      toast.success(`OTP sent to ${form.email} 📧`)
      setOtpSent(true)
      setStep('otp')
      setCanResend(false)
      setCountdownKey(k => k+1)
    } catch(err) { toast.error(err.message) }
    finally { setSendLoading(false) }
  }

  /* ── Verify OTP then Register ── */
  const verifyAndRegister = async () => {
    if (otp.length < 4) { toast.error('Enter the 4-digit OTP'); return }
    setVerifyLoading(true)
    try {
      // 1. Verify OTP
      const verifyRes = await otpApi.verify({ email: form.email, otp })
      if (!verifyRes.success) {
        toast.error('Wrong OTP. Please try again.')
        setOtp('')
        setVerifyLoading(false)
        return
      }
      // 2. Register
      toast.success('OTP verified! Creating your account... 🎉')
      setRegisterLoading(true)
      await authApi.register(form)
      setStep('done')
    } catch(err) { toast.error(err.message) }
    finally { setVerifyLoading(false); setRegisterLoading(false) }
  }

  const pwStrength = p => {
    if (!p) return 0
    let s = 0
    if (p.length>=6) s++; if (p.length>=10) s++
    if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }
  const strength = pwStrength(form.password)
  const strengthColor = ['#e2e6f0','#e63946','#f4a261','#f9c74f','#2dc653','#1a8c3b'][strength]

  return (
    <div className={styles.wrap}>
      <div className={styles.blob + ' ' + styles.blob1}/>
      <div className={styles.blob + ' ' + styles.blob2}/>
      <div className={styles.blob + ' ' + styles.blob3}/>

      <div className={`${styles.card} ${styles.card_wide}`}>
        {/* Logo */}
        <div className={styles.logo_wrap}>
          <div className={styles.logo_icon}>🍽</div>
          <div>
            <div className={styles.logo}>RestroCloud
              <span className={styles.logo_tag}>New</span>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className={styles.steps}>
          {[['details','Details'],['otp','Verify Email'],['done','Done']].map(([s,l],i,arr)=>{
            const stepIdx  = ['details','otp','done'].indexOf(step)
            const isDone   = stepIdx > i
            const isCurrent= stepIdx === i
            return (
              <React.Fragment key={s}>
                <div className={styles.step_item}>
                  <div className={`${styles.step_num} ${isDone?styles.done:''} ${isCurrent?styles.current:''}`}>
                    {isDone?'✓':i+1}
                  </div>
                  <span className={`${styles.step_text} ${isDone?styles.done:''} ${isCurrent?styles.current:''}`}>{l}</span>
                </div>
                {i < arr.length-1 && <div className={`${styles.step_line} ${isDone?styles.done:''}`}/>}
              </React.Fragment>
            )
          })}
        </div>

        {/* ══ STEP 1 — Details ══ */}
        {step==='details' && (
          <div className={styles.section_fade}>
            <div className={styles.sub}>Fill in your restaurant details to get started</div>
            <Grid cols={2} gap={14}>
              <Input label="Restaurant Name" placeholder="The Grand Bistro" value={form.name} onChange={set('name')} required />
              <Input label="Phone Number" placeholder="+91 9876543210" value={form.phoneNumber} onChange={set('phoneNumber')} required />
            </Grid>
            <Input label="Email Address" type="email" placeholder="contact@restaurant.com" value={form.email} onChange={set('email')} required />
            <Input label="Password" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />
            {/* Password strength */}
            {form.password && (
              <div className={styles.strength_bar}>
                <div className={styles.strength_fill} style={{width:`${(strength/5)*100}%`, background:strengthColor}}/>
              </div>
            )}
            <Input label="Address" placeholder="123 Food Street, Mumbai" value={form.address} onChange={set('address')} required />

            {/* Send OTP — disabled until form valid */}
            <div style={{marginTop:4}}>
              <Button variant="primary" full size="lg" loading={sendLoading}
                disabled={!detailsValid}
                onClick={sendOtp}>
                {detailsValid ? 'Send OTP to Verify Email →' : 'Fill all details to continue'}
              </Button>
            </div>
            {!detailsValid && (
              <p style={{fontSize:11,color:'var(--muted)',textAlign:'center',marginTop:8}}>
                Complete all fields correctly to enable the button
              </p>
            )}
          </div>
        )}

        {/* ══ STEP 2 — OTP ══ */}
        {step==='otp' && (
          <div className={styles.section_fade}>
            <div className={styles.sub}>Verify your email to create your account</div>
            <div className={styles.info_box}>
              📧 OTP sent to <strong>{form.email}</strong>. Check your inbox. Valid for 2 minutes.
            </div>

            <OtpBoxes value={otp} onChange={setOtp} disabled={verifyLoading || registerLoading} />

            <div className={styles.countdown}>
              {canResend ? (
                <button className={styles.resend_btn} onClick={sendOtp} disabled={sendLoading}>
                  {sendLoading ? 'Sending...' : '🔄 Resend OTP'}
                </button>
              ) : (
                <>Resend available in{' '}
                  <Countdown key={countdownKey} seconds={120} onExpire={()=>setCanResend(true)} />
                </>
              )}
            </div>

            <Button variant="primary" full size="lg"
              loading={verifyLoading || registerLoading}
              disabled={otp.length < 4}
              onClick={verifyAndRegister}>
              {otp.length < 4 ? 'Enter OTP to Create Account' : '✓ Verify & Create Account'}
            </Button>

            <div style={{marginTop:12,textAlign:'center'}}>
              <span className={styles.link} style={{fontSize:12}} onClick={()=>{ setStep('details'); setOtp(''); }}>
                ← Edit Details
              </span>
            </div>
          </div>
        )}

        {/* ══ STEP 3 — Done ══ */}
        {step==='done' && (
          <div className={styles.section_fade} style={{textAlign:'center'}}>
            <div className={styles.success_tick}>🎉</div>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:800,color:'var(--secondary)',marginBottom:8}}>
              Welcome to RestroCloud!
            </div>
            <p style={{color:'var(--muted)',fontSize:13,marginBottom:24,lineHeight:1.6}}>
              Your restaurant <strong style={{color:'var(--secondary)'}}>{form.name}</strong> has been registered successfully.
            </p>
            <Button variant="primary" full size="lg" onClick={()=>navigate('/login')}>
              Go to Sign In →
            </Button>
          </div>
        )}

        {step !== 'done' && (
          <div className={styles.switch}>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>Sign In</Link>
          </div>
        )}
      </div>
    </div>
  )
}
