// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { AccountPage } from './HodAppointments'
import App from '../App'
import { navigate } from '../hooks/useAppPath'

afterEach(() => { cleanup(); window.history.replaceState(null, '', '/') })
function mockClient(role = null, active = true) {
  let listener
  let user = role ? { id: 'user-1', email: 'person@example.edu' } : null
  const account = role ? { user_id: 'user-1', email: 'person@example.edu', role, active, department: 'CSE' } : null
  const query = { select: vi.fn(() => query), eq: vi.fn(() => query), maybeSingle: vi.fn(async () => ({ data: account, error: null })) }
  const client = {
    from: vi.fn(() => query),
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
      onAuthStateChange: vi.fn(callback => { listener = callback; return { data: { subscription: { unsubscribe: vi.fn() } } } }),
      signInWithOtp: vi.fn(async () => ({ error: null })),
      verifyOtp: vi.fn(async () => { user = { id: 'user-1', email: 'person@example.edu' }; listener('SIGNED_IN'); return { error: null } }),
      signOut: vi.fn(async () => { user = null; listener('SIGNED_OUT'); return { error: null } }),
    },
  }
  return { client, query, setUser: next => { user = next }, notify: () => listener('SIGNED_IN') }
}
function page(client, path = '/login') { return render(<AuthProvider client={client}><AccountPage path={path}/></AuthProvider>) }

describe('HOD appointments foundation', () => {
  it('navigates from the public directory to introduction and unconfigured login', async () => {
    render(<App/>)
    fireEvent.click(screen.getAllByRole('link', { name: /HOD Appointments/ })[0])
    expect(screen.getByRole('heading', { name: /Meet Your HOD/ })).toBeTruthy()
    expect(window.location.pathname).toBe('/hod-appointments')
    act(() => navigate('/login'))
    expect(screen.getByText('Configuration required')).toBeTruthy()
    expect(window.location.pathname).toBe('/login')
    fireEvent.click(screen.getByRole('link', { name: 'Faculty directory' }))
    expect(screen.getByRole('search')).toBeTruthy()
  })
  it('shows loading until the session check completes', async () => {
    const { client } = mockClient()
    let resolve
    client.auth.getUser.mockImplementation(() => new Promise(done => { resolve = done }))
    page(client)
    expect(screen.getByText('Checking your account?')).toBeTruthy()
    await act(async () => resolve({ data: { user: null }, error: null }))
    expect(screen.getByLabelText('Email')).toBeTruthy()
  })
  it('requests OTP without creating users, verifies inbox ownership and redirects by backend role', async () => {
    const { client, setUser } = mockClient('student')
    setUser(null)
    page(client)
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'person@example.edu' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send verification code' }))
    fireEvent.change(await screen.findByLabelText('Six-digit verification code'), { target: { value: '123456' } })
    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'person@example.edu', options: { shouldCreateUser: false } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify and continue' }))
    await screen.findByRole('heading', { name: /Welcome to your student/ })
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({ email: 'person@example.edu', token: '123456', type: 'email' })
    expect(window.location.pathname).toBe('/student')
  })
  it('handles OTP send and expired verification failures', async () => {
    const { client } = mockClient()
    client.auth.signInWithOtp.mockResolvedValueOnce({ error: new Error('rate limited') })
    page(client)
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'person@example.edu' } })
    fireEvent.click(screen.getByText('Send verification code'))
    expect(await screen.findByRole('alert')).toBeTruthy()
    fireEvent.click(screen.getByText('Send verification code'))
    fireEvent.change(await screen.findByLabelText('Six-digit verification code'), { target: { value: '123456' } })
    client.auth.verifyOtp.mockResolvedValueOnce({ error: new Error('expired') })
    fireEvent.click(screen.getByText('Verify and continue'))
    expect((await screen.findByRole('alert')).textContent).toContain('invalid or expired')
  })
  it.each(['student', 'hod'])('restores an approved %s session', async role => {
    const { client } = mockClient(role)
    page(client, `/${role}`)
    expect(await screen.findByRole('heading', { name: new RegExp(`Welcome to your ${role === 'hod' ? 'HOD' : 'student'}`) })).toBeTruthy()
    expect(screen.getByText('person@example.edu')).toBeTruthy()
    if (role === 'hod') expect(screen.getByText('Department: CSE')).toBeTruthy()
  })
  it.each([['student', true, '/hod'], ['hod', true, '/student'], ['student', false, '/student'], ['admin', true, '/hod']])('denies %s with active=%s at %s', async (role, active, path) => {
    page(mockClient(role, active).client, path)
    expect(await screen.findByRole('heading', { name: 'Access Denied' })).toBeTruthy()
    expect(screen.queryByText(/Welcome to your/)).toBeNull()
  })
  it('denies a verified identity without an approval record', async () => {
    const { client, setUser } = mockClient()
    setUser({ id: 'unknown', email: 'unknown@example.edu', user_metadata: { role: 'hod' } })
    page(client, '/hod')
    expect(await screen.findByText('Access Denied')).toBeTruthy()
  })
  it('fails closed on account lookup errors and rechecks revocation on focus', async () => {
    const { client, query } = mockClient('hod')
    page(client, '/hod')
    await screen.findByText('Department: CSE')
    query.maybeSingle.mockResolvedValue({ data: null, error: new Error('denied') })
    fireEvent(window, new Event('focus'))
    expect(await screen.findByText('Access Denied')).toBeTruthy()
  })
  it('handles Auth network failures without exposing a dashboard', async () => {
    const { client } = mockClient('hod')
    client.auth.getUser.mockRejectedValue(new Error('offline'))
    page(client, '/hod')
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByText('Department: CSE')).toBeNull()
  })
  it('shows loading while sending a code and prevents duplicate submission', async () => {
    const { client } = mockClient()
    let resolve
    client.auth.signInWithOtp.mockImplementation(() => new Promise(done => { resolve = done }))
    page(client)
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'person@example.edu' } })
    fireEvent.click(screen.getByText('Send verification code'))
    expect(screen.getByRole('button', { name: 'Please wait?' }).disabled).toBe(true)
    await act(async () => resolve({ error: null }))
    expect(screen.getByLabelText('Six-digit verification code')).toBeTruthy()
  })
  it('offers retry when logout fails', async () => {
    const { client } = mockClient('student')
    client.auth.signOut.mockResolvedValueOnce({ error: new Error('offline') })
    page(client, '/student')
    fireEvent.click(await screen.findByRole('button', { name: 'Logout' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Sign-out could not be completed')
    expect(screen.getByRole('button', { name: 'Logout' }).disabled).toBe(false)
  })
  it('signs out and removes the dashboard', async () => {
    const { client } = mockClient('student')
    page(client, '/student')
    fireEvent.click(await screen.findByRole('button', { name: 'Logout' }))
    await waitFor(() => expect(client.auth.signOut).toHaveBeenCalled())
    await screen.findByText('Sign in required')
    expect(screen.queryByText('person@example.edu')).toBeNull()
  })
})
