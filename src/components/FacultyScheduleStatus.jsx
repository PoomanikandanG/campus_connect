import { useEffect, useId, useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { timetable } from '../data/timetable'
import { findScheduledClass, getFacultyWeeklyTimetable, getKolkataDayTime, timeToMinutes, WORKING_DAYS } from '../utils/timetableUtils'
import './FacultyScheduleStatus.css'

const isKnown = value => value !== null && value !== undefined && String(value).trim() !== '' && value !== 'Not provided'

export default function FacultyScheduleStatus({ faculty, sessions = timetable }) {
  const id = useId()
  const [manual, setManual] = useState(false)
  const [selection, setSelection] = useState(getKolkataDayTime)
  const weekly = useMemo(() => getFacultyWeeklyTimetable(sessions ?? [], faculty.id), [sessions, faculty.id])
  const [hour24, minute] = selection.time.split(':')
  const hour = String(Number(hour24) % 12 || 12)
  const period = Number(hour24) >= 12 ? 'PM' : 'AM'

  function changeTime(part, value) {
    const next = { hour, minute, period, [part]: value }
    const hours = Number(next.hour) % 12 + (next.period === 'PM' ? 12 : 0)
    setSelection(current => ({ ...current, time: `${String(hours).padStart(2, '0')}:${next.minute}` }))
  }

  const hasTime = timeToMinutes(selection.time) !== null
  const scheduled = hasTime ? findScheduledClass(weekly, faculty.id, selection.day, selection.time) : null
  const cabin = isKnown(faculty.cabin)
    ? [faculty.cabin, faculty.building, faculty.floor].filter(isKnown).join(' · ')
    : null

  // Keep current-time results accurate at minute boundaries; manual checks stay fixed.
  useEffect(() => {
    if (manual) return undefined
    let timer
    const refresh = () => {
      setSelection(getKolkataDayTime())
      timer = window.setTimeout(refresh, 60_000 - (Date.now() % 60_000))
    }
    timer = window.setTimeout(refresh, 60_000 - (Date.now() % 60_000))
    return () => window.clearTimeout(timer)
  }, [manual])

  function checkCurrentTime() {
    setSelection(getKolkataDayTime())
    setManual(false)
  }

  return <section className="faculty-schedule" aria-labelledby={`${id}-heading`}>
    <div className="schedule-heading"><CalendarDays size={21} aria-hidden="true"/><h2 id={`${id}-heading`}>Faculty Schedule Checker</h2></div>
    <p className="schedule-demo">Demo timetable — not actual faculty location.</p>
    <p className="schedule-checking">{manual ? 'Selected time' : 'Current time'}: {selection.day}, {selection.time || '—'} <span>(Asia/Kolkata · IST)</span></p>

    <div className="schedule-result" role="status" aria-live="polite" aria-atomic="true">
      {!weekly.length ? <>
        <h3>Schedule information unavailable</h3>
        {cabin && <p>{`Permanent cabin: ${cabin}`}</p>}
      </> : !hasTime ? <p>Choose a valid time to check the schedule.</p> : scheduled ? <>
        <h3>Scheduled to teach</h3>
        <dl className="schedule-details">
          <div><dt>Department</dt><dd>{scheduled.department}</dd></div>
          <div><dt>Semester</dt><dd>{scheduled.semester}</dd></div>
          <div><dt>Section</dt><dd>{scheduled.section}</dd></div>
          <div className="schedule-subject"><dt>Subject</dt><dd>{scheduled.subject}</dd></div>
          <div><dt>{scheduled.sessionType === 'lab' ? 'Laboratory' : 'Classroom'}</dt><dd>{scheduled.classroom}</dd></div>
          <div><dt>Scheduled time</dt><dd>{scheduled.startTime} – {scheduled.endTime}</dd></div>
        </dl>
      </> : <>
        <h3>No class scheduled at this time</h3>
        {cabin && <p>{`Permanent cabin: ${cabin}`}</p>}
      </>}
      <p className="schedule-availability">Actual faculty availability and location are not confirmed.</p>
    </div>

    {manual && <fieldset className="schedule-controls">
      <legend>Check another time</legend>
      <div><label htmlFor={`${id}-day`}>Day</label><select id={`${id}-day`} value={selection.day} onChange={event => setSelection(current => ({ ...current, day: event.target.value }))}>
        {[...WORKING_DAYS, 'Sunday'].map(day => <option key={day} value={day}>{day}</option>)}
      </select></div>
      <fieldset className="schedule-time">
        <legend>Time (Asia/Kolkata)</legend>
        <div className="schedule-time-parts">
          <div><label htmlFor={`${id}-hour`}>Hour</label><select id={`${id}-hour`} value={hour} onChange={event => changeTime('hour', event.target.value)}>
            {Array.from({ length: 12 }, (_, index) => String(index + 1)).map(value => <option key={value}>{value}</option>)}
          </select></div>
          <div><label htmlFor={`${id}-minute`}>Minute</label><select id={`${id}-minute`} value={minute} onChange={event => changeTime('minute', event.target.value)}>
            <optgroup label="Common minutes">{['00', '15', '30', '45'].map(value => <option key={value}>{value}</option>)}</optgroup>
            <optgroup label="Other minutes">{Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')).filter(value => !['00', '15', '30', '45'].includes(value)).map(value => <option key={value}>{value}</option>)}</optgroup>
          </select></div>
          <div><label htmlFor={`${id}-period`}>AM/PM</label><select id={`${id}-period`} value={period} onChange={event => changeTime('period', event.target.value)}>
            <option>AM</option><option>PM</option>
          </select></div>
        </div>
      </fieldset>
    </fieldset>}
    <div className="schedule-actions">
      {!manual && <button type="button" onClick={() => setManual(true)}>Check another time</button>}
      <button type="button" className="schedule-current" onClick={checkCurrentTime}>Check current time</button>
    </div>
  </section>
}
