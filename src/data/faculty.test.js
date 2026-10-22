import { describe, expect, it } from 'vitest'
import { faculty } from './faculty'
import { facultyImport } from './faculty_import'
import { createFacultyDirectory } from '../utils/faculty'

const normalizedName = name => name.toLowerCase().replace(/^(?:(?:mr|ms|mrs|dr|prof)\.?\s+)+/i, '').replace(/[^a-z0-9]/g, '')

describe('merged faculty dataset', () => {
  it('includes every imported teacher exactly once without duplicates', () => {
    expect(faculty).toHaveLength(35)
    expect(new Set(faculty.map(person => person.id)).size).toBe(35)
    expect(new Set(faculty.map(person => normalizedName(person.name))).size).toBe(35)
    for (const incoming of facultyImport) {
      const matches = faculty.filter(person => normalizedName(person.name) === normalizedName(incoming.name))
      expect(matches).toHaveLength(1)
      expect(matches[0].cabin).toBe(incoming.cabin)
      expect(matches[0].dataSource).toBe(incoming.dataSource)
    }
  })

  it('preserves the five original URLs and visual settings without unverified department or designation assignments', () => {
    const expected = [
      ['mahesh-h', 'Mr. Mahesh H', 'MH', 'blue', 'G09'],
      ['hajeera-nk', 'Ms. Hajeera NK', 'HN', 'purple', '507'],
      ['indira-s', 'Dr. Indira S', 'IS', 'peach', '507'],
      ['sadhvi', 'Ms. Sadhvi', 'S', 'green', '607'],
      ['jyothi-narayana-murthy', 'Mr. Jyothi Narayana Murthy', 'JM', 'sand', '307'],
    ]
    for (const [id, name, initials, color, cabin] of expected) {
      expect(faculty.find(person => person.id === id)).toMatchObject({ name, department: null, role: null, initials, color, cabin })
    }
  })

  it('uses placeholders for unknown locations and does not retain stale demo schedules', () => {
    const { byId, faculty: directory } = createFacultyDirectory(faculty)
    expect(byId.get('mahesh-h').floor).toBe('Ground Floor')
    expect(byId.get('hajeera-nk').floor).toBe('Fifth floor')
    expect(byId.get('sadhvi').floor).toBe('Sixth floor')
    expect(byId.get('nayanika-saha').cabin).toBe('Not provided')
    expect(byId.get('nayanika-saha').floor).toBe('Not provided')
    expect(byId.get('ravi-kumar').department).toBe('Department not confirmed')
    for (const person of directory) {
      expect(person.building).toBe('Not provided')
      expect(person.timetable).toEqual([])
      expect(person).not.toHaveProperty('time')
      expect(person).not.toHaveProperty('subject')
      expect(person.avatar.suitColor).toBe('#223e60')
    }
  })
})
