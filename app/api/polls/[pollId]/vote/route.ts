import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
// import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher-server'
import { getClientIp, getUserAgent } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const { pollId } = params
    const body = await request.json()
    const { optionId, fingerprint } = body

    // Validation
    if (!optionId) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      )
    }

    // Verify poll and option exist
    const optionResult = await db.query(
      'SELECT id FROM "Option" WHERE id = $1 AND "pollId" = $2',
      [optionId, pollId]
    )

    if (optionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid poll or option' },
        { status: 404 }
      )
    }

    // ANTI-ABUSE MECHANISM #1: IP-based rate limiting
    const ipAddress = getClientIp(request)

    // ANTI-ABUSE MECHANISM #2: Browser fingerprinting
    const userAgent = getUserAgent(request)

    // Check if user has already voted based on IP
    if (ipAddress) {
      const existingIpVoteResult = await db.query(
        'SELECT id FROM "Vote" WHERE "pollId" = $1 AND "ipAddress" = $2',
        [pollId, ipAddress]
      )

      if (existingIpVoteResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'You have already voted in this poll' },
          { status: 409 }
        )
      }
    }

    // Check if user has already voted based on fingerprint
    if (fingerprint) {
      const existingFingerprintVoteResult = await db.query(
        'SELECT id FROM "Vote" WHERE "pollId" = $1 AND "fingerprint" = $2',
        [pollId, fingerprint]
      )

      if (existingFingerprintVoteResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'You have already voted in this poll' },
          { status: 409 }
        )
      }
    }

    // Create vote
    await db.query(
      'INSERT INTO "Vote" ("pollId", "optionId", "ipAddress", "fingerprint", "userAgent", "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
      [pollId, optionId, ipAddress || null, fingerprint || null, userAgent || null]
    )

    // Get updated poll results
    const pollResult = await db.query('SELECT * FROM "Poll" WHERE id = $1', [pollId])
    const updatedPoll = pollResult.rows[0]

    if (!updatedPoll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Get options with vote counts
    const optionsResult = await db.query(`
      SELECT o.*, COUNT(v.id)::int as votes 
      FROM "Option" o 
      LEFT JOIN "Vote" v ON v."optionId" = o.id 
      WHERE o."pollId" = $1 
      GROUP BY o.id 
      ORDER BY o.position ASC
    `, [pollId])

    const options = optionsResult.rows
    const totalVotes = options.reduce((acc: number, opt: any) => acc + opt.votes, 0)

    // Transform data
    const pollWithResults = {
      ...updatedPoll,
      totalVotes,
      options: options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        position: opt.position,
        votes: opt.votes,
      })),
    }

    // Trigger real-time update via Pusher
    await pusherServer.trigger(
      `poll-${pollId}`,
      'vote-update',
      pollWithResults
    )

    return NextResponse.json({ success: true, poll: pollWithResults })
  } catch (error) {
    console.error('Error submitting vote:', error)
    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    )
  }
}
