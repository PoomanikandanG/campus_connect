import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)
const initial = { status: 'loading', user: null, account: null }
export function AuthProvider({ children, client = supabase }) {
  const [state, setState] = useState(client ? initial : { ...initial, status: 'unconfigured' })
  const sequence = useRef(0)
  useEffect(() => {
    if (!client) return undefined
    let alive = true
    async function refresh() {
      const version = ++sequence.current
      setState(initial)
      try {
        // Validate with Auth; never authorize from localStorage or editable metadata.
        const { data, error } = await client.auth.getUser()
        if (!alive || version !== sequence.current) return
        if (error || !data.user) {
          setState({ ...initial, status: error && error.name !== 'AuthSessionMissingError' ? 'error' : 'signed-out' })
          return
        }
        const { data: account, error: accountError } = await client.from('approved_accounts')
          .select('user_id,email,role,active,department').eq('user_id', data.user.id).maybeSingle()
        if (!alive || version !== sequence.current) return
        const approved = !accountError && account?.active && account.user_id === data.user.id &&
          account.email.toLowerCase() === data.user.email?.toLowerCase() && ['student', 'hod'].includes(account.role)
        setState({ status: approved ? 'authorized' : 'denied', user: data.user, account: approved ? account : null })
      } catch {
        if (alive && version === sequence.current) setState({ ...initial, status: 'error' })
      }
    }
    void refresh()
    // Defer database work out of Supabase's auth callback to avoid auth lock deadlocks.
    const { data: { subscription } } = client.auth.onAuthStateChange(() => { queueMicrotask(() => { if (alive) void refresh() }) })
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(onFocus, 60_000)
    return () => { alive = false; ++sequence.current; subscription.unsubscribe(); window.removeEventListener('focus', onFocus); window.clearInterval(timer) }
  }, [client])
  async function logout() {
    const { error } = await client.auth.signOut()
    if (error) throw error
    ++sequence.current
    setState({ ...initial, status: 'signed-out' })
  }
  return <AuthContext.Provider value={{ ...state, client, logout }}>{children}</AuthContext.Provider>
}
