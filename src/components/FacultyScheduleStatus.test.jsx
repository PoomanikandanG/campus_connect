import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FacultyScheduleStatus from './FacultyScheduleStatus'
import { faculty } from '../data/faculty'
import { timetable } from '../data/timetable'
import { normalizeFaculty } from '../utils/faculty'
import App from '../App'
import FacultyProfile from './FacultyProfile'

const mahesh = normalizeFaculty(faculty.find(person => person.id === 'mahesh-h'))
const demoLabel = 'Demo timetable — not actual faculty location.'
const availabilityLabel = 'Actual faculty availability and location are not confirmed.'
const morning = timetable.find(session => session.id === 'demo-mahesh-h-01')

beforeEach(() => {
  // 09:00 Monday in Kolkata, regardless of the machine/browser timezone.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-19T03:30:00Z'))
  window.history.replaceState(null, '', '/')
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const setupUser = () => userEvent.setup()
const checker = () => screen.getByRole('region', { name: 'Faculty Schedule Checker' })
function selectTime(time) {
  const [hours, minutes] = time.split(':')
  fireEvent.change(screen.getByLabelText('Hour'), { target: { value: String(Number(hours) % 12 || 12) } })
  fireEvent.change(screen.getByLabelText('Minute'), { target: { value: minutes } })
  fireEvent.change(screen.getByLabelText('AM/PM'), { target: { value: Number(hours) >= 12 ? 'PM' : 'AM' } })
}
function expectField(label, expected) {
  expect(within(checker()).getByText(label, { selector: 'dt' }).nextElementSibling.textContent).toBe(String(expected))
}

describe('FacultyScheduleStatus', () => {
  it.each([
    ['2026-10-19T03:30:00Z', '9', '00', 'AM'],
    ['2026-10-19T09:00:00Z', '2', '30', 'PM'],
    ['2026-10-18T18:30:00Z', '12', '00', 'AM'],
    ['2026-10-19T06:30:00Z', '12', '00', 'PM'],
  ])('initializes the selector from Kolkata time at %s', async (date, hour, minute, period) => {
    vi.setSystemTime(new Date(date))
    render(<FacultyScheduleStatus faculty={mahesh}/>)
    await setupUser().click(screen.getByRole('button', { name: 'Check another time' }))
    expect(screen.getByLabelText('Hour').value).toBe(hour)
    expect(screen.getByLabelText('Minute').value).toBe(minute)
    expect(screen.getByLabelText('AM/PM').value).toBe(period)
  })

  it.each(['09:00', '14:30', '00:00', '12:00'])('converts the selector to %s for schedule lookup', async time => {
    const hours = Number(time.slice(0, 2))
    const session = { ...morning, startTime: time, endTime: `${String(hours + 1).padStart(2, '0')}:${time.slice(3)}` }
    render(<FacultyScheduleStatus faculty={mahesh} sessions={[session]}/>)
    const user = setupUser()
    await user.click(screen.getByRole('button', { name: 'Check another time' }))
    await user.selectOptions(screen.getByLabelText('Hour'), String(hours % 12 || 12))
    await user.selectOptions(screen.getByLabelText('Minute'), time.slice(3))
    await user.selectOptions(screen.getByLabelText('AM/PM'), hours >= 12 ? 'PM' : 'AM')
    expect(screen.getByText(`Selected time: Monday, ${time}`, { exact: false })).toBeTruthy()
    expectField('Classroom', session.classroom)
    screen.getByLabelText('Hour').focus()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByLabelText('Minute'))
    await user.tab()
    expect(document.activeElement).toBe(screen.getByLabelText('AM/PM'))
  })

  it('automatically checks Kolkata time and displays the scheduled lecture details with clear demo labels', () => {
    render(<FacultyScheduleStatus faculty={mahesh}/>)
    expect(screen.getByText(/Current time: Monday, 09:00/)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Scheduled to teach' })).toBeTruthy()
    expectField('Department', morning.department)
    expectField('Semester', morning.semester)
    expectField('Section', morning.section)
    expectField('Subject', morning.subject)
    expectField('Classroom', morning.classroom)
    expectField('Scheduled time', '08:30 – 09:30')
    expect(screen.getByText(demoLabel)).toBeTruthy()
    expect(screen.getByText(availabilityLabel)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('shows no class during lunch, the known permanent cabin, and no availability claim', () => {
    vi.setSystemTime(new Date('2026-10-19T07:30:00Z')) // 13:00 IST
    render(<FacultyScheduleStatus faculty={mahesh}/>)
    expect(screen.getByRole('heading', { name: 'No class scheduled at this time' })).toBeTruthy()
    expect(screen.getByText('Permanent cabin: G09 · Ground Floor')).toBeTruthy()
    expect(screen.getByText(availabilityLabel)).toBeTruthy()
    expect(screen.getByText(demoLabel)).toBeTruthy()
    expect(screen.queryByText('Scheduled to teach')).toBeNull()
  })

  it('distinguishes timetable unavailable from no class scheduled and retains known cabin details', () => {
    render(<FacultyScheduleStatus faculty={{ ...mahesh, id: 'new-faculty' }}/>)
    expect(screen.getByRole('heading', { name: 'Schedule information unavailable' })).toBeTruthy()
    expect(screen.queryByText('No class scheduled at this time')).toBeNull()
    expect(screen.getByText('Permanent cabin: G09 · Ground Floor')).toBeTruthy()
    expect(screen.getByText(availabilityLabel)).toBeTruthy()
  })

  it('handles missing timetable data and missing cabin details without displaying placeholders as locations', () => {
    const { rerender } = render(<FacultyScheduleStatus faculty={{ id: 'no-data', cabin: null }} sessions={null}/>)
    expect(screen.getByRole('heading', { name: 'Schedule information unavailable' })).toBeTruthy()
    expect(screen.queryByText(/Permanent cabin:/)).toBeNull()
    rerender(<FacultyScheduleStatus faculty={{ ...mahesh, cabin: 'Not provided' }} sessions={[]}/>)
    expect(screen.queryByText(/Permanent cabin:/)).toBeNull()
    expect(screen.getByText(demoLabel)).toBeTruthy()
  })

  it('updates immediately when the selected day or time changes, including Sunday and exact boundaries', async () => {
    const user = setupUser()
    render(<FacultyScheduleStatus faculty={mahesh}/>)
    await user.click(screen.getByRole('button', { name: 'Check another time' }))
    const day = screen.getByLabelText('Day')
    await user.selectOptions(day, 'Sunday')
    expect(screen.getByText('No class scheduled at this time')).toBeTruthy()
    await user.selectOptions(day, 'Monday')
    expect(screen.getByText('Scheduled to teach')).toBeTruthy()
    selectTime('10:00')
    expectField('Scheduled time', '09:30 – 10:30')
    expectField('Department', 'CSE')
    selectTime('13:00')
    expect(screen.getByText('No class scheduled at this time')).toBeTruthy()
    selectTime('09:00')
    expectField('Scheduled time', '08:30 – 09:30')
    selectTime('08:29')
    expect(screen.getByText('No class scheduled at this time')).toBeTruthy()
  })

  it('resets manual selections to the fresh current Kolkata day and time', async () => {
    const user = setupUser()
    render(<FacultyScheduleStatus faculty={mahesh}/>)
    await user.click(screen.getByRole('button', { name: 'Check another time' }))
    await user.selectOptions(screen.getByLabelText('Day'), 'Saturday')
    selectTime('12:00')
    vi.setSystemTime(new Date('2026-10-19T04:45:00Z')) // 10:15 IST
    await user.click(screen.getByRole('button', { name: 'Check current time' }))
    expect(screen.queryByLabelText('Day')).toBeNull()
    expect(screen.getByText(/Current time: Monday, 10:15/)).toBeTruthy()
    expectField('Scheduled time', '09:30 – 10:30')
    expect(screen.getByRole('button', { name: 'Check another time' })).toBeTruthy()
  })

  it('updates current-time results at a minute boundary but leaves manual checks fixed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T03:59:59Z')) // 09:29:59 IST
    const { unmount } = render(<FacultyScheduleStatus faculty={mahesh}/>)
    expectField('Scheduled time', '08:30 – 09:30')
    act(() => vi.advanceTimersByTime(1000))
    expectField('Scheduled time', '09:30 – 10:30')
    fireEvent.click(screen.getByRole('button', { name: 'Check another time' }))
    const selected = screen.getByLabelText('Minute').value
    act(() => vi.advanceTimersByTime(120_000))
    expect(screen.getByLabelText('Minute').value).toBe(selected)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shows a laboratory session throughout its second hour and excludes its end time', async () => {
    const lab = timetable.find(session => session.sessionType === 'lab')
    const person = normalizeFaculty(faculty.find(record => record.id === lab.facultyId))
    const user = setupUser()
    render(<FacultyScheduleStatus faculty={person}/>)
    await user.click(screen.getByRole('button', { name: 'Check another time' }))
    await user.selectOptions(screen.getByLabelText('Day'), lab.day)
    const secondHour = `${String(Number(lab.startTime.slice(0, 2)) + 1).padStart(2, '0')}:${lab.startTime.slice(3)}`
    selectTime(secondHour)
    expectField('Laboratory', lab.classroom)
    expectField('Scheduled time', `${lab.startTime} – ${lab.endTime}`)
    selectTime(lab.endTime)
    expect(screen.queryByText(`${lab.startTime} – ${lab.endTime}`)).toBeNull()
  })

  it('uses the stable faculty ID even if another teacher has the same name', () => {
    render(<FacultyScheduleStatus faculty={{ ...mahesh, id: 'another-id', name: mahesh.name }}/>)
    expect(screen.getByText('Schedule information unavailable')).toBeTruthy()
  })

  it('reports no class during the morning and lunch breaks', async () => {
    const user = setupUser()
    render(<FacultyScheduleStatus faculty={mahesh}/>)
    await user.click(screen.getByRole('button', { name: 'Check another time' }))
    for (const time of ['10:30', '10:44', '12:45', '13:29']) {
      selectTime(time)
      expect(screen.getByText('No class scheduled at this time')).toBeTruthy()
    }
  })

  it('shows the final 16:30–17:30 class until its exact end boundary', async () => {
    const lastPeriod = timetable.find(session => session.startTime === '16:30')
    const person = normalizeFaculty(faculty.find(record => record.id === lastPeriod.facultyId))
    const user = setupUser()
    render(<FacultyScheduleStatus faculty={person}/>)
    await user.click(screen.getByRole('button', { name: 'Check another time' }))
    await user.selectOptions(screen.getByLabelText('Day'), lastPeriod.day)
    selectTime('17:29')
    expectField('Scheduled time', '16:30 – 17:30')
    selectTime('17:30')
    expect(screen.getByText('No class scheduled at this time')).toBeTruthy()
  })

  it('integrates with a direct faculty profile without replacing the cabin or avatar', () => {
    window.history.replaceState(null, '', '/#/faculty/mahesh-h')
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: mahesh.name })).toBeTruthy()
    expect(checker()).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Faculty Avatar' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Cabin location' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to Faculty Directory' })).toBeTruthy()
  })

  it('resets manual time when navigating to another faculty profile', async () => {
    const user = setupUser()
    const { rerender } = render(<FacultyProfile faculty={mahesh}/>)
    await user.click(screen.getByRole('button', { name: 'Check another time' }))
    await user.selectOptions(screen.getByLabelText('Day'), 'Sunday')
    expect(screen.getByText('No class scheduled at this time')).toBeTruthy()
    const hajeera = normalizeFaculty(faculty.find(person => person.id === 'hajeera-nk'))
    rerender(<FacultyProfile faculty={hajeera}/>)
    expect(screen.getByText(/Current time: Monday, 09:00/)).toBeTruthy()
    expect(screen.queryByLabelText('Day')).toBeNull()
    expectField('Subject', hajeera.subjects[0])
  })
})
