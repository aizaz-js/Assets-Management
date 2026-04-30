import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';

/**
 * CallbackPage handles the logic after a successful Google OAuth redirect.
 * It ensures the session is established, checks the email domain,
 * and verifies that the user has an 'admin' role before allowing access.
 */
export function CallbackPage() {
	const navigate = useNavigate();

	useEffect(() => {
		let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === 'SIGNED_IN' && session) {
				// Cancel the fallback timer — we have a valid session
				if (fallbackTimeout) {
					clearTimeout(fallbackTimeout);
					fallbackTimeout = null;
				}

				try {
					const email = session.user.email ?? '';
					const allowedDomain =
						import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'cogentlabs.co';

					if (!email.endsWith('@' + allowedDomain)) {
						await supabase.auth.signOut();
						navigate('/login?error=wrong_domain', { replace: true });
						return;
					}

					let { data: profile } = await supabase
						.from('profiles')
						.select('role, status')
						.eq('id', session.user.id)
						.maybeSingle();

					if (!profile) {
						await new Promise((resolve) => setTimeout(resolve, 1500));
						const { data: retryProfile } = await supabase
							.from('profiles')
							.select('role, status')
							.eq('id', session.user.id)
							.maybeSingle();
						profile = retryProfile;
					}

					if (!profile || profile.role !== 'admin') {
						await supabase.auth.signOut();
						navigate('/login?error=not_admin', { replace: true });
						return;
					}

					navigate('/assets', { replace: true });
				} catch (err) {
					console.error('Auth Callback Error:', err);
					navigate('/login?error=auth', { replace: true });
				}
			} else if (event === 'INITIAL_SESSION' && !session) {
				// No existing session on load — start a fallback timer in case
				// the OAuth redirect never completes (e.g. user closed the popup)
				fallbackTimeout = setTimeout(() => {
					navigate('/login?error=no_session', { replace: true });
				}, 5000);
			}
		});

		return () => {
			subscription.unsubscribe();
			if (fallbackTimeout) clearTimeout(fallbackTimeout);
		};
	}, [navigate]);

	return (
		<div className='min-h-screen bg-[var(--color-bg)] flex items-center justify-center'>
			<div className='text-center'>
				<Spinner size='lg' className='text-[var(--color-primary)] mx-auto' />
				<p className='mt-4 text-sm text-[var(--color-text-secondary)] font-medium'>
					Verifying credentials...
				</p>
			</div>
		</div>
	);
}
