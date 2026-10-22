import { useId } from 'react'
import { availableSlots, campusToday, formatTime } from '../../utils/appointmentUtils'
import { useAppointmentDemo } from './AppointmentDemoContext'
export default function SlotPicker({ hodId, date, time, onDate, onTime, excludeId, title = 'Appointment' }) {
  const id = useId()
  const { state } = useAppointmentDemo()
  const slots = availableSlots(state, hodId, date, new Date(), excludeId)
  return <fieldset className="appointment-slot-picker"><legend>{title} slot <span>Asia/Kolkata | IST</span></legend>
    <label htmlFor={`${id}-date`}>{title} date</label>
    <input id={`${id}-date`} type="date" min={campusToday()} required value={date} onChange={event => { onDate(event.target.value); onTime('') }}/>
    <fieldset className="slot-options"><legend>{title} time</legend>
      {slots.length ? <div className="slot-grid">{slots.map(slot => <label key={slot} className={time === slot ? 'chosen' : ''}>
        <input type="radio" name={`${id}-slot`} value={slot} checked={time === slot} onChange={() => onTime(slot)} required/>{formatTime(slot)}
      </label>)}</div> : <p className="appointment-empty">No available slots on this date. Choose another day. Sunday has no demo appointment hours.</p>}
    </fieldset>
    <p className="appointment-hint">Pending requests do not reserve a slot. Availability is checked again when approved.</p>
  </fieldset>
}
