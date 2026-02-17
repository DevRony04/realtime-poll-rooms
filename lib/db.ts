import { Pool, QueryResult, QueryResultRow } from 'pg'

function shouldForceSsl(connectionString: string | undefined) {
  if (!connectionString) return false
  // Supabase Postgres requires SSL; allow "sslmode=require" too.
  return (
    connectionString.includes('.supabase.co') ||
    connectionString.includes('sslmode=require') ||
    connectionString.includes('sslmode=verify-full') ||
    process.env.PGSSLMODE === 'require'
  )
}

declare global {
  // eslint-disable-next-line no-var
  var __poll_rooms_pg_pool__: Pool | undefined
}

function getPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable')
  }

  const ssl = shouldForceSsl(connectionString)
    ? { rejectUnauthorized: false }
    : undefined

  // In Next.js dev, hot-reloading can recreate modules; keep a single pool.
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__poll_rooms_pg_pool__ ||= new Pool({
      connectionString,
      ssl,
    })
    return globalThis.__poll_rooms_pg_pool__
  }

  return new Pool({
    connectionString,
    ssl,
  })
}

const pool = getPool()

export const db = {
  query: <T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> => {
    return pool.query<T>(text, params)
  },
  getClient: () => pool.connect(),
}
