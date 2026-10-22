import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { faculty } from './data/faculty'
import { normalizeFaculty } from './utils/faculty'

beforeEach(() => window.history.replaceState(null, '', '/'))
afterEach(cleanup)

const groups = {
  'Computer Science': ['ravi-kumar', 'asha-pv', 'vijaya-b', 'renuka-nd', 'jyothi-narayana-murthy', 'mary-angel', 'niranjini-m', 'tanzeem-mukthar', 'nayanika-saha', 'vijaylakshmi', 'veena-s', 'sadhvi', 'charan-sn', 'simran-pal', 'poornima-t', 'chaitra-p', 'preethi-bs', 'harshitha-s', 'shambhavi-b', 'priyanka-cm', 'reena-dk', 'roshini-b', 'aemi-kalari', 'mahesh-h', 'hajeera-nk'],
  Mathematics: ['madhu-g-u', 'ramya-n', 'pavithra-k', 'tejas-j', 'indira-s', 'mahesh-k-s', 'ramya-s-k'],
  Interdisciplinary: ['tanmoy-kundu', 'sulakhe-varun-kumar', 'rakshitha-jn'],
}

function expectCount(count, total = 35) {
  expect(screen.queryAllByRole('article')).toHaveLength(count)
  expect(screen.getByRole('status').textContent).toBe(`Showing ${count} of ${total} faculty members`)
}

describe('faculty subjects and areas', () => {
  it('classifies all 35 stable IDs exactly as requested without assigning official departments', () => {
    expect(faculty).toHaveLength(35)
    expect(faculty.map(person => person.id).sort()).toEqual(Object.values(groups).flat().sort())
    for (const [area, ids] of Object.entries(groups)) {
      for (const id of ids) {
        const person = faculty.find(record => record.id === id)
        expect(person.subjectArea).toBe(area)
        expect(person.department).toBeNull()
        expect(person.role ?? null).toBeNull()
        expect(person.subjects.length).toBeGreaterThan(0)
        expect(person.subjects).not.toContain('COA')
        expect(person.subjects).not.toContain('RWD Lab')
        expect(person.subjects).not.toContain('Data Structures')
      }
    }
    expect(faculty.find(person => person.id === 'rakshitha-jn').subjects).toEqual(['Computer Organization & Architecture', 'Universal Human Values'])
    expect(faculty.find(person => person.id === 'pavithra-k').subjects).toEqual(['Additional Mathematics-I', 'Probability & Inference'])
    for (const id of ['tejas-j', 'indira-s', 'mahesh-k-s', 'ramya-s-k']) {
      expect(faculty.find(person => person.id === id).subjects).toEqual(['Probability Distributions & Statistical Inference'])
    }
  })

  it('keeps 35 results initially and filters each subject area with accurate counts', async () => {
    const user = userEvent.setup()
    render(<App />)
    expectCount(35)
    const select = screen.getByRole('combobox', { name: 'Subject area' })
    expect(within(select).getAllByRole('option').map(option => option.textContent)).toEqual(['All Subjects', 'Computer Science', 'Mathematics', 'Interdisciplinary'])
    for (const [area, ids] of Object.entries(groups)) {
      await user.selectOptions(select, area)
      expectCount(ids.length)
      expect(screen.getAllByRole('article').map(card => within(card).getByRole('link').getAttribute('href').split('/').at(-1)).sort()).toEqual([...ids].sort())
    }
    await user.selectOptions(select, '')
    expectCount(35)
  })

  it('searches subjects without case sensitivity and combines with subject area', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByRole('searchbox', { name: 'Search faculty by name or subject' }), '  UNIVERSAL human  ')
    expectCount(3)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Subject area' }), 'Computer Science')
    expectCount(0)
    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expectCount(35)
    expect(screen.getByRole('searchbox').value).toBe('')
    expect(screen.getByRole('combobox', { name: 'Subject area' }).value).toBe('')
    await user.type(screen.getByRole('searchbox'), 'sAdHvI')
    expectCount(1)
  })

  it('combines official department, subject area, and subject search independently', async () => {
    const user = userEvent.setup()
    const records = [
      { id: 'physics-computing', name: 'Dr. Mira Das', department: 'Physics', subjectArea: 'Computer Science', subjects: ['Operating Systems'] },
      { id: 'physics-math', name: 'Dr. Tara Sen', department: 'Physics', subjectArea: 'Mathematics', subjects: ['Probability'] },
      { id: 'other-computing', name: 'Dr. Dev Shah', department: 'Engineering', subjectArea: 'Computer Science', subjects: ['Operating Systems'] },
    ]
    render(<App records={records} />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Department' }), 'Physics')
    expectCount(2, 3)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Subject area' }), 'Computer Science')
    expectCount(1, 3)
    await user.type(screen.getByRole('searchbox'), 'operating')
    expectCount(1, 3)
    await user.click(screen.getByRole('link', { name: 'View Profile for Dr. Mira Das' }))
    await screen.findByRole('heading', { level: 1, name: 'Dr. Mira Das' })
    await user.click(screen.getByRole('link', { name: 'Back to Faculty Directory' }))
    await screen.findByRole('searchbox')
    expect(screen.getByRole('searchbox').value).toBe('operating')
    expect(screen.getByRole('combobox', { name: 'Subject area' }).value).toBe('Computer Science')
    expect(screen.getByRole('combobox', { name: 'Department' }).value).toBe('Physics')
    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expectCount(3, 3)
    expect(screen.getByRole('combobox', { name: 'Department' }).value).toBe('')
  })

  it.each(faculty)('shows subjects, preserved location and avatar through the direct URL for $name', person => {
    window.history.replaceState(null, '', `/#/faculty/${person.id}`)
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: person.name })).toBeTruthy()
    const subjects = screen.getByRole('region', { name: 'Subjects taught' })
    expect(within(subjects).getByText(person.subjectArea)).toBeTruthy()
    expect(within(subjects).getAllByRole('listitem').map(item => item.textContent)).toEqual(person.subjects)
    expect(screen.getByText('Department not confirmed')).toBeTruthy()
    expect(screen.queryByText('Assistant Professor')).toBeNull()
    const location = screen.getByRole('heading', { name: 'Cabin location' }).parentElement
    const normalized = normalizeFaculty(person)
    for (const [label, value] of [['Building', normalized.building], ['Floor', normalized.floor], ['Cabin number', normalized.cabin]]) {
      expect(within(location).getByText(label, { selector: 'dt' }).nextElementSibling.textContent).toBe(value)
    }
    expect(screen.getByRole('region', { name: 'Faculty Avatar' })).toBeTruthy()
  })

  it('normalizes missing subjects safely without mutating optional input', () => {
    expect(normalizeFaculty({ id: 'minimal', subjects: null }).subjects).toEqual([])
    const source = Object.freeze({ id: 'trimmed', subjects: Object.freeze([' Operating Systems ', null, 'Operating Systems', '']) })
    expect(normalizeFaculty(source).subjects).toEqual(['Operating Systems'])
    expect(source.subjects[0]).toBe(' Operating Systems ')
  })
})
