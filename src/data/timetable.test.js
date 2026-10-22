// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { faculty } from './faculty'
import { timetable, timetableMetadata } from './timetable'
import {
  ODD_SEMESTERS, STUDENT_SECTIONS, WORKING_DAYS, TEACHING_PERIODS,
  getFacultyWeeklyTimetable, findScheduledClass, validateFacultyReferences, validateTimetable,
} from '../utils/timetableUtils'

describe('fictional weekly timetable dataset', () => {
  it('covers every existing stable faculty ID with distinct varied weekly loads', () => {
    expect(faculty).toHaveLength(35)
    expect(new Set(timetable.map(session => session.facultyId))).toEqual(new Set(faculty.map(person => person.id)))
    expect(validateFacultyReferences(timetable, faculty)).toEqual([])
    expect(new Set(timetable.map(session => session.id)).size).toBe(timetable.length)
    const loads = faculty.map(person => getFacultyWeeklyTimetable(timetable, person.id).length)
    expect(Math.min(...loads)).toBe(4)
    expect(Math.max(...loads)).toBe(10)
    expect(new Set(loads).size).toBe(7)
    expect(timetable).toHaveLength(245)
    expect(timetable.filter(session => session.sessionType === 'lab')).toHaveLength(43)
  })

  it('has valid odd semesters, student sections, weekdays and explicit fictional provenance', () => {
    expect(timetableMetadata.source).toBe('fictional-demo')
    expect(timetableMetadata.semesters).toEqual(ODD_SEMESTERS)
    expect(timetableMetadata.sectionsByDepartment).toEqual(STUDENT_SECTIONS)
    expect(timetableMetadata.workingDays).toEqual(WORKING_DAYS)
    expect(new Set(timetable.map(session => session.semester))).toEqual(new Set([1, 3, 5, 7]))
    expect(new Set(timetable.map(session => session.day))).toEqual(new Set(WORKING_DAYS))
    expect(new Set(timetable.map(session => session.department))).toEqual(new Set(['AIML', 'CSE', 'ISE', 'ECE']))
    for (const session of timetable) {
      expect(session.source).toBe('fictional-demo')
      expect(session.classroom).toMatch(/^DEMO-(CLASS|COMP-LAB)-/)
      expect(session).not.toHaveProperty('cabin')
      const person = faculty.find(record => record.id === session.facultyId)
      expect(person.subjects).toContain(session.subject)
      expect(ODD_SEMESTERS).toContain(session.semester)
      expect(STUDENT_SECTIONS[session.department]).toContain(session.section)
      if (/Lab/.test(session.subject)) expect(session.sessionType).toBe('lab')
    }
  })

  it('passes all schema, reference, faculty, room, and section validations', () => {
    expect(validateTimetable(timetable, faculty)).toEqual({ valid: true, errors: [], conflicts: { faculty: [], classroom: [], section: [] } })
  })

  it('independently reserves every minute of every session for each of the three resources', () => {
    // Independent occupancy check, deliberately not using sessionsOverlap or the
    // conflict checker implementation, so a shared interval bug cannot mask clashes.
    const occupied = new Set()
    const collisions = []
    const minutes = value => { const [hour, minute] = value.split(':').map(Number); return hour * 60 + minute }
    for (const session of timetable) {
      const start = minutes(session.startTime)
      const end = minutes(session.endTime)
      expect(session.startTime).toMatch(/^\d{2}:\d{2}$/)
      expect(session.endTime).toMatch(/^\d{2}:\d{2}$/)
      expect(start).toBeGreaterThanOrEqual(8 * 60 + 30)
      expect(end).toBeLessThanOrEqual(17 * 60 + 30)
      expect(end <= 10 * 60 + 30 || start >= 10 * 60 + 45).toBe(true)
      expect(end <= 12 * 60 + 45 || start >= 13 * 60 + 30).toBe(true)
      expect(end - start).toBe(session.sessionType === 'lab' ? 120 : 60)
      const resources = [
        ['faculty', session.facultyId], ['room', session.classroom],
        ['section', session.department, session.semester, session.section],
      ]
      for (let minute = start; minute < end; minute++) {
        for (const resource of resources) {
          const key = JSON.stringify([session.day, minute, ...resource])
          if (occupied.has(key)) collisions.push({ sessionId: session.id, minute, resource })
          occupied.add(key)
        }
      }
    }
    expect(collisions).toEqual([])
  })

  it('contains consecutive lectures, simultaneous independent sections, and unscheduled periods', () => {
    expect(timetable.some(first => timetable.some(second =>
      first.id !== second.id && first.facultyId === second.facultyId && first.day === second.day &&
      first.sessionType === 'lecture' && second.sessionType === 'lecture' && first.endTime === second.startTime,
    ))).toBe(true)
    expect(timetable.some(first => timetable.some(second =>
      first.id !== second.id && first.day === second.day && first.startTime === second.startTime &&
      first.facultyId !== second.facultyId && first.classroom !== second.classroom &&
      JSON.stringify([first.department, first.semester, first.section]) !== JSON.stringify([second.department, second.semester, second.section]),
    ))).toBe(true)
    for (const person of faculty) {
      expect(findScheduledClass(timetable, person.id, 'Monday', '13:00')).toBeNull()
      expect(findScheduledClass(timetable, person.id, 'Monday', '10:35')).toBeNull()
      expect(getFacultyWeeklyTimetable(timetable, person.id).length).toBeLessThan(6 * 8)
    }
    expect(faculty.some(person => new Set(getFacultyWeeklyTimetable(timetable, person.id).map(session => session.department)).size > 1)).toBe(true)
    expect(faculty.some(person => new Set(getFacultyWeeklyTimetable(timetable, person.id).map(session => session.semester)).size > 1)).toBe(true)
  })

  it('does not require timetable entries for a newly added teacher', () => {
    const futureFaculty = [...faculty, { id: 'future-demo-teacher', name: 'Future Teacher' }]
    expect(validateTimetable(timetable, futureFaculty).valid).toBe(true)
    expect(getFacultyWeeklyTimetable(timetable, 'future-demo-teacher')).toEqual([])
    expect(findScheduledClass(timetable, 'future-demo-teacher', 'Monday', '09:00')).toBeNull()
  })

  it('uses the supplied eight periods, including the first and last, and leaves both breaks unscheduled', () => {
    expect(TEACHING_PERIODS.map(period => [period.startTime, period.endTime])).toEqual([
      ['08:30', '09:30'], ['09:30', '10:30'], ['10:45', '11:45'], ['11:45', '12:45'],
      ['13:30', '14:30'], ['14:30', '15:30'], ['15:30', '16:30'], ['16:30', '17:30'],
    ])
    expect(timetableMetadata.periods).toEqual(TEACHING_PERIODS)
    expect(timetableMetadata.workingHours).toEqual({ startTime: '08:30', endTime: '17:30' })
    expect(timetableMetadata.morningBreak).toMatchObject({ startTime: '10:30', endTime: '10:45' })
    expect(timetableMetadata.lunchBreak).toMatchObject({ startTime: '12:45', endTime: '13:30' })
    for (const period of TEACHING_PERIODS) expect(timetable.some(session => session.startTime === period.startTime)).toBe(true)
    for (const person of faculty) {
      for (const day of WORKING_DAYS) {
        for (const time of ['08:29', '10:30', '10:44', '12:45', '13:29', '17:30']) {
          expect(findScheduledClass(timetable, person.id, day, time)).toBeNull()
        }
      }
    }
  })
})
