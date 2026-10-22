import { FlaskConical, ArrowLeft, ArrowLeftRight } from 'lucide-react'
import { AppLink } from '../../hooks/useAppPath'
import { useAppointmentDemo } from './AppointmentDemoContext'
import { useState } from 'react'
export default function DemoModeNotice({ mode }) {
  const { warning, reset } = useAppointmentDemo()
  const [confirm, setConfirm] = useState(false)
  return <>
    <div className="demo-toolbar"><AppLink href="/#faculty"><ArrowLeft size={16}/> Faculty Directory</AppLink>
      <div>{mode && <AppLink href={`/hod-appointments/${mode === 'Student' ? 'hod' : 'student'}`}><ArrowLeftRight size={16}/> Switch to Demo {mode === 'Student' ? 'HOD' : 'Student'}</AppLink>}
      {mode && <AppLink href="/hod-appointments">Exit Demo</AppLink>}</div></div>
    <aside className="appointment-demo-notice" aria-label="Demo mode limitations"><FlaskConical size={23} aria-hidden="true"/><div>
      <strong>{mode ? `DEMO ${mode.toUpperCase()} MODE` : 'FICTIONAL PROTOTYPE | DEMO MODES'}</strong>
      <p>Role switching is a simulation, not authentication. Anyone can switch roles. Requests stay in this browser; they are not shared across devices. Use fictional details only; never real credentials, college IDs, or private student information.</p>
    </div></aside>
    {warning && <p className="appointment-message warning" role="alert">{warning}</p>}
    <div className="demo-reset">{confirm ? <><span>Clear all local appointment requests and blocked slots?</span><button type="button" onClick={() => { reset(); setConfirm(false) }}>Confirm reset</button><button type="button" onClick={() => setConfirm(false)}>Keep demo data</button></> : <button type="button" onClick={() => setConfirm(true)}>Reset demo data</button>}</div>
  </>
}
