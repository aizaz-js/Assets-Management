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
		// We use onAuthStateChange to capture the session as soon as the Supabase client
		// processes the access_token from the URL fragment.
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === 'SIGNED_IN' && session) {
				try {
					const email = session.user.email ?? '';
					const allowedDomain =
						import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'cogentlabs.co';

					// Step 1: Strict Domain Verification
					if (!email.endsWith('@' + allowedDomain)) {
						await supabase.auth.signOut();
						navigate('/login?error=wrong_domain', { replace: true });
						return;
					}

					// Step 2: Fetch Profile
					// We query by ID (primary) and fall back to email if necessary
					let { data: profile, error } = await supabase
						.from('profiles')
						.select('role, status')
						.eq('id', session.user.id)
						.maybeSingle();

					// Step 3: Handle race condition for new users
					// If profile isn't found immediately (trigger delay), retry once after a short delay
					if (!profile) {
						await new Promise((resolve) => setTimeout(resolve, 1500));
						const { data: retryProfile } = await supabase
							.from('profiles')
							.select('role, status')
							.eq('id', session.user.id)
							.maybeSingle();
						profile = retryProfile;
					}

					// Step 4: Role-Based Access Control
					// Only users with the 'admin' role are permitted
					if (!profile || profile.role !== 'admin') {
						await supabase.auth.signOut();
						navigate('/login?error=not_admin', { replace: true });
						return;
					}

					// Success: Redirect to the assets dashboard
					navigate('/assets', { replace: true });
				} catch (err) {
					console.error('Auth Callback Error:', err);
					navigate('/login?error=auth', { replace: true });
				}
			}

			// Fallback: If after a few seconds no session is found and no token is in the URL
			else if (event === 'INITIAL_SESSION' && !session) {
				const timeout = setTimeout(() => {
					if (!window.location.hash.includes('access_token')) {
						navigate('/login?error=no_session', { replace: true });
					}
				}, 3000);
				return () => clearTimeout(timeout);
			}
		});

		return () => {
			subscription.unsubscribe();
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
