import { Pool, QueryResult, QueryResultRow } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

export const db = {
    query: <T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
        return pool.query<T>(text, params)
    },
    getClient: () => pool.connect(),
}
