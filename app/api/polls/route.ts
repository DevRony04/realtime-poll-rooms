import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, options, expiresIn } = body

    // Validation
    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 options are required' },
        { status: 400 }
      )
    }

    // Check if all options have text
    const validOptions = options.filter((opt) => opt && opt.trim())
    if (validOptions.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 valid options are required' },
        { status: 400 }
      )
    }

    // Calculate expiration date
    let expiresAt: Date | undefined
    if (expiresIn && typeof expiresIn === 'number' && expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn * 1000)
    }

    // Create poll with options in a transaction
    const poll = await prisma.poll.create({
      data: {
        question: question.trim(),
        expiresAt,
        options: {
          create: validOptions.map((text, index) => ({
            text: text.trim(),
            position: index,
          })),
        },
      },
      include: {
        options: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    })

    return NextResponse.json(poll, { status: 201 })
  } catch (error) {
    console.error('Error creating poll:', error)
    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 }
    )
  }
}
