import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="card max-w-md text-center">
        <ShieldOff className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
        <h1 className="page-title mb-2">Access Denied</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          You don't have permission to view this page.
        </p>
        <Button onClick={() => navigate('/assets')}>Go to Assets</Button>
      </div>
    </div>
  )
}
