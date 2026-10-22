// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  checkTeacherConflicts, checkClassroomConflicts, checkSectionConflicts,
  findScheduledClass, getFacultyWeeklyTimetable, sessionsOverlap,
  timeToMinutes, validateFacultyReferences, validateTimetable,
  getKolkataDayTime,
} from './timetableUtils'

const facultyRecords = [{ id: 'teacher-a' }, { id: 'teacher-b' }]
const session = overrides => ({
  id: 'session-a', facultyId: 'teacher-a', day: 'Monday', startTime: '09:00', endTime: '11:00',
  subject: 'Demo Lab', department: 'CSE', semester: 3, section: 'A', classroom: 'LAB-1',
  sessionType: 'lab', source: 'fictional-demo', ...overrides,
})
const other = overrides => session({ id: 'session-b', facultyId: 'teacher-b', section: 'B', classroom: 'LAB-2', ...overrides })

describe('timetable time handling', () => {
  it('uses Asia/Kolkata across UTC date rollover, Sunday, and midnight', () => {
    expect(getKolkataDayTime(new Date('2026-10-18T18:30:00Z'))).toEqual({ day: 'Monday', time: '00:00' })
    expect(getKolkataDayTime(new Date('2026-10-18T18:29:00Z'))).toEqual({ day: 'Sunday', time: '23:59' })
    expect(getKolkataDayTime(new Date('2026-10-19T04:00:00Z'))).toEqual({ day: 'Monday', time: '09:30' })
  })
  it('parses strict 24-hour times including midnight and late evening', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('23:59')).toBe(1439)
  })
  it.each(['24:00', '09:60', '9:00', '09', ' 09:00 ', '12:30 PM', '', null, undefined, 900])('rejects malformed time %s', value => {
    expect(timeToMinutes(value)).toBeNull()
  })
  it('detects partial overlap, containment and identical times throughout a two-hour lab', () => {
    const lab = session()
    for (const [startTime, endTime] of [['08:30', '09:30'], ['09:30', '10:30'], ['10:30', '11:30'], ['08:00', '12:00'], ['09:00', '11:00']]) {
      expect(sessionsOverlap(lab, other({ startTime, endTime }))).toBe(true)
    }
    expect(sessionsOverlap(lab, other({ startTime: '11:00', endTime: '12:00' }))).toBe(false)
    expect(sessionsOverlap(lab, other({ startTime: '08:00', endTime: '09:00' }))).toBe(false)
    expect(sessionsOverlap(lab, other({ day: 'Tuesday' }))).toBe(false)
    expect(sessionsOverlap(lab, other({ startTime: 'bad' }))).toBe(false)
    expect(sessionsOverlap(lab, other({ startTime: '11:00', endTime: '10:00' }))).toBe(false)
  })
})

describe('weekly queries', () => {
  it('sorts a new result by weekday and time without mutating the input', () => {
    const friday = Object.freeze(session({ id: 'friday', day: 'Friday' }))
    const mondayLate = Object.freeze(session({ id: 'monday-late', startTime: '14:00', endTime: '16:00' }))
    const mondayEarly = Object.freeze(session({ id: 'monday-early' }))
    const input = Object.freeze([friday, mondayLate, other(), mondayEarly])
    expect(getFacultyWeeklyTimetable(input, 'teacher-a').map(entry => entry.id)).toEqual(['monday-early', 'monday-late', 'friday'])
    expect(input[0]).toBe(friday)
    expect(getFacultyWeeklyTimetable(input, 'new-teacher')).toEqual([])
    expect(getFacultyWeeklyTimetable([], 'teacher-a')).toEqual([])
  })
  it('includes the start and entire lab range, excludes the end, and selects an adjacent class', () => {
    const lab = session()
    const next = session({ id: 'next', startTime: '11:00', endTime: '12:00', sessionType: 'lecture' })
    const input = [lab, next]
    for (const time of ['09:00', '09:59', '10:00', '10:59']) expect(findScheduledClass(input, 'teacher-a', 'Monday', time)).toBe(lab)
    expect(findScheduledClass(input, 'teacher-a', 'Monday', '11:00')).toBe(next)
    for (const [id, day, time] of [['teacher-a', 'Monday', '08:59'], ['teacher-a', 'Monday', '12:00'], ['teacher-a', 'Monday', '13:30'], ['new-teacher', 'Monday', '09:30'], ['teacher-a', 'Sunday', '09:30'], ['teacher-a', 'Monday', 'bad']]) {
      expect(findScheduledClass(input, id, day, time)).toBeNull()
    }
  })
})

