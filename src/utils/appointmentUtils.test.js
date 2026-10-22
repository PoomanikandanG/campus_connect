import { describe, it, expect } from 'vitest'
import { hodDemo, demoStudents } from '../data/hodDemo'
import { applyAppointmentAction as apply, availableSlots, campusToday, configuredSlots, emptyAppointments, formatTime, slotInstant, upcomingRequests, validDate } from './appointmentUtils'
import { APPOINTMENT_STORAGE_KEY, loadAppointments, saveAppointments, validAppointmentState } from './appointmentStorage'
const now = new Date('2026-10-21T03:30:00Z') // Wednesday 9 AM IST
const hodId = hodDemo[0].id
const actor = { role: 'hod', id: hodId }
const student = { role: 'student', id: demoStudents[0].id }
const make = (id = 'demo-1', changes = {}) => ({ type: 'request', id, studentId: student.id, department: 'AIML', hodId, date: '2026-10-22', time: '10:00', reason: 'Academic guidance', description: '', ...changes })
const run = (state, action) => apply(state, action, now)
const initial = () => run(emptyAppointments(), make())

describe('fictional appointment rules', () => {
  it('generates morning/afternoon slots, excludes midday gaps and Sundays', () => {
    expect(configuredSlots(hodId, '2026-10-22')).toEqual(['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'])
    expect(configuredSlots(hodId, '2026-10-25')).toEqual([])
    expect(configuredSlots('unknown', '2026-10-22')).toEqual([])
    expect(configuredSlots(hodId, '2026-02-30')).toEqual([])
  })
  it('uses explicit Kolkata instants and formats noon and midnight', () => {
    expect(campusToday(new Date('2026-10-21T19:00:00Z'))).toBe('2026-10-22')
    expect(slotInstant('2026-10-22', '10:00')).toBe(Date.parse('2026-10-22T04:30:00Z'))
    expect(formatTime('00:00')).toBe('12:00 AM')
    expect(formatTime('12:00')).toBe('12:00 PM')
    expect(formatTime('14:30')).toBe('2:30 PM')
    expect(validDate('2026-02-30')).toBe(false)
  })
  it('creates a pending request without reserving a slot or mutating its input', () => {
    const state = emptyAppointments()
    const next = run(state, make())
    expect(state.requests).toEqual([])
    expect(next.requests[0]).toMatchObject({ status: 'Pending', studentId: student.id, proposal: null, createdAt: now.toISOString() })
    expect(availableSlots(next, hodId, '2026-10-22', now)).toContain('10:00')
    expect(upcomingRequests(next.requests, now)).toEqual([])
  })
  it.each([
    { hodId: 'unknown' }, { studentId: 'unknown' }, { department: '' }, { reason: '' },
    { date: '2026-10-20' }, { date: '2026-10-25' }, { time: '13:00' }, { time: '16:00' },
    { time: '10:15' }, { time: '02:30' }, { date: '' }, { description: 'x'.repeat(301) },
  ])('rejects invalid request %j', changes => {
    expect(() => run(emptyAppointments(), make('bad', changes))).toThrow()
  })
  it('rejects a passed slot today and duplicate appointment IDs', () => {
    expect(() => apply(emptyAppointments(), make('late', { date: '2026-10-21' }), new Date('2026-10-21T04:30:00Z'))).toThrow(/future/)
    expect(() => run(initial(), make())).toThrow(/unique/)
  })
  it('allows competing pending requests but only one approval, and cancellation frees the slot', () => {
    let state = run(initial(), make('demo-2', { studentId: demoStudents[1].id }))
    state = run(state, { type: 'approve', id: 'demo-1', actor })
    expect(() => run(state, { type: 'approve', id: 'demo-2', actor })).toThrow(/approved appointment/)
    expect(state.requests[1].status).toBe('Pending')
    state = run(state, { type: 'cancel', id: 'demo-1', actor: student })
    expect(availableSlots(state, hodId, '2026-10-22', now)).toContain('10:00')
    state = run(state, { type: 'approve', id: 'demo-2', actor })
    expect(upcomingRequests(state.requests, now)).toHaveLength(1)
  })
  it('isolates HOD slots and verifies the acting HOD and student', () => {
    const state = initial()
    expect(() => run(state, { type: 'approve', id: 'demo-1', actor: { role: 'hod', id: hodDemo[1].id } })).toThrow()
    expect(() => run(state, { type: 'cancel', id: 'demo-1', actor: { role: 'student', id: demoStudents[1].id } })).toThrow()
    expect(() => run(state, { type: 'block', hodId, date: '2026-10-22', time: '10:00', actor: student })).toThrow()
    const approved = run(state, { type: 'approve', id: 'demo-1', actor })
    expect(availableSlots(approved, hodDemo[1].id, '2026-10-22', now)).toContain('10:00')
  })
  it('blocks and re-enables slots, and prevents blocking an approved booking', () => {
    const action = { type: 'block', hodId, date: '2026-10-22', time: '10:00', actor }
    let state = run(initial(), action)
    expect(availableSlots(state, hodId, action.date, now)).not.toContain('10:00')
    expect(() => run(state, { type: 'approve', id: 'demo-1', actor })).toThrow(/unavailable/)
    expect(() => run(state, make('demo-2'))).toThrow(/unavailable/)
    state = run(state, { ...action, type: 'unblock' })
    state = run(state, { type: 'approve', id: 'demo-1', actor })
    expect(() => run(state, action)).toThrow(/Cancel/)
  })
  it('preserves requested time until a proposal is accepted and checks stale conflicts', () => {
    let state = run(initial(), { type: 'propose', id: 'demo-1', actor, date: '2026-10-22', time: '14:30' })
    expect(state.requests[0]).toMatchObject({ time: '10:00', status: 'Reschedule Proposed', proposal: { time: '14:30' } })
    const proposed = state
    state = run(state, make('demo-2', { time: '14:30', studentId: demoStudents[1].id }))
    state = run(state, { type: 'approve', id: 'demo-2', actor })
    expect(() => run(state, { type: 'accept', id: 'demo-1', actor: student })).toThrow(/approved appointment/)
    const accepted = run(proposed, { type: 'accept', id: 'demo-1', actor: student })
    expect(accepted.requests[0]).toMatchObject({ time: '14:30', status: 'Approved', proposal: null })
  })
  it('rechecks blocked and passed proposals, and supports proposal rejection', () => {
    let state = run(initial(), { type: 'propose', id: 'demo-1', actor, date: '2026-10-22', time: '14:30' })
    state = run(state, { type: 'block', hodId, date: '2026-10-22', time: '14:30', actor })
    expect(() => run(state, { type: 'accept', id: 'demo-1', actor: student })).toThrow(/unavailable/)
    expect(() => apply(state, { type: 'accept', id: 'demo-1', actor: student }, new Date('2026-10-23T00:00:00Z'))).toThrow(/future/)
    state = run(state, { type: 'reject-proposal', id: 'demo-1', actor: student })
    expect(state.requests[0]).toMatchObject({ status: 'Declined', proposal: null, time: '10:00' })
  })
  it('rejects repeated or unknown state transitions and supports HOD decline/cancel', () => {
    let state = run(initial(), { type: 'decline', id: 'demo-1', actor })
    expect(state.requests[0].status).toBe('Declined')
    expect(() => run(state, { type: 'approve', id: 'demo-1', actor })).toThrow()
    expect(() => run(state, { type: 'unknown', id: 'demo-1', actor })).toThrow()
    expect(() => run(state, { type: 'approve', id: 'missing', actor })).toThrow()
    state = run(initial(), { type: 'approve', id: 'demo-1', actor })
    expect(run(state, { type: 'cancel', id: 'demo-1', actor }).requests[0].status).toBe('Cancelled')
  })
})
describe('versioned demo storage', () => {
  function storage() { let value = null; return { getItem: () => value, setItem: (key, next) => { expect(key).toBe(APPOINTMENT_STORAGE_KEY); value = next } } }
  it('initializes empty and restores pending, proposals, approvals and blocked slots', () => {
    const store = storage()
    expect(loadAppointments(store).state).toEqual(emptyAppointments())
    let state = run(initial(), { type: 'propose', id: 'demo-1', actor, date: '2026-10-22', time: '14:30' })
    state = run(state, { type: 'block', hodId, date: '2026-10-22', time: '11:00', actor })
    expect(saveAppointments(state, store)).toBe('')
    expect(loadAppointments(store).state).toEqual(state)
    expect(validAppointmentState(state)).toBe(true)
  })
  it.each(['invalid JSON', '{"version":99}', '{"version":1,"requests":[null],"blockedSlots":[]}'])('recovers safely from %s without overwriting it', raw => {
    const store = { getItem: () => raw, setItem: () => { throw new Error('must not overwrite') } }
    const loaded = loadAppointments(store)
    expect(loaded.state).toEqual(emptyAppointments())
    expect(loaded.warning).toContain('saved copy has not been overwritten')
  })
  it('rejects invalid statuses and conflicting stored approvals', () => {
    const state = initial()
    expect(validAppointmentState({ ...state, requests: [{ ...state.requests[0], status: 'Made up' }] })).toBe(false)
    expect(validAppointmentState({ ...state, requests: [state.requests[0], state.requests[0]] })).toBe(false)
    expect(validAppointmentState({ ...state, requests: [{ ...state.requests[0], status: 'Approved' }, { ...state.requests[0], id: 'duplicate-slot', status: 'Approved' }] })).toBe(false)
  })
  it('reports disabled storage and quota failures', () => {
    const store = { getItem: () => { throw new Error('disabled') }, setItem: () => { throw new Error('quota') } }
    expect(loadAppointments(store).warning).toBeTruthy()
    expect(saveAppointments(initial(), store)).toContain('may be lost on refresh')
  })
})
