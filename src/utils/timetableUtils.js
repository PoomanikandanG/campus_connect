// Pure timetable queries and validation. No React, faculty-data, or UI dependency.
export const WORKING_DAYS = Object.freeze(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
export const ODD_SEMESTERS = Object.freeze([1, 3, 5, 7])
export const STUDENT_SECTIONS = Object.freeze({
  AIML: Object.freeze(['A', 'B']),
  CSE: Object.freeze(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
  ISE: Object.freeze(['A', 'B', 'C', 'D']),
  ECE: Object.freeze(['A', 'B', 'C']),
})

// College bell times, shared by the dataset metadata and timetable validation.
export const TEACHING_PERIODS = Object.freeze([
  { startTime: '08:30', endTime: '09:30' },
  { startTime: '09:30', endTime: '10:30' },
  { startTime: '10:45', endTime: '11:45' },
  { startTime: '11:45', endTime: '12:45' },
  { startTime: '13:30', endTime: '14:30' },
  { startTime: '14:30', endTime: '15:30' },
  { startTime: '15:30', endTime: '16:30' },
  { startTime: '16:30', endTime: '17:30' },
].map(Object.freeze))
export const TIMETABLE_BREAKS = Object.freeze([
  { label: 'Morning break', startTime: '10:30', endTime: '10:45' },
  { label: 'Lunch break', startTime: '12:45', endTime: '13:30' },
].map(Object.freeze))

const kolkataClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

/** Explicit campus timezone, independent of the browser or server timezone. */
export function getKolkataDayTime(date = new Date()) {
  const parts = Object.fromEntries(kolkataClock.formatToParts(date).map(part => [part.type, part.value]))
  return { day: parts.weekday, time: `${parts.hour}:${parts.minute}` }
}

/** Strict 24-hour HH:mm; invalid input returns null, never midnight. */
export function timeToMinutes(time) {
  if (typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const hasText = value => typeof value === 'string' && value.length > 0 && value === value.trim()
const isSessionObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const sectionKey = session => JSON.stringify([session.department, session.semester, session.section])

/** Half-open intervals: [start, end). Adjacent sessions never overlap. */
export function sessionsOverlap(first, second) {
  if (first.day !== second.day) return false
  const values = [first.startTime, first.endTime, second.startTime, second.endTime].map(timeToMinutes)
  if (values.some(value => value === null)) return false
  const [firstStart, firstEnd, secondStart, secondEnd] = values
  return firstStart < firstEnd && secondStart < secondEnd && firstStart < secondEnd && secondStart < firstEnd
}

/** New or unknown faculty IDs safely return an empty weekly timetable. */
export function getFacultyWeeklyTimetable(sessions, facultyId) {
  return sessions.filter(session => session.facultyId === facultyId).sort((a, b) =>
    WORKING_DAYS.indexOf(a.day) - WORKING_DAYS.indexOf(b.day) ||
    a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id),
  )
}

/** A match is a fictional scheduled class, not evidence of actual location.
 * A null result makes no claim about availability or cabin presence.
 */
export function findScheduledClass(sessions, facultyId, day, time) {
  const minute = timeToMinutes(time)
  if (minute === null || !WORKING_DAYS.includes(day)) return null
  return sessions.find(session => {
    const start = timeToMinutes(session.startTime)
    const end = timeToMinutes(session.endTime)
    return session.facultyId === facultyId && session.day === day && start !== null && end !== null && start <= minute && minute < end
  }) || null
}

function findConflicts(sessions, resourceKey) {
  const conflicts = []
  for (let first = 0; first < sessions.length; first++) {
    for (let second = first + 1; second < sessions.length; second++) {
      const a = sessions[first]
      const b = sessions[second]
      if (resourceKey(a) === resourceKey(b) && sessionsOverlap(a, b)) {
        conflicts.push({ day: a.day, resource: resourceKey(a), sessionIds: [a.id, b.id] })
      }
    }
  }
  return conflicts
}

export const checkTeacherConflicts = sessions => findConflicts(sessions, session => session.facultyId)
export const checkClassroomConflicts = sessions => findConflicts(sessions, session => session.classroom)
export const checkSectionConflicts = sessions => findConflicts(sessions, sectionKey)

/** Return all broken references; unknown faculty schedules never affect directory data. */
export function validateFacultyReferences(sessions, facultyRecords) {
  const ids = new Set(facultyRecords.map(person => person.id))
  return sessions.filter(session => !ids.has(session.facultyId))
    .map(session => ({ sessionId: session.id, facultyId: session.facultyId, message: 'Unknown faculty ID' }))
}

/** Validate editable fictional-demo entries, including lunch and full lab durations.
 * Reports errors without mutating records or rejecting unrelated faculty records.
 */
export function validateTimetable(sessions, facultyRecords) {
  const errors = []
  const seenIds = new Set()
  for (const [index, session] of sessions.entries()) {
    if (!isSessionObject(session)) {
      errors.push({ index, message: 'Session must be an object' })
      continue
    }
    const fail = message => errors.push({ sessionId: session.id, message })
    if (!hasText(session.id)) fail('Session ID is required')
    else if (seenIds.has(session.id)) fail('Duplicate session ID')
    seenIds.add(session.id)
    for (const field of ['facultyId', 'subject', 'department', 'section', 'classroom']) {
      if (!hasText(session[field])) fail(`${field} is required`)
    }
    if (!WORKING_DAYS.includes(session.day)) fail('Invalid working day')
    if (!ODD_SEMESTERS.includes(session.semester)) fail('Semester must be 1, 3, 5, or 7')
    const sections = Object.hasOwn(STUDENT_SECTIONS, session.department) ? STUDENT_SECTIONS[session.department] : ['A', 'B', 'C']
    if (!sections.includes(session.section)) fail('Invalid student section')
    if (!['lecture', 'lab'].includes(session.sessionType)) fail('Session type must be lecture or lab')
    if (session.source !== 'fictional-demo') fail('Source must be fictional-demo')
    const start = timeToMinutes(session.startTime)
    const end = timeToMinutes(session.endTime)
    if (start === null || end === null || start >= end) fail('Invalid start/end time range; use HH:mm')
    else {
      if (start < timeToMinutes(TEACHING_PERIODS[0].startTime) || end > timeToMinutes(TEACHING_PERIODS.at(-1).endTime)) fail('Sessions must be within 08:30–17:30')
      for (const pause of TIMETABLE_BREAKS) {
        if (start < timeToMinutes(pause.endTime) && end > timeToMinutes(pause.startTime)) fail(`Session overlaps the ${pause.startTime}–${pause.endTime} ${pause.label.toLowerCase()}`)
      }
      const periodIndex = TEACHING_PERIODS.findIndex(period => period.startTime === session.startTime)
      const period = TEACHING_PERIODS[periodIndex]
      const nextPeriod = TEACHING_PERIODS[periodIndex + 1]
      if (!period) fail('Session must start at a college teaching period')
      else if (session.sessionType === 'lecture' && session.endTime !== period.endTime) fail('Lectures must occupy one teaching period')
      else if (session.sessionType === 'lab' && (!nextPeriod || period.endTime !== nextPeriod.startTime || session.endTime !== nextPeriod.endTime)) fail('Laboratory sessions must occupy two consecutive periods without a break')
      if (session.sessionType === 'lab' && end - start !== 120) fail('Laboratory sessions must reserve two hours')
    }
  }
  const sessionObjects = sessions.filter(isSessionObject)
  errors.push(...validateFacultyReferences(sessionObjects, facultyRecords))
  const conflicts = {
    faculty: checkTeacherConflicts(sessionObjects),
    classroom: checkClassroomConflicts(sessionObjects),
    section: checkSectionConflicts(sessionObjects),
  }
  return { valid: errors.length === 0 && Object.values(conflicts).every(list => list.length === 0), errors, conflicts }
}
