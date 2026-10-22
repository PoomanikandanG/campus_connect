import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { faculty } from './data/faculty'
import { createFacultyDirectory, facultyProfileHref, normalizeFaculty } from './utils/faculty'

// Test-only additional teacher; the production dataset remains untouched.
const sixthFaculty = Object.freeze({
  id: 'ananya-rao', name: 'Prof. Ananya Rao', department: 'Civil Engineering',
  designation: 'Associate Professor', building: 'Academic Block D', floor: 'Third floor', cabin: 'D-301',
  avatar: { suitColor: '#314d68', idleAnimation: false },
})

beforeEach(() => window.history.replaceState(null, '', '/'))
afterEach(cleanup)

describe('extensible faculty records', () => {
  it('keeps all existing records, with unique stable IDs and compatible legacy fields', () => {
    const directory = createFacultyDirectory(faculty)
    expect(directory.faculty).toHaveLength(faculty.length)
    expect(directory.byId.size).toBe(faculty.length)
    for (const source of faculty) {
      const normalized = directory.byId.get(source.id)
      expect(normalized.id).toBe(source.id)
      expect(normalized.name).toBe(source.name)
      expect(normalized.subjects).toEqual(source.subjects)
      expect(normalized.building).toBe(source.building || source.block || 'Not provided')
      expect(normalized.role).toBe(source.role || 'Designation not provided')
    }
  })

  it('automatically lists and filters a sixth teacher and opens their shared profile', async () => {
    const user = userEvent.setup()
    render(<App records={[...faculty, sixthFaculty]}/>)
    expect(screen.getAllByRole('article')).toHaveLength(faculty.length + 1)
    expect(screen.getByRole('option', { name: sixthFaculty.department })).toBeTruthy()
    await user.type(screen.getByRole('searchbox'), 'aNaNyA')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('status').textContent).toBe(`Showing 1 of ${faculty.length + 1} faculty members`)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Department' }), 'Department not confirmed')
    expect(screen.getByRole('heading', { name: 'No faculty found' })).toBeTruthy()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Department' }), sixthFaculty.department)
    await user.click(screen.getByRole('link', { name: `View Profile for ${sixthFaculty.name}` }))
    await screen.findByRole('heading', { level: 1, name: sixthFaculty.name })
    const profile = screen.getByRole('region', { name: sixthFaculty.name })
    for (const value of [sixthFaculty.department, sixthFaculty.designation, sixthFaculty.building, sixthFaculty.floor, sixthFaculty.cabin, 'AR']) {
      expect(within(profile).getByText(value)).toBeTruthy()
    }
    await user.click(screen.getByRole('link', { name: 'Back to Faculty Directory' }))
    expect((await screen.findByRole('searchbox')).value).toBe('aNaNyA')
    expect(screen.getByRole('combobox', { name: 'Department' }).value).toBe(sixthFaculty.department)
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('renders a teacher with all optional fields omitted in the directory and profile', async () => {
    const user = userEvent.setup()
    const minimal = { id: 'minimal-teacher', name: 'Dr. Mira Das', department: 'Physics' }
    render(<App records={[...faculty, minimal]}/>)
    const card = screen.getByRole('heading', { name: minimal.name }).closest('article')
    expect(card.textContent).toContain('Not provided')
    await user.click(within(card).getByRole('link', { name: `View Profile for ${minimal.name}` }))
    await screen.findByRole('heading', { level: 1, name: minimal.name })
    const profile = screen.getByRole('region', { name: minimal.name })
    expect(within(profile).getAllByText('Not provided')).toHaveLength(3)
    expect(within(profile).queryByText('Designation not provided')).toBeNull()
    expect(within(profile).getByText('MD')).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Faculty Avatar' })).toBeTruthy()
  })

  it('handles null optional values, a missing department, and failed photos', async () => {
    const user = userEvent.setup()
    const minimal = { id: 'incomplete-teacher', name: 'Prof. Dev Shah', department: null, role: null, initials: null, building: null, floor: null, cabin: null, avatar: null, timetable: null, photo: '/missing-photo.png' }
    render(<App records={[minimal]}/>)
    expect(screen.getByRole('option', { name: 'Department not confirmed' })).toBeTruthy()
    await user.type(screen.getByRole('searchbox'), 'dev')
    await user.click(screen.getByRole('link', { name: `View Profile for ${minimal.name}` }))
    const image = await screen.findByRole('img', { name: `Portrait of ${minimal.name}` })
    fireEvent.error(image)
    const profile = screen.getByRole('region', { name: minimal.name })
    expect(within(profile).getByText('DS')).toBeTruthy()
    expect(within(profile).queryByRole('img')).toBeNull()
    expect(within(profile).getAllByText('Not provided')).toHaveLength(3)
  })

  it('uses IDs rather than names so duplicate or changed names still open the correct profile', async () => {
    const user = userEvent.setup()
    const teacher = { ...sixthFaculty, name: faculty[0].name }
    render(<App records={[...faculty, teacher]}/>)
    const card = screen.getAllByRole('article').find(card => within(card).queryByText(sixthFaculty.department))
    await user.click(within(card).getByRole('link'))
    await screen.findByRole('heading', { level: 1, name: teacher.name })
    expect(window.location.hash).toBe(facultyProfileHref(teacher.id))
    expect(screen.getByText(teacher.cabin)).toBeTruthy()
  })

  it.each(['unknown-id', '', '%E0%A4%A'])('handles an invalid ID safely: %s', id => {
    window.history.replaceState(null, '', `/#/faculty/${id}`)
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Faculty not found' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to Faculty Directory' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Faculty Avatar' })).toBeNull()
  })

  it('links future timetable entries by faculty ID without mutating source data', () => {
    const record = Object.freeze({ ...sixthFaculty, timetable: Object.freeze([Object.freeze({ subject: 'Structures', day: 'Monday' })]) })
    const person = normalizeFaculty(record)
    expect(person.timetable[0].facultyId).toBe(record.id)
    expect(record.timetable[0]).not.toHaveProperty('facultyId')
    expect(normalizeFaculty({ ...record, name: 'Updated name' }).timetable[0].facultyId).toBe(record.id)
    expect(normalizeFaculty(sixthFaculty).timetable).toEqual([])
  })

  it('rejects duplicate or missing IDs with actionable data errors', () => {
    expect(() => createFacultyDirectory([sixthFaculty, sixthFaculty])).toThrow('Duplicate faculty ID')
    expect(() => createFacultyDirectory([{ name: 'Missing ID' }])).toThrow('stable string ID')
  })
})
