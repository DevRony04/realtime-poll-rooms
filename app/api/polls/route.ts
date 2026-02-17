import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
// import { prisma } from '@/lib/prisma'

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
    const client = await db.getClient()

    try {
      await client.query('BEGIN')

      const pollResult = await client.query(
        `INSERT INTO "Poll" (question, "expiresAt") 
         VALUES ($1, $2) 
         RETURNING *`,
        [question.trim(), expiresAt]
      )
      const poll = pollResult.rows[0]

      const optionsWithPosition = validOptions.map((text, index) => ({
        text: text.trim(),
        position: index,
        pollId: poll.id
      }))

      // Insert options
      const insertedOptions = []
      for (const opt of optionsWithPosition) {
        const optResult = await client.query(
          `INSERT INTO "Option" (text, position, "pollId") 
           VALUES ($1, $2, $3) 
           RETURNING *`,
          [opt.text, opt.position, opt.pollId]
        )
        insertedOptions.push(optResult.rows[0])
      }

      await client.query('COMMIT')

      const response = {
        ...poll,
        options: insertedOptions.sort((a, b) => a.position - b.position)
      }

      return NextResponse.json(response, { status: 201 })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error creating poll:', error)
    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 }
    )
  }
}
