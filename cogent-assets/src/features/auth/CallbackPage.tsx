import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/constants'
import { Spinner } from '@/components/ui/Spinner'

export function CallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          navigate('/login?error=auth', { replace: true })
          return
        }

        const session = data.session
        const email = session?.user?.email

        if (!email?.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
          await supabase.auth.signOut()
          navigate('/login?error=domain', { replace: true })
          return
        }

        // Check that the user has admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session!.user.id)
          .single()

        if (!profile || profile.role !== 'admin') {
          await supabase.auth.signOut()
          navigate('/login?error=access_denied', { replace: true })
          return
        }

        navigate('/assets', { replace: true })
      } catch {
        navigate('/login?error=auth', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="text-[var(--color-primary)] mx-auto" />
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Signing you in...</p>
      </div>
    </div>
  )
}
