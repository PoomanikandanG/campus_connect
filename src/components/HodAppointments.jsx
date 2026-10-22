import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { AppLink, navigate } from '../hooks/useAppPath'
import './HodAppointments.css'

function SignOut() {
  const { logout } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return <><button className="search-button" disabled={busy} onClick={async () => {
    setBusy(true)
    try { await logout(); navigate('/login', true) } catch { setError('Sign-out could not be completed. Please try again.'); setBusy(false) }
  }}>{busy ? 'Signing out?' : 'Logout'}</button>{error && <p role="alert">{error}</p>}</>
}
export function HodIntroduction() {
  return <section className="container appointments-page"><p className="section-kicker">HOD APPOINTMENTS</p>
    <h1>Meet Your HOD, Without the Wait.</h1>
    <p>Request appointments with your Head of Department and manage meeting requests in one place.</p>
    <div className="appointments-roles"><article><h2>Student</h2><p>Request appointments and track their status.</p></article>
    <article><h2>HOD</h2><p>Review and manage student meeting requests.</p></article></div>
    <p>Appointment booking is coming soon. This phase provides account sign-in only.</p>
    <AppLink className="search-button" href="/login">Sign In to Continue</AppLink>
  </section>
}
function ConfigurationRequired() {
  return <div role="status"><h2>Configuration required</h2><p>Sign-in is unavailable until CampusConnect is connected to Supabase. Please contact the site administrator.</p></div>
}
export function AccountPage({ path }) {
  const auth = useAuth()
  useEffect(() => {
    if (path === '/login' && auth.status === 'authorized') navigate(`/${auth.account.role}`, true)
  }, [path, auth.status, auth.account])
  return <section className="container appointments-page">
    <AppLink href="/hod-appointments">Back to HOD Appointments</AppLink>
    {auth.status === 'unconfigured' ? <ConfigurationRequired/> : auth.status === 'loading' ? <p role="status">Checking your account?</p> :
      auth.status === 'error' ? <><h1>Unable to verify access</h1><p role="alert">Your account could not be verified. Refresh to retry.</p><SignOut/></> :
      auth.status === 'denied' || (auth.status === 'authorized' && path !== '/login' && path !== `/${auth.account.role}`) ?
        <><h1>Access Denied</h1><p>Your account is not approved for this page. Contact your administrator.</p><SignOut/></> :
      auth.status === 'authorized' ? <><h1>Welcome to your {auth.account.role === 'hod' ? 'HOD' : 'student'} dashboard</h1>
        <p>{auth.user.email}</p><p>Role: {auth.account.role === 'hod' ? 'HOD' : 'Student'}</p>
        {auth.account.role === 'hod' && auth.account.department && <p>Department: {auth.account.department}</p>}
        <h2>{auth.account.role === 'hod' ? 'Appointment Management' : 'HOD Appointments'} ? Coming Soon</h2>
        <p>Appointment requests are not available yet.</p><SignOut/></> :
      path === '/login' ? <LoginForm/> : <><h1>Sign in required</h1><AppLink className="search-button" href="/login">Sign In to Continue</AppLink></>}
  </section>
}
function LoginForm() {
  const { client } = useAuth()
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = sentTo ? await client.auth.verifyOtp({ email: sentTo, token, type: 'email' }) :
        await client.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false } })
      if (result.error) throw result.error
      if (!sentTo) setSentTo(email.trim().toLowerCase())
      // Verified sessions are handled by AuthProvider and checked against backend permissions.
    } catch {
      setError(sentTo ? 'The code is invalid or expired, or verification failed. Try again or request a new code.' : 'Unable to send a code. Use your approved email, wait before retrying, or contact your administrator.')
    } finally { setBusy(false) }
  }
  return <><p className="section-kicker">CAMPUSCONNECT</p><h1>Sign in</h1><p>Use your administrator-approved email. New accounts cannot register here.</p>
    <form className="appointments-form" onSubmit={submit} aria-busy={busy}>
      {sentTo ? <><p role="status">If your account is eligible, a verification code has been sent to {sentTo}.</p>
        <label htmlFor="login-otp">Six-digit verification code</label><input id="login-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={token} onChange={e => setToken(e.target.value.replace(/\D/g, ''))} disabled={busy}/></> :
        <><label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy}/></>}
      {error && <p role="alert">{error}</p>}
      <button className="search-button" disabled={busy}>{busy ? 'Please wait?' : sentTo ? 'Verify and continue' : 'Send verification code'}</button>
      {sentTo && <button type="button" disabled={busy} onClick={() => { setSentTo(''); setToken(''); setError('') }}>Use another email or request a new code</button>}
    </form></>
}
