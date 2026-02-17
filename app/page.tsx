import { db } from '@/lib/db'
// import { prisma } from '@/lib/prisma'
import { PollForm } from '@/components/poll-form'
import { PollCard } from '@/components/poll-card'

// Revalidate every 30 seconds
export const revalidate = 30

export default async function Home() {
  // Fetch active polls, ordered by creation date
  let polls: any[] = []
  
  try {
    const pollsResult = await db.query(`
      SELECT p.*, COUNT(v.id)::int as "votesCount"
      FROM "Poll" p
      LEFT JOIN "Vote" v ON v."pollId" = p.id
      GROUP BY p.id
      ORDER BY p."createdAt" DESC
      LIMIT 20
    `)
    polls = pollsResult.rows
  } catch (error) {
    console.error('Failed to fetch polls:', error)
    // Fallback to empty array to allow build to succeed without DB
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Real-Time Poll Rooms
          </h1>
          <p className="text-gray-600 text-lg">
            Create polls and see results update live as people vote
          </p>
        </div>

        {/* Create Poll Section */}
        <div className="max-w-2xl mx-auto">
          <PollForm />
        </div>

        {/* Active Polls Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Latest Polls</h2>
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
              {polls.length} Active
            </span>
          </div>

          {polls.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  id={poll.id}
                  question={poll.question}
                  createdAt={poll.createdAt}
                  expiresAt={poll.expiresAt}
                  votesCount={poll.votesCount}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">No active polls yet. Be the first to create one!</p>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Share your poll link and watch results update in real-time! 🚀</p>
        </div>
      </div>
    </div>
  )
}

