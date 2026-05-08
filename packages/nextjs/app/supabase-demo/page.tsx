import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: markets } = await supabase.from('markets').select('*').limit(10)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Migrated Markets</h1>
      <ul className="list-disc pl-5">
        {markets?.map((market) => (
          <li key={market.market_id}>
            <strong>{market.title}</strong> ({market.category}) - {market.status}
          </li>
        ))}
      </ul>
      {(!markets || markets.length === 0) && <p>No markets found. Check the migration logs.</p>}
    </div>
  )
}
