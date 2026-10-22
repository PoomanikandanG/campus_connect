import { useEffect, useState } from 'react'

// Hash routes support direct profile links and browser Back/Forward without
// requiring server-side routing. Directory filter state stays in App.
export function useFacultyRoute() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const updateRoute = () => setHash(window.location.hash)
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  if (!hash.startsWith('#/faculty/')) return null
  try {
    return decodeURIComponent(hash.slice('#/faculty/'.length))
  } catch {
    return '' // Malformed URLs use the same friendly not-found view.
  }
}
