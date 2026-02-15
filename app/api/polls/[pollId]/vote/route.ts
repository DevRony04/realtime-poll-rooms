import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const option = await prisma.option.findFirst({
      where: {
        id: optionId,
        pollId: pollId,
      },
    })

    if (!option) {
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
      const existingIpVote = await prisma.vote.findFirst({
        where: {
          pollId: pollId,
          ipAddress: ipAddress,
        },
      })

      if (existingIpVote) {
        return NextResponse.json(
          { error: 'You have already voted in this poll' },
          { status: 409 }
        )
      }
    }

    // Check if user has already voted based on fingerprint
    if (fingerprint) {
      const existingFingerprintVote = await prisma.vote.findFirst({
        where: {
          pollId: pollId,
          fingerprint: fingerprint,
        },
      })

      if (existingFingerprintVote) {
        return NextResponse.json(
          { error: 'You have already voted in this poll' },
          { status: 409 }
        )
      }
    }

    // Create vote
    const vote = await prisma.vote.create({
      data: {
        pollId: pollId,
        optionId: optionId,
        ipAddress: ipAddress,
        fingerprint: fingerprint,
        userAgent: userAgent,
      },
    })

    // Get updated poll results
    const updatedPoll = await prisma.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        options: {
          orderBy: {
            position: 'asc',
          },
          include: {
            _count: {
              select: {
                votes: true,
              },
            },
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    })

    if (!updatedPoll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Transform data
    const pollWithResults = {
      ...updatedPoll,
      totalVotes: updatedPoll._count.votes,
      options: updatedPoll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        position: opt.position,
        votes: opt._count.votes,
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
