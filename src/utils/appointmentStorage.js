import { appointmentStatuses, demoStudents, hodDemo, reasonCategories } from '../data/hodDemo'
import { configuredSlots, emptyAppointments } from './appointmentUtils'
export const APPOINTMENT_STORAGE_KEY = 'campusconnect_hod_demo_v1'
const isObject = value => value && typeof value === 'object' && !Array.isArray(value)
const timestamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value))
const validSlot = value => isObject(value) && configuredSlots(value.hodId, value.date).includes(value.time)
export function validAppointmentState(value) {
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.requests) || !Array.isArray(value.blockedSlots)) return false
  const ids = new Set()
  const approved = new Set()
  for (const request of value.requests) {
    if (!validSlot(request) || typeof request.id !== 'string' || !request.id || ids.has(request.id) ||
      !demoStudents.some(student => student.id === request.studentId && student.name === request.studentName) ||
      !hodDemo.some(hod => hod.id === request.hodId) || !['AIML', 'CSE', 'ISE', 'ECE'].includes(request.department) ||
      !reasonCategories.includes(request.reason) || typeof request.description !== 'string' || request.description.length > 300 ||
      !appointmentStatuses.includes(request.status) || !timestamp(request.createdAt) || !timestamp(request.updatedAt)) return false
    ids.add(request.id)
    if (request.status === 'Reschedule Proposed') {
      if (!validSlot({ ...request.proposal, hodId: request.hodId })) return false
    } else if (request.proposal !== null) return false
    if (request.status === 'Approved') {
      const key = `${request.hodId}/${request.date}/${request.time}`
      if (approved.has(key)) return false
      approved.add(key)
    }
  }
  return value.blockedSlots.every(slot => validSlot(slot) && !approved.has(`${slot.hodId}/${slot.date}/${slot.time}`))
}
export function loadAppointments(storage = window.localStorage) {
  try {
    const raw = storage.getItem(APPOINTMENT_STORAGE_KEY)
    if (!raw) return { state: emptyAppointments(), warning: '' }
    const state = JSON.parse(raw)
    if (!validAppointmentState(state)) throw new Error('Incompatible data')
    return { state, warning: '' }
  } catch {
    return { state: emptyAppointments(), warning: 'Saved demo data could not be read or is incompatible. An empty demo is shown; the saved copy has not been overwritten.' }
  }
}
export function saveAppointments(state, storage = window.localStorage) {
  try { storage.setItem(APPOINTMENT_STORAGE_KEY, JSON.stringify(state)); return '' }
  catch { return 'Browser storage is unavailable. Changes work in this tab but may be lost on refresh.' }
}
