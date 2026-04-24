import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/Spinner'

export function CallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          navigate('/login?error=no_session', { replace: true })
          return
        }

        const email = session.user.email ?? ''
        const allowedDomain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'cogentlabs.co'

        // Step 1: Domain check
        if (!email.endsWith('@' + allowedDomain)) {
          await supabase.auth.signOut()
          navigate('/login?error=wrong_domain', { replace: true })
          return
        }

        // Step 2: Wait for the handle_new_user trigger to create the profile
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Step 3: Look up profile by auth user id
        const { data: profileById } = await supabase
          .from('profiles')
          .select('id, role, status')
          .eq('id', session.user.id)
          .maybeSingle()

        // Step 4: If not found by id, try matching by email (manually-created profiles)
        let resolvedProfile = profileById
        if (!resolvedProfile) {
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('id, role, status')
            .eq('email', email)
            .maybeSingle()
          resolvedProfile = profileByEmail
        }

        // Step 5: Only admins can access the portal
        if (!resolvedProfile || resolvedProfile.role !== 'admin') {
          await supabase.auth.signOut()
          navigate('/login?error=not_admin', { replace: true })
          return
        }

        navigate('/assets', { replace: true })
      } catch {
        navigate('/login?error=no_session', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="text-[var(--color-primary)] mx-auto" />
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Signing you in…</p>
      </div>
    </div>
  )
}
