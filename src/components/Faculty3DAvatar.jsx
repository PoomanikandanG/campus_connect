import { Component, Suspense, lazy, useCallback, useEffect, useState } from 'react'
import './Faculty3DAvatar.css'
import { normalizeAvatarConfig } from '../utils/faculty'

// Keep Three.js out of the directory's initial bundle.
const FacultyAvatarScene = lazy(() => import('./FacultyAvatarScene.jsx'))

function InitialsFallback({ initials, loading = false }) {
  return <div className="faculty-3d-fallback" role="status">
    <span className="faculty-3d-initials" aria-hidden="true">{initials}</span>
    <span>{loading ? 'Loading 3D avatar…' : '3D preview unavailable on this device.'}</span>
  </div>
}

class AvatarErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function supportsWebGL() {
  if (typeof window.WebGL2RenderingContext === 'undefined') return false
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export default function Faculty3DAvatar({ initials = 'FC', config }) {
  const avatarConfig = normalizeAvatarConfig(config)
  const [supported, setSupported] = useState(null)
  const [unavailable, setUnavailable] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const handleUnavailable = useCallback(() => setUnavailable(true), [])

  useEffect(() => {
    setSupported(supportsWebGL())
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!preference) return
    const updatePreference = () => setReducedMotion(preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  const fallback = <InitialsFallback initials={initials}/>

  return <section className="faculty-3d-card" aria-label="Faculty Avatar">
    <div className="faculty-3d-heading"><p className="section-kicker">A CAMPUSCONNECT PROTOTYPE</p><h2>Faculty Avatar</h2></div>
    <div className="faculty-3d-stage">
      {supported === null ? <InitialsFallback initials={initials} loading/> :
        !supported || unavailable ? fallback :
          <AvatarErrorBoundary fallback={fallback}>
            <Suspense fallback={<InitialsFallback initials={initials} loading/>}>
              <FacultyAvatarScene config={avatarConfig} reducedMotion={reducedMotion || !avatarConfig.idleAnimation} onUnavailable={handleUnavailable} fallback={fallback}/>
            </Suspense>
          </AvatarErrorBoundary>}
    </div>
    <p className="faculty-3d-caption">3D demo avatar for prototype purposes.</p>
    <p className="faculty-3d-hint">Generic character · No resemblance to actual faculty</p>
  </section>
}
