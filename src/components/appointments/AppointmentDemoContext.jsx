import { demoStudents, hodDemo } from '../../data/hodDemo'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { applyAppointmentAction, emptyAppointments } from '../../utils/appointmentUtils'
import { APPOINTMENT_STORAGE_KEY, loadAppointments, saveAppointments } from '../../utils/appointmentStorage'
const Context = createContext(null)
export const useAppointmentDemo = () => useContext(Context)
export function AppointmentDemoProvider({ children }) {
  const [initial] = useState(() => {
    try { return loadAppointments() } catch { return { state: { version: 1, requests: [], blockedSlots: [] }, warning: 'Browser storage is unavailable. Demo changes will last only in this tab.' } }
  })
  const [state, setState] = useState(initial.state)
  const [studentId, setStudentId] = useState(demoStudents[0].id)
  const [hodId, setHodId] = useState(hodDemo[0].id)
  const [clock, setClock] = useState(Date.now())
  const current = useRef(initial.state)
  const [warning, setWarning] = useState(initial.warning)
  const [needsReset, setNeedsReset] = useState(initial.warning.includes('saved copy'))
  const [storageHealthy, setStorageHealthy] = useState(!initial.warning)
  useEffect(() => {
    const sync = event => {
      if (event.key !== APPOINTMENT_STORAGE_KEY && event.key !== null) return
      const loaded = loadAppointments()
      current.current = loaded.state
      setState(loaded.state)
      setWarning(loaded.warning)
      setNeedsReset(loaded.warning.includes('saved copy'))
    }
    window.addEventListener('storage', sync)
    const timer = window.setInterval(() => setClock(Date.now()), 60_000)
    return () => { window.removeEventListener('storage', sync); window.clearInterval(timer) }
  }, [])
  function reset() {
    const next = emptyAppointments()
    current.current = next
    setState(next)
    setNeedsReset(false)
    let warning
    try { warning = saveAppointments(next) } catch { warning = 'Browser storage is unavailable. Changes will last only in this tab.' }
    setWarning(warning)
    setStorageHealthy(!warning)
  }
  function dispatch(action) {
    if (needsReset) return { error: 'Reset demo data to start fresh before saving new requests.' }
    // Re-read healthy storage to catch sequential changes from another demo tab.
    let base = current.current
    if (storageHealthy) {
      try {
        const loaded = loadAppointments()
        if (loaded.warning) { setWarning(loaded.warning); setNeedsReset(loaded.warning.includes('saved copy')); setStorageHealthy(false); return { error: 'Saved data changed unexpectedly. Refresh and review the storage warning before continuing.' } }
        base = loaded.state
      } catch { setStorageHealthy(false) }
    }
    try {
      const next = applyAppointmentAction(base, action)
      current.current = next
      setState(next)
      let message
      try { message = saveAppointments(next) } catch { message = 'Browser storage is unavailable. Changes will last only in this tab.' }
      setWarning(message)
      setStorageHealthy(!message)
      return { error: null }
    } catch (error) { return { error: error.message } }
  }
  return <Context.Provider value={{ state, warning, dispatch, reset, studentId, setStudentId, hodId, setHodId, clock }}>{children}</Context.Provider>
}
