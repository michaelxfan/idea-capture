import { createClient } from '@/lib/supabase/server'
import { Dashboard } from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = createClient()

  const [
    { data: config },
    { data: rocks },
    { data: tactics },
    { data: milestones },
  ] = await Promise.all([
    supabase.from('config').select('*').eq('id', 1).single(),
    supabase.from('big_rocks').select('*').order('position'),
    supabase.from('tactics').select('*').order('position'),
    supabase.from('milestones').select('*').order('position'),
  ])

  if (!config || !rocks) {
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui', maxWidth: 640 }}>
        <h2>Database not initialized</h2>
        <p>
          Run <code>supabase/migrations/0001_init.sql</code> and{' '}
          <code>supabase/migrations/0002_public_access.sql</code> in your
          Supabase SQL Editor, then reload this page.
        </p>
      </div>
    )
  }

  const rocksWithChildren = rocks.map((r: any) => ({
    ...r,
    tactics: (tactics ?? []).filter((t: any) => t.big_rock_id === r.id),
    milestones: (milestones ?? []).filter((m: any) => m.big_rock_id === r.id),
  }))

  return <Dashboard config={config as any} rocks={rocksWithChildren as any} />
}
