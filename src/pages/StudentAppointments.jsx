import { useState } from 'react'
import { CalendarDays, CheckCircle2 } from 'lucide-react'
import { demoStudents, hodDemo, reasonCategories } from '../data/hodDemo'
import { useAppointmentDemo } from '../components/appointments/AppointmentDemoContext'
import DemoModeNotice from '../components/appointments/DemoModeNotice'
import SlotPicker from '../components/appointments/SlotPicker'
import AppointmentCard from '../components/appointments/AppointmentCard'
import { nextAppointmentDate, formatDate, formatTime, upcomingRequests } from '../utils/appointmentUtils'
export default function StudentAppointments() {
  const { state, dispatch, studentId, setStudentId, hodId, setHodId } = useAppointmentDemo()
  const [department, setDepartment] = useState(demoStudents.find(student => student.id === studentId).department)
  const [filter, setFilter] = useState('')
  const [date, setDate] = useState(() => nextAppointmentDate(state, hodId))
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const mine = state.requests.filter(request => request.studentId === studentId)
  const upcoming = upcomingRequests(mine)
  const hod = hodDemo.find(person => person.id === hodId)
  function submit(event) {
    event.preventDefault()
    const id = `DEMO-${crypto.randomUUID()}`
    const result = dispatch({ type: 'request', id, studentId, department, hodId, date, time, reason, description })
    setError(result.error || '')
    if (!result.error) { setSuccess(`Request ${id} submitted. Status: Pending. This is not a confirmed appointment.`); setDescription(''); setTime(''); setReason('') }
    else setSuccess('')
  }
  return <section className="container appointment-page"><DemoModeNotice mode="Student"/>
    <header className="appointment-page-heading"><div><p className="section-kicker">A CONVERSATION CAN MAKE A DIFFERENCE</p><h1>Your appointment desk.</h1><p>Choose a fictional HOD and find a time to talk.</p></div><a href="#my-demo-requests">View my requests <CalendarDays size={17}/></a></header>
    <div className="demo-identity"><label htmlFor="demo-student">Demo student identity</label><select id="demo-student" value={studentId} onChange={event => { const student = demoStudents.find(item => item.id === event.target.value); setStudentId(student.id); setDepartment(student.department); setSuccess('') }}>{demoStudents.map(student => <option key={student.id} value={student.id}>{student.name} | {student.id}</option>)}</select><p>Switch identities to demonstrate multiple students. These are fictional display names and identifiers.</p></div>
    <section aria-labelledby="choose-hod"><div className="appointment-section-heading"><h2 id="choose-hod">1. Choose your HOD</h2><div><label htmlFor="hod-department">HOD department</label><select id="hod-department" value={filter} onChange={event => { const value = event.target.value; setFilter(value); if (value) setHodId(hodDemo.find(person => person.department === value).id); setTime('') }}><option value="">All departments</option>{hodDemo.map(person => <option key={person.id}>{person.department}</option>)}</select></div></div>
      <div className="hod-choice-grid">{hodDemo.filter(person => !filter || person.department === filter).map(person => <button type="button" key={person.id} className={`hod-choice ${hodId === person.id ? 'selected' : ''}`} aria-pressed={hodId === person.id} onClick={() => { setHodId(person.id); setTime('') }}><span className="hod-department-label">{person.department}</span><strong>{person.name}</strong><span>{person.designation}</span><small>{person.duration}-minute appointments</small><span className="hod-selection-label">{hodId === person.id ? 'Selected' : 'Select HOD'}</span></button>)}</div>
    </section>
    <form className="appointment-booking" onSubmit={submit}><div><h2>2. Choose a time</h2><p>{hod.name} | {hod.department}</p><SlotPicker hodId={hodId} date={date} time={time} onDate={setDate} onTime={setTime}/></div>
      <div className="appointment-reason"><h2>3. Tell us about your meeting</h2><label htmlFor="student-department">Student department</label><select id="student-department" value={department} onChange={event => setDepartment(event.target.value)} required>{hodDemo.map(person => <option key={person.id}>{person.department}</option>)}</select>
        <label htmlFor="meeting-reason">Reason category</label><select id="meeting-reason" value={reason} onChange={event => setReason(event.target.value)} required><option value="">Choose a reason</option>{reasonCategories.map(value => <option key={value}>{value}</option>)}</select>
        <label htmlFor="meeting-description">Short description <span>(optional)</span></label><textarea id="meeting-description" value={description} onChange={event => setDescription(event.target.value)} maxLength={300} rows={3} placeholder="Use fictional details only."/><small>{description.length}/300 characters</small>
        {error && <p className="appointment-message error" role="alert">{error}</p>}
        <button className="appointment-primary" type="submit">Submit demo request</button><p className="appointment-hint">A request becomes confirmed only after approval or successful acceptance of a proposal.</p>
      </div></form>
    {success && <p className="appointment-message success" role="status"><CheckCircle2 size={20} aria-hidden="true"/>{success}</p>}
    <section className="appointment-list-section" aria-labelledby="upcoming-heading"><h2 id="upcoming-heading">Upcoming Appointments</h2><p>Approved future appointments only. All times are in Asia/Kolkata.</p>{upcoming.length ? <ul className="upcoming-list">{upcoming.map(request => <li key={request.id}><a href={`#request-${request.id}`}>{hodDemo.find(person => person.id === request.hodId).department} | {formatDate(request.date)} | {formatTime(request.time)}</a><span>Approved</span></li>)}</ul> : <p className="appointment-empty">No approved upcoming appointments yet. Submit a request and review it in Demo HOD mode.</p>}</section>
    <section className="appointment-list-section" id="my-demo-requests" aria-labelledby="requests-heading"><h2 id="requests-heading">My Requests <span>({mine.length})</span></h2>{mine.length ? <div className="appointment-request-list">{[...mine].reverse().map(request => <div key={request.id} id={`request-${request.id}`}><AppointmentCard request={request} mode="student" actorId={studentId}/></div>)}</div> : <p className="appointment-empty">No requests for this demo student. Choose an HOD and send your first request above.</p>}</section>
  </section>
}
