const text = value => typeof value === 'string' ? value.trim() : ''

export const DEFAULT_AVATAR_CONFIG = Object.freeze({
  suitColor: '#223e60',
  accentColor: '#7198c9',
  skinColor: '#cba68b',
  hairColor: '#424750',
  idleAnimation: true,
})

export function normalizeAvatarConfig(config) {
  const value = config && typeof config === 'object' ? config : {}
  const colors = Object.fromEntries(
    ['suitColor', 'accentColor', 'skinColor', 'hairColor'].map(key => [
      key, typeof value[key] === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value[key]) ? value[key] : DEFAULT_AVATAR_CONFIG[key],
    ]),
  )
  return { ...colors, idleAnimation: value.idleAnimation !== false }
}

export function getInitials(name) {
  const words = text(name).replace(/^(?:(?:mr|ms|mrs|dr|prof)\.?\s+)+/i, '').split(/\s+/).filter(Boolean)
  if (!words.length) return 'FC'
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words.at(-1)[0]).toUpperCase()
}

/** Infer only recognized cabin codes; G09 is confirmed as Ground Floor. */
export function deriveFloorFromCabin(cabin) {
  const code = (typeof cabin === 'number' ? String(cabin) : text(cabin)).toUpperCase()
  const floors = {
    'G09': 'Ground Floor',
    '206': '2nd Floor',
    '207': '2nd Floor',
    '307': '3rd Floor',
    '407': '4th Floor',
    '507': '5th Floor',
    '607': '6th Floor',
  }
  return Object.hasOwn(floors, code) ? floors[code] : 'Not provided'
}

/** Present optional fields consistently without mutating the source record. */
export function normalizeFaculty(record) {
  const name = text(record.name) || 'Faculty member'
  const explicitFloor = text(record.floor)
  return {
    ...record,
    name,
    department: text(record.department) || 'Department not confirmed',
    subjectArea: text(record.subjectArea),
    subjects: Array.isArray(record.subjects) ? [...new Set(record.subjects.map(text).filter(Boolean))] : [],
    role: text(record.role) || text(record.designation) || 'Designation not provided',
    initials: text(record.initials) || getInitials(name),
    color: ['blue', 'purple', 'peach', 'green', 'sand'].includes(record.color) ? record.color : 'blue',
    // Preserve compatibility with all existing records; new ones can use building.
    building: text(record.building) || text(record.block) || 'Not provided',
    // Explicit floor text takes priority; a placeholder is not verified floor data.
    floor: explicitFloor && explicitFloor.toLowerCase() !== 'not provided'
      ? explicitFloor
      : deriveFloorFromCabin(record.cabin),
    cabin: (typeof record.cabin === 'number' && Number.isFinite(record.cabin) ? String(record.cabin) : text(record.cabin)) || 'Not provided',
    photo: text(record.photo),
    avatar: normalizeAvatarConfig(record.avatar),
    // Data association only: scheduling and timetable display remain unimplemented.
    timetable: Array.isArray(record.timetable)
      ? record.timetable.filter(slot => slot && typeof slot === 'object').map(slot => ({ ...slot, facultyId: record.id }))
      : [],
  }
}

/** IDs are authored once, never generated from names or array positions. */
export function createFacultyDirectory(records) {
  const byId = new Map()
  const faculty = records.map(record => {
    if (!record || !text(record.id) || record.id !== text(record.id)) {
      throw new Error('Each faculty record needs a non-empty, stable string ID without surrounding spaces.')
    }
    if (byId.has(record.id)) throw new Error(`Duplicate faculty ID: ${record.id}. Give each record a unique ID.`)
    const person = normalizeFaculty(record)
    byId.set(person.id, person)
    return person
  })
  return {
    faculty,
    byId,
    departments: [...new Set(faculty.map(person => person.department))].sort(),
  }
}

export function facultyProfileHref(id) {
  return `#/faculty/${encodeURIComponent(id)}`
}
