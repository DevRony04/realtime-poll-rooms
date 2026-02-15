import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const { pollId } = params

    const poll = await prisma.poll.findUnique({
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

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Transform data to include vote counts
    const pollWithResults = {
      ...poll,
      totalVotes: poll._count.votes,
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.text,
        position: option.position,
        votes: option._count.votes,
      })),
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
