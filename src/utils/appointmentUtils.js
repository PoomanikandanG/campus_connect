import { hodDemo, demoStudents, reasonCategories } from '../data/hodDemo'

export const emptyAppointments = () => ({ version: 1, requests: [], blockedSlots: [] })
export function campusToday(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
export function validDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}
export const validTime = time => typeof time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
const timeString = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
export function slotInstant(date, time) {
  return validDate(date) && validTime(time) ? new Date(`${date}T${time}:00+05:30`).getTime() : NaN
}
export function formatTime(time) {
  if (!validTime(time)) return 'Invalid time'
  const hour = Number(time.slice(0, 2))
  return `${hour % 12 || 12}:${time.slice(3)} ${hour >= 12 ? 'PM' : 'AM'}`
}
export const formatDate = date => validDate(date) ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00+05:30`)) : 'Invalid date'
export const formatCreated = value => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short', hour12: true }).format(new Date(value))
export function configuredSlots(hodId, date) {
  const hod = hodDemo.find(person => person.id === hodId)
  if (!hod || !validDate(date)) return []
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return (hod.weeklyHours[weekday] || []).flatMap(range => {
    const slots = []
    for (let value = minutes(range.start); value + hod.duration <= minutes(range.end); value += hod.duration) slots.push(timeString(value))
    return slots
  })
}
export function nextAppointmentDate(state, hodId, now = new Date()) {
  const today = campusToday(now)
  for (let offset = 0; offset < 31; offset++) {
    const day = new Date(`${today}T12:00:00+05:30`)
    day.setUTCDate(day.getUTCDate() + offset)
    const date = campusToday(day)
    if (availableSlots(state, hodId, date, now).length) return date
  }
  return today
}
export function slotProblem(state, hodId, date, time, now = new Date(), excludeId = null) {
  if (!configuredSlots(hodId, date).includes(time)) return 'Choose a slot within this fictional HOD appointment hours.'
  if (slotInstant(date, time) <= now.getTime()) return 'Choose a future date and time in Asia/Kolkata.'
  if (state.blockedSlots.some(slot => slot.hodId === hodId && slot.date === date && slot.time === time)) return 'This slot has been marked unavailable.'
  if (state.requests.some(request => request.id !== excludeId && request.status === 'Approved' && request.hodId === hodId && request.date === date && request.time === time)) return 'This slot already has an approved appointment. Choose another time.'
  return null
}
export const availableSlots = (state, hodId, date, now = new Date(), excludeId = null) => configuredSlots(hodId, date).filter(time => !slotProblem(state, hodId, date, time, now, excludeId))
export const upcomingRequests = (requests, now = new Date()) => requests.filter(request => request.status === 'Approved' && slotInstant(request.date, request.time) > now.getTime()).sort((a, b) => slotInstant(a.date, a.time) - slotInstant(b.date, b.time))
function assert(condition, message) { if (!condition) throw new Error(message) }
function requireSlot(state, hodId, date, time, now, excludeId) {
  const problem = slotProblem(state, hodId, date, time, now, excludeId)
  assert(!problem, problem)
}
// All mutations pass through this pure reducer; role simulation is NOT security.
export function applyAppointmentAction(state, action, now = new Date()) {
  if (action.type === 'request') {
    const student = demoStudents.find(person => person.id === action.studentId)
    assert(student, 'Choose a demo student identity.')
    assert(hodDemo.some(hod => hod.id === action.hodId), 'Choose a valid fictional HOD.')
    assert(['AIML', 'CSE', 'ISE', 'ECE'].includes(action.department), 'Choose a student department.')
    assert(reasonCategories.includes(action.reason), 'Choose a reason category.')
    assert(typeof (action.description ?? '') === 'string' && (action.description ?? '').length <= 300, 'Keep the description within 300 characters.')
    assert(typeof action.id === 'string' && action.id && !state.requests.some(request => request.id === action.id), 'Appointment ID must be unique.')
    requireSlot(state, action.hodId, action.date, action.time, now)
    return { ...state, requests: [...state.requests, {
      id: action.id, studentId: student.id, studentName: student.name, department: action.department,
      hodId: action.hodId, date: action.date, time: action.time, reason: action.reason,
      description: (action.description || '').trim(), status: 'Pending', proposal: null,
      createdAt: now.toISOString(), updatedAt: now.toISOString(),
    }] }
  }
  if (action.type === 'block' || action.type === 'unblock') {
    assert(action.actor?.role === 'hod' && action.actor.id === action.hodId, 'Select the matching Demo HOD to manage slots.')
    assert(configuredSlots(action.hodId, action.date).includes(action.time), 'Choose a configured appointment slot.')
    assert(slotInstant(action.date, action.time) > now.getTime(), 'Past slots cannot be changed.')
    assert(!state.requests.some(request => request.status === 'Approved' && request.hodId === action.hodId && request.date === action.date && request.time === action.time), 'Cancel the approved appointment before blocking its slot.')
    const other = state.blockedSlots.filter(slot => !(slot.hodId === action.hodId && slot.date === action.date && slot.time === action.time))
    return { ...state, blockedSlots: action.type === 'block' ? [...other, { hodId: action.hodId, date: action.date, time: action.time }] : other }
  }
  const request = state.requests.find(item => item.id === action.id)
  assert(request, 'Appointment not found. Refresh the request list.')
  const student = action.actor?.role === 'student' && action.actor.id === request.studentId
  const hod = action.actor?.role === 'hod' && action.actor.id === request.hodId
  let patch
  if (action.type === 'cancel') {
    assert((student || hod) && ['Pending', 'Approved'].includes(request.status), 'This appointment cannot be cancelled in its current state.')
    patch = { status: 'Cancelled', proposal: null }
  } else if (action.type === 'approve') {
    assert(hod && request.status === 'Pending', 'Only this Demo HOD can approve a pending request.')
    requireSlot(state, request.hodId, request.date, request.time, now, request.id)
    patch = { status: 'Approved' }
  } else if (action.type === 'decline') {
    assert(hod && request.status === 'Pending', 'Only this Demo HOD can decline a pending request.')
    patch = { status: 'Declined' }
  } else if (action.type === 'propose') {
    assert(hod && request.status === 'Pending', 'Only this Demo HOD can propose a new time for a pending request.')
    assert(action.date !== request.date || action.time !== request.time, 'Choose a different time for the proposal.')
    requireSlot(state, request.hodId, action.date, action.time, now, request.id)
    patch = { status: 'Reschedule Proposed', proposal: { date: action.date, time: action.time } }
  } else if (action.type === 'accept') {
    assert(student && request.status === 'Reschedule Proposed' && request.proposal, 'Only the selected demo student can accept this proposal.')
    requireSlot(state, request.hodId, request.proposal.date, request.proposal.time, now, request.id)
    patch = { status: 'Approved', date: request.proposal.date, time: request.proposal.time, proposal: null }
  } else if (action.type === 'reject-proposal') {
    assert(student && request.status === 'Reschedule Proposed', 'Only the selected demo student can decline this proposal.')
    patch = { status: 'Declined', proposal: null }
  } else throw new Error('Unknown appointment action.')
  return { ...state, requests: state.requests.map(item => item.id === request.id ? { ...item, ...patch, updatedAt: now.toISOString() } : item) }
}
