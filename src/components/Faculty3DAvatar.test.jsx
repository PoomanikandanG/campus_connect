import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Faculty3DAvatar from './Faculty3DAvatar'

const { renderScene } = vi.hoisted(() => ({ renderScene: vi.fn() }))

vi.mock('./FacultyAvatarScene.jsx', () => ({ default: props => renderScene(props) }))

beforeEach(() => {
  renderScene.mockReset()
  renderScene.mockImplementation(() => <div data-testid="3d-scene"/>)
  vi.stubGlobal('WebGL2RenderingContext', function WebGL2RenderingContext() {})
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ getExtension: () => ({ loseContext: vi.fn() }) })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Faculty3DAvatar', () => {
  it('uses the supplied initials when WebGL is unavailable', () => {
    vi.stubGlobal('WebGL2RenderingContext', undefined)
    render(<Faculty3DAvatar initials="HN"/>)
    expect(screen.getByText('HN')).toBeTruthy()
    expect(screen.getByText('3D preview unavailable on this device.')).toBeTruthy()
    expect(screen.queryByTestId('3d-scene')).toBeNull()
  })

  it('handles a failed graphics capability check gracefully', () => {
    HTMLCanvasElement.prototype.getContext.mockImplementation(() => { throw new Error('GPU unavailable') })
    render(<Faculty3DAvatar initials="IS"/>)
    expect(screen.getByText('IS')).toBeTruthy()
    expect(screen.getByText('3D preview unavailable on this device.')).toBeTruthy()
  })

  it('loads the scene when WebGL is supported and keeps the prototype label visible', async () => {
    render(<Faculty3DAvatar initials="MH"/>)
    await screen.findByTestId('3d-scene')
    expect(screen.getByRole('heading', { name: 'Faculty Avatar' })).toBeTruthy()
    expect(screen.getByText('3D demo avatar for prototype purposes.')).toBeTruthy()
    expect(renderScene.mock.lastCall[0].reducedMotion).toBe(false)
  })

  it('passes reusable avatar configuration with defaults for omitted or invalid settings', async () => {
    const { rerender } = render(<Faculty3DAvatar initials="AR" config={{ suitColor: '#314d68', accentColor: 'invalid', idleAnimation: false }}/>)
    await screen.findByTestId('3d-scene')
    expect(renderScene.mock.lastCall[0].config).toMatchObject({ suitColor: '#314d68', accentColor: '#7198c9' })
    expect(renderScene.mock.lastCall[0].reducedMotion).toBe(true)
    rerender(<Faculty3DAvatar initials="AR" config={null}/>)
    await waitFor(() => expect(renderScene.mock.lastCall[0].reducedMotion).toBe(false))
    expect(renderScene.mock.lastCall[0].config.suitColor).toBe('#223e60')
  })

  it('shows initials if the 3D scene throws during rendering', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderScene.mockImplementation(() => { throw new Error('Canvas creation failed') })
    render(<Faculty3DAvatar initials="JM"/>)
    await screen.findByText('3D preview unavailable on this device.')
    expect(screen.getByText('JM')).toBeTruthy()
    expect(screen.queryByTestId('3d-scene')).toBeNull()
  })

  it('switches to the initials placeholder after a graphics context failure', async () => {
    const user = userEvent.setup()
    renderScene.mockImplementation(({ onUnavailable }) => <button onClick={onUnavailable}>Simulate context loss</button>)
    render(<Faculty3DAvatar initials="S"/>)
    await user.click(await screen.findByRole('button', { name: 'Simulate context loss' }))
    expect(screen.getByText('S')).toBeTruthy()
    expect(screen.getByText('3D preview unavailable on this device.')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('reacts to reduced-motion preferences and removes the listener on unmount', async () => {
    let onChange
    const preference = {
      matches: true,
      addEventListener: vi.fn((_, listener) => { onChange = listener }),
      removeEventListener: vi.fn(),
    }
    vi.stubGlobal('matchMedia', vi.fn(() => preference))
    const { unmount } = render(<Faculty3DAvatar initials="FC"/>)
    await screen.findByTestId('3d-scene')
    expect(renderScene.mock.lastCall[0].reducedMotion).toBe(true)
    act(() => { preference.matches = false; onChange() })
    await waitFor(() => expect(renderScene.mock.lastCall[0].reducedMotion).toBe(false))
    unmount()
    expect(preference.removeEventListener).toHaveBeenCalledWith('change', onChange)
  })
})
