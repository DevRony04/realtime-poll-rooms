import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
// import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const { pollId } = params

    const pollResult = await db.query('SELECT * FROM "Poll" WHERE id = $1', [pollId])
    const poll = pollResult.rows[0]

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    const optionsResult = await db.query(`
      SELECT o.*, COUNT(v.id)::int as votes 
      FROM "Option" o 
      LEFT JOIN "Vote" v ON v."optionId" = o.id 
      WHERE o."pollId" = $1 
      GROUP BY o.id 
      ORDER BY o.position ASC
    `, [pollId])

    const options = optionsResult.rows
    const totalVotes = options.reduce((acc, opt) => acc + opt.votes, 0)

    // Transform data to include vote counts
    const pollWithResults = {
      ...poll,
      totalVotes,
      options,
    }

    return NextResponse.json(pollWithResults)
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json(
      { error: 'Failed to fetch poll' },
      { status: 500 }
    )
  }
}
