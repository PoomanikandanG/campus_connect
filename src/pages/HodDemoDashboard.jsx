import { useState } from 'react'
import { hodDemo, appointmentStatuses } from '../data/hodDemo'
import { useAppointmentDemo } from '../components/appointments/AppointmentDemoContext'
import DemoModeNotice from '../components/appointments/DemoModeNotice'
import AppointmentCard from '../components/appointments/AppointmentCard'
import { campusToday, nextAppointmentDate, configuredSlots, formatTime, slotInstant, upcomingRequests } from '../utils/appointmentUtils'
export default function HodDemoDashboard() {
  const { state, dispatch, hodId, setHodId } = useAppointmentDemo()
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [date, setDate] = useState(() => nextAppointmentDate(state, hodId))
  const [confirmation, setConfirmation] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const hod = hodDemo.find(person => person.id === hodId)
  const mine = state.requests.filter(request => request.hodId === hodId)
  const filtered = mine.filter(request => (!statusFilter || request.status === statusFilter) && (!dateFilter || request.date === dateFilter))
  function toggle(time, blocked) {
    const result = dispatch({ type: blocked ? 'unblock' : 'block', hodId, date, time, actor: { role: 'hod', id: hodId } })
    setError(result.error || ''); setMessage(result.error ? '' : `Slot ${formatTime(time)} ${blocked ? 're-enabled' : 'marked unavailable'}.`); setConfirmation(null)
  }
  return <section className="container appointment-page"><DemoModeNotice mode="HOD"/>
    <header className="appointment-page-heading"><div><p className="section-kicker">A LITTLE ORGANIZATION. BETTER CONVERSATIONS.</p><h1>Your meeting desk.</h1><p>Review requests and manage fictional appointment hours.</p></div></header>
    <div className="demo-identity"><label htmlFor="demo-hod">Demonstrating HOD</label><select id="demo-hod" value={hodId} onChange={event => { setHodId(event.target.value); setConfirmation(null); setError(''); setMessage('') }}>{hodDemo.map(person => <option key={person.id} value={person.id}>{person.department} | {person.name}</option>)}</select><p>{hod.designation} | {hod.office} | {hod.duration}-minute appointments</p><p>{hod.description}</p></div>
    <dl className="appointment-overview">{[['Pending requests', mine.filter(request => request.status === 'Pending').length], ['Approved upcoming', upcomingRequests(mine).length], ['Declined requests', mine.filter(request => request.status === 'Declined').length], ['Total requests', mine.length]].map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
    <section className="appointment-list-section" aria-labelledby="hod-requests-heading"><h2 id="hod-requests-heading">Appointment requests</h2><div className="appointment-filters"><div><label htmlFor="request-status">Filter by status</label><select id="request-status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">All statuses</option>{appointmentStatuses.map(status => <option key={status}>{status}</option>)}</select></div><div><label htmlFor="request-date">Filter by appointment date</label><input id="request-date" type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)}/></div>{(statusFilter || dateFilter) && <button type="button" onClick={() => { setStatusFilter(''); setDateFilter('') }}>Clear request filters</button>}</div>
      {filtered.length ? <div className="appointment-request-list">{[...filtered].reverse().map(request => <AppointmentCard key={request.id} request={request} mode="hod" actorId={hodId}/>)}</div> : <p className="appointment-empty">{mine.length ? 'No requests match these filters.' : 'No requests assigned to this fictional HOD. Switch to Demo Student and submit one.'}</p>}
    </section>
    <section className="appointment-list-section" aria-labelledby="slot-management-heading"><h2 id="slot-management-heading">Manage appointment slots</h2><p>Monday-Saturday: 10:00 AM-12:00 PM and 2:00 PM-4:00 PM IST. Sundays and the midday gap have no demo slots.</p>
      <label htmlFor="manage-date">Slot management date</label><input id="manage-date" type="date" value={date} min={campusToday()} onChange={event => { setDate(event.target.value); setConfirmation(null) }}/>
      {error && <p className="appointment-message error" role="alert">{error}</p>}{message && <p className="appointment-message success" role="status">{message}</p>}
      <div className="manage-slots">{configuredSlots(hodId, date).map(time => {
        const blocked = state.blockedSlots.some(slot => slot.hodId === hodId && slot.date === date && slot.time === time)
        const approved = state.requests.some(request => request.hodId === hodId && request.date === date && request.time === time && request.status === 'Approved')
        const past = slotInstant(date, time) <= Date.now()
        return <div key={time}><strong>{formatTime(time)}</strong><span>{past ? 'Past' : approved ? 'Approved booking' : blocked ? 'Unavailable' : 'Available'}</span><button type="button" disabled={approved || past} onClick={() => blocked ? toggle(time, true) : setConfirmation(time)} aria-label={`${blocked ? 'Re-enable' : 'Block'} ${formatTime(time)}`}>{blocked ? 'Re-enable' : 'Mark unavailable'}</button></div>
      })}</div>
      {!configuredSlots(hodId, date).length && <p className="appointment-empty">No configured appointment hours for this date. Choose Monday-Saturday.</p>}
      {confirmation && <div className="appointment-confirm" role="group" aria-label="Confirm slot block"><p>Mark {formatTime(confirmation)} unavailable on {date}? Pending requests can still be reviewed but cannot be approved for a blocked slot.</p><button type="button" onClick={() => toggle(confirmation, false)}>Confirm block</button><button type="button" onClick={() => setConfirmation(null)}>Keep slot available</button></div>}
    </section>
  </section>
}
