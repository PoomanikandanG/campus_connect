import { useState } from 'react'
import { hodDemo } from '../../data/hodDemo'
import { campusToday, formatCreated, formatDate, formatTime, slotInstant } from '../../utils/appointmentUtils'
import { useAppointmentDemo } from './AppointmentDemoContext'
import SlotPicker from './SlotPicker'
export function AppointmentStatusBadge({ status }) {
  return <span className={`appointment-badge status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
}
export default function AppointmentCard({ request, mode, actorId }) {
  const { dispatch } = useAppointmentDemo()
  const [confirmation, setConfirmation] = useState(null)
  const [proposing, setProposing] = useState(false)
  const [date, setDate] = useState(campusToday())
  const [time, setTime] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const hod = hodDemo.find(person => person.id === request.hodId)
  const future = slotInstant(request.date, request.time) > Date.now()
  function run(type, extra = {}) {
    const result = dispatch({ type, id: request.id, actor: { role: mode, id: actorId }, ...extra })
    setError(result.error || '')
    setMessage(result.error ? '' : 'Request updated successfully.')
    setConfirmation(null)
    if (!result.error) setProposing(false)
  }
  return <article className="appointment-card" aria-label={`Appointment ${request.id}`}>
    <div className="request-heading"><div><p className="appointment-kicker">{mode === 'hod' ? request.studentName : hod.name}</p>
      <h3>{request.reason}</h3></div><AppointmentStatusBadge status={request.status}/></div>
    <dl className="appointment-details">
      <div><dt>{request.status === 'Approved' ? 'Confirmed appointment' : 'Requested appointment'}</dt><dd>{formatDate(request.date)} | {formatTime(request.time)} IST</dd></div>
      <div><dt>Student department</dt><dd>{request.department}</dd></div>
      <div><dt>HOD department</dt><dd>{hod.department}</dd></div>
      <div><dt>Demo student ID</dt><dd>{request.studentId}</dd></div>
      <div><dt>Created</dt><dd>{formatCreated(request.createdAt)} IST</dd></div>
      <div><dt>Appointment ID</dt><dd className="appointment-id">{request.id}</dd></div>
    </dl>
    {request.description && <p className="request-description">{request.description}</p>}
    {request.status === 'Pending' && <p className="appointment-hint">Awaiting Demo HOD review. This request is not confirmed.</p>}
    {request.status === 'Approved' && !future && <p className="appointment-hint">This approved appointment time has passed.</p>}
    {request.status === 'Reschedule Proposed' && <div className="proposal-summary"><strong>Proposed: {formatDate(request.proposal.date)} | {formatTime(request.proposal.time)} IST</strong><p>Waiting for student acceptance. The requested time has not been replaced or confirmed.</p></div>}
    {error && <p className="appointment-message error" role="alert">{error}</p>}
    {message && <p className="appointment-message success" role="status">{message}</p>}
    <div className="appointment-actions">
      {mode === 'hod' && request.status === 'Pending' && <><button type="button" className="appointment-primary" onClick={() => run('approve')}>Approve</button>
        <button type="button" onClick={() => setConfirmation('decline')}>Decline</button>
        <button type="button" onClick={() => { setProposing(!proposing); setError('') }}>{proposing ? 'Close proposal' : 'Propose another time'}</button></>}
      {((mode === 'student' && ['Pending', 'Approved'].includes(request.status)) || (mode === 'hod' && request.status === 'Approved')) && <button type="button" onClick={() => setConfirmation('cancel')}>Cancel appointment</button>}
      {mode === 'student' && request.status === 'Reschedule Proposed' && <><button type="button" className="appointment-primary" onClick={() => run('accept')}>Accept proposed time</button><button type="button" onClick={() => setConfirmation('reject-proposal')}>Decline proposed time</button></>}
    </div>
    {confirmation && <div className="appointment-confirm" role="group" aria-label="Confirm request action"><p>{confirmation === 'cancel' ? 'Cancel this appointment? An approved slot will become available again.' : 'Decline this request or proposal? This will close the request.'}</p><button type="button" onClick={() => run(confirmation)}>Confirm {confirmation === 'cancel' ? 'cancellation' : 'decline'}</button><button type="button" onClick={() => setConfirmation(null)}>Keep request</button></div>}
    {proposing && request.status === 'Pending' && <form className="proposal-form" onSubmit={event => { event.preventDefault(); if (!time) { setError('Choose a proposed time.'); return } run('propose', { date, time }) }}>
      <SlotPicker title="Proposed" hodId={request.hodId} date={date} time={time} onDate={setDate} onTime={setTime} excludeId={request.id}/>
      <button className="appointment-primary" type="submit">Send time proposal</button>
    </form>}
  </article>
}