describe('independent conflict checks', () => {
  it('detects a teacher double booking in the second hour of a lab in a different room and section', () => {
    const input = [session(), other({ facultyId: 'teacher-a', startTime: '10:00', endTime: '11:00', sessionType: 'lecture' })]
    expect(checkTeacherConflicts(input)).toEqual([{ day: 'Monday', resource: 'teacher-a', sessionIds: ['session-a', 'session-b'] }])
    expect(checkClassroomConflicts(input)).toEqual([])
    expect(checkSectionConflicts(input)).toEqual([])
  })
  it('detects a room booking conflict with a different teacher and section', () => {
    const input = [session(), other({ classroom: 'LAB-1', startTime: '10:30', endTime: '11:30', sessionType: 'lecture' })]
    expect(checkClassroomConflicts(input)).toHaveLength(1)
    expect(checkTeacherConflicts(input)).toEqual([])
    expect(checkSectionConflicts(input)).toEqual([])
  })
  it('identifies sections by department, semester AND section', () => {
    expect(checkSectionConflicts([session(), other({ section: 'A' })])).toHaveLength(1)
    expect(checkSectionConflicts([session(), other({ section: 'A', department: 'ISE' })])).toEqual([])
    expect(checkSectionConflicts([session(), other({ section: 'A', semester: 5 })])).toEqual([])
    expect(checkSectionConflicts([session(), other()])).toEqual([])
  })
  it('allows adjacent sessions, other days, and separate simultaneous sections', () => {
    const input = [session(), other(), session({ id: 'next', startTime: '11:00', endTime: '13:00' }), session({ id: 'tuesday', day: 'Tuesday' })]
    expect(checkTeacherConflicts(input)).toEqual([])
    expect(checkClassroomConflicts(input)).toEqual([])
    expect(checkSectionConflicts(input)).toEqual([])
  })
  it('reports every conflicting pair, including a long lab spanning multiple sessions', () => {
    const input = [session(), session({ id: 'short-one', startTime: '09:00', endTime: '10:00' }), session({ id: 'short-two', startTime: '10:00', endTime: '11:00' })]
    expect(checkTeacherConflicts(input)).toHaveLength(2)
  })
})

describe('timetable validation', () => {
  const validSession = overrides => session({ startTime: '08:30', endTime: '10:30', ...overrides })
  it.each([
    ['08:30', '09:30'], ['09:30', '10:30'], ['10:45', '11:45'], ['11:45', '12:45'],
    ['13:30', '14:30'], ['14:30', '15:30'], ['15:30', '16:30'], ['16:30', '17:30'],
  ])('accepts the college lecture period %s–%s, including Saturday', (startTime, endTime) => {
    expect(validateTimetable([validSession({ day: 'Saturday', sessionType: 'lecture', startTime, endTime })], facultyRecords).valid).toBe(true)
  })
  it.each([
    ['08:30', '10:30'], ['10:45', '12:45'], ['13:30', '15:30'], ['14:30', '16:30'], ['15:30', '17:30'],
  ])('accepts two uninterrupted lab periods %s–%s', (startTime, endTime) => {
    expect(validateTimetable([validSession({ startTime, endTime })], facultyRecords).valid).toBe(true)
  })
  it.each([
    ['09:30', '11:30'], ['11:45', '13:45'], ['10:30', '12:30'], ['12:45', '14:45'],
  ])('rejects a two-hour lab overlapping a break: %s–%s', (startTime, endTime) => {
    const result = validateTimetable([validSession({ startTime, endTime })], facultyRecords)
    expect(result.valid).toBe(false)
    expect(result.errors.some(error => /overlaps.*break/.test(error.message))).toBe(true)
  })
  it('rejects the obsolete hourly lecture grid and off-period bookings', () => {
    expect(validateTimetable([validSession({ sessionType: 'lecture', startTime: '09:00', endTime: '10:00' })], facultyRecords).valid).toBe(false)
    expect(validateTimetable([validSession({ sessionType: 'lecture', startTime: '16:45', endTime: '17:30' })], facultyRecords).valid).toBe(false)
  })
  it('reports invalid references without requiring every teacher to have classes', () => {
    expect(validateFacultyReferences([validSession()], facultyRecords)).toEqual([])
    expect(validateFacultyReferences([validSession({ facultyId: 'unknown' })], facultyRecords)).toEqual([{ sessionId: 'session-a', facultyId: 'unknown', message: 'Unknown faculty ID' }])
    expect(validateTimetable([], [...facultyRecords, { id: 'future-teacher' }]).valid).toBe(true)
  })
  it('accepts valid labs and lunch boundaries', () => {
    const input = [validSession({ startTime: '10:45', endTime: '12:45' }), other({ startTime: '13:30', endTime: '15:30' })]
    expect(validateTimetable(input, facultyRecords)).toEqual({ valid: true, errors: [], conflicts: { faculty: [], classroom: [], section: [] } })
  })
  it.each([
    { id: '' }, { facultyId: 'unknown' }, { subject: '' }, { department: '' }, { classroom: '' },
    { startTime: '9:00' }, { startTime: '11:00', endTime: '10:00' }, { startTime: '09:00', endTime: '09:00' },
    { startTime: '08:00', endTime: '10:00' }, { startTime: '16:00', endTime: '18:00' },
    { startTime: '12:00', endTime: '14:00' }, { startTime: '09:00', endTime: '10:00' },
    { day: 'Sunday' }, { semester: 2 }, { section: 'H' }, { department: 'AIML', section: 'C' },
    { source: 'actual' }, { sessionType: 'meeting' },
  ])('rejects invalid session fields: %j', overrides => {
    expect(validateTimetable([validSession(overrides)], facultyRecords).valid).toBe(false)
  })
  it('checks duplicate IDs and supports other departments with sections A–C', () => {
    expect(validateTimetable([validSession(), validSession({ day: 'Tuesday' })], facultyRecords).errors.some(error => error.message === 'Duplicate session ID')).toBe(true)
    expect(validateTimetable([validSession({ department: 'Civil Engineering', section: 'C' })], facultyRecords).valid).toBe(true)
    expect(validateTimetable([validSession({ department: 'Civil Engineering', section: 'D' })], facultyRecords).valid).toBe(false)
  })
  it('reports malformed entries and padded resource IDs instead of silently accepting them', () => {
    expect(validateTimetable([null, undefined, [], 'not a session'], facultyRecords).errors).toHaveLength(4)
    expect(validateTimetable([validSession({ classroom: ' LAB-1 ' })], facultyRecords).valid).toBe(false)
  })
})
