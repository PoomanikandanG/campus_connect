import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { faculty as facultyRecords } from './data/faculty'
import { createFacultyDirectory } from './utils/faculty'

// Confirmed-department fixtures keep coverage of the independent department filter.
// Production departments remain unknown until official information is supplied.
const departmentFixtures = {
  'mahesh-h': 'Computer Science', 'hajeera-nk': 'Information Science',
  'indira-s': 'Mathematics', sadhvi: 'Electronics & Communication',
  'jyothi-narayana-murthy': 'Computer Science',
}
const records = facultyRecords.map(person => ({ ...person, department: departmentFixtures[person.id] || null }))
const { faculty } = createFacultyDirectory(records)

afterEach(cleanup)
beforeEach(() => window.history.replaceState(null, '', '/'))

function expectResults(names) {
  const cards = screen.queryAllByRole('article')
  expect(cards).toHaveLength(names.length)
  expect(cards.map(card => card.querySelector('h3').textContent)).toEqual(names)
  expect(screen.getByRole('status').textContent).toBe(`Showing ${names.length} of ${faculty.length} faculty members`)
}

describe('faculty search and department filtering', () => {
  it('starts with all profiles and unique departments from the local dataset', () => {
    render(<App records={records} />)
    expectResults(faculty.map(person => person.name))
    expect(within(screen.getByRole('combobox', { name: 'Department' })).getAllByRole('option').map(option => option.value)).toEqual([
      '', 'Computer Science', 'Department not confirmed', 'Electronics & Communication', 'Information Science', 'Mathematics',
    ])
    faculty.forEach(person => {
      const card = screen.getByRole('heading', { name: person.name }).closest('article')
      expect(card.textContent).toContain(person.department)
      expect(card.textContent).toContain(person.cabin)
      expect(card.textContent).toContain(person.building)
    })
  })

  it('matches partial names without case sensitivity, updating on every keystroke', async () => {
    const user = userEvent.setup()
    render(<App records={records} />)
    const search = screen.getByRole('searchbox', { name: 'Search faculty by name or subject' })
    await user.type(search, 'h')
    expectResults(faculty.filter(person => /h/i.test(person.name) || person.subjects.some(subject => /h/i.test(subject))).map(person => person.name))
    await user.type(search, 'Aj')
    expectResults(['Ms. Hajeera NK'])
    await user.clear(search)
    await user.type(search, '  INDIRA  ')
    expectResults(['Dr. Indira S'])
    await user.clear(search)
    await user.type(search, '   ')
    expectResults(faculty.map(person => person.name))
  })

  it('filters each department and restores all profiles when All departments is selected', async () => {
    const user = userEvent.setup()
    render(<App records={records} />)
    const select = screen.getByRole('combobox', { name: 'Department' })
    for (const department of new Set(faculty.map(person => person.department))) {
      await user.selectOptions(select, department)
      expectResults(faculty.filter(person => person.department === department).map(person => person.name))
    }
    await user.selectOptions(select, '')
    expectResults(faculty.map(person => person.name))
  })

  it('combines name and department, shows no results, and clears both controls', async () => {
    const user = userEvent.setup()
    render(<App records={records} />)
    const search = screen.getByRole('searchbox')
    const select = screen.getByRole('combobox', { name: 'Department' })
    await user.selectOptions(select, 'Computer Science')
    await user.type(search, 'm')
    expectResults(['Mr. Mahesh H', 'Mr. Jyothi Narayana Murthy'])
    await user.clear(search)
    await user.type(search, 'hajeera')
    expectResults([])
    expect(screen.getByRole('heading', { name: 'No faculty found' })).toBeTruthy()
    await user.selectOptions(select, 'Information Science')
    expectResults(['Ms. Hajeera NK'])
    await user.selectOptions(select, 'Mathematics')
    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expect(search.value).toBe('')
    expect(select.value).toBe('')
    expectResults(faculty.map(person => person.name))
  })

  it('handles unmatched names and allows resetting from a matching result', async () => {
    const user = userEvent.setup()
    render(<App records={records} />)
    await user.type(screen.getByRole('searchbox'), 'not-a-faculty-member')
    expectResults([])
    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Department' }), 'Mathematics')
    expectResults(['Dr. Indira S'])
    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expectResults(faculty.map(person => person.name))
  })

  it('keeps the current results when submitting with the button or Enter', async () => {
    const user = userEvent.setup()
    render(<App records={records} />)
    await user.type(screen.getByRole('searchbox'), 'sadh{Enter}')
    expectResults(['Ms. Sadhvi'])
    await user.click(screen.getByRole('button', { name: 'Find faculty' }))
    expectResults(['Ms. Sadhvi'])
  })
})

describe('faculty profile navigation', () => {
  it.each(faculty)('opens the profile for $name from its card', async person => {
    const user = userEvent.setup()
    render(<App records={records} />)
    const action = screen.getByRole('link', { name: `View Profile for ${person.name}` })
    expect(action.getAttribute('href')).toBe(`#/faculty/${person.id}`)
    await user.click(action)
    await screen.findByRole('heading', { level: 1, name: person.name })
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.getByText(person.department, { selector: '.department-tag' })).toBeTruthy()
    expect(screen.queryByText('Designation not provided')).toBeNull()
    expect(within(screen.getByRole('region', { name: person.name })).getByText(person.initials)).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Faculty Avatar' })).toBeTruthy()
    expect(screen.getByText('3D demo avatar for prototype purposes.')).toBeTruthy()
    const location = screen.getByRole('heading', { name: 'Cabin location' }).parentElement
    for (const [label, value] of [['Building', person.building], ['Floor', person.floor], ['Cabin number', person.cabin]]) {
      const term = within(location).getByText(label, { selector: 'dt' })
      expect(term.nextElementSibling.textContent).toBe(value)
    }
    expect(screen.getByText('Fictional demonstration data.')).toBeTruthy()
    expect(document.title).toBe(`${person.name} | CampusConnect`)
    expect(screen.getByRole('region', { name: 'Faculty Schedule Checker' })).toBeTruthy()
    for (const title of ['Cabin Map — Coming Soon']) {
      const section = screen.getByRole('region', { name: title })
      expect(within(section).getByText('Unavailable preview')).toBeTruthy()
      expect(within(section).queryByRole('button')).toBeNull()
      expect(within(section).queryByRole('link')).toBeNull()
    }
  })

  it('preserves name and department filters when returning with the back action', async () => {
    const user = userEvent.setup()
    render(<App records={records} />)
    await user.type(screen.getByRole('searchbox'), 'MAH')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Department' }), 'Computer Science')
    await user.click(screen.getByRole('link', { name: 'View Profile for Mr. Mahesh H' }))
    await screen.findByRole('heading', { level: 1, name: 'Mr. Mahesh H' })
    await user.click(screen.getByRole('link', { name: 'Back to Faculty Directory' }))
    const search = await screen.findByRole('searchbox')
    expect(search.value).toBe('MAH')
    expect(screen.getByRole('combobox', { name: 'Department' }).value).toBe('Computer Science')
    expectResults(['Mr. Mahesh H'])
  })

  it('supports direct profile links and browser Back and Forward while preserving filters', async () => {
    const user = userEvent.setup()
    render(<App records={records} />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Department' }), 'Information Science')
    await user.type(screen.getByRole('searchbox'), 'haj')
    const action = screen.getByRole('link', { name: 'View Profile for Ms. Hajeera NK' })
    action.focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'Ms. Hajeera NK' })
    window.history.back()
    await waitFor(() => expect(screen.getByRole('searchbox').value).toBe('haj'))
    expect(screen.getByRole('combobox', { name: 'Department' }).value).toBe('Information Science')
    expectResults(['Ms. Hajeera NK'])
    window.history.forward()
    await screen.findByRole('heading', { level: 1, name: 'Ms. Hajeera NK' })

    // Remounting with the current URL simulates opening or refreshing a direct link.
    cleanup()
    render(<App records={records} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ms. Hajeera NK' })).toBeTruthy()
  })

  it('handles an unknown profile without showing the wrong faculty record', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/#/faculty/unknown')
    render(<App records={records} />)
    expect(screen.getByRole('heading', { name: 'Faculty not found' })).toBeTruthy()
    expect(screen.queryByText('Cabin number')).toBeNull()
    await user.click(screen.getByRole('link', { name: 'Back to Faculty Directory' }))
    await screen.findByRole('searchbox')
    expectResults(faculty.map(person => person.name))
  })
})
