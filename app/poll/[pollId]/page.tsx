'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { pusherClient } from '@/lib/pusher-client'
import { Copy, Check, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

interface Option {
  id: string
  text: string
  position: number
  votes: number
}

interface Poll {
  id: string
  question: string
  totalVotes: number
  expiresAt?: string | null
  options: Option[]
}

export default function PollPage() {
  const params = useParams()
  const pollId = params.pollId as string
  const { toast } = useToast()

  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [fingerprint, setFingerprint] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)

  // Generate browser fingerprint on mount
  useEffect(() => {
    const generateFingerprint = async () => {
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      setFingerprint(result.visitorId)
    }
    generateFingerprint()
  }, [])

  // Fetch initial poll data
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}`)

        if (!response.ok) {
          throw new Error('Poll not found')
        }

        const data = await response.json()
        setPoll(data)

        // Check expiration
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          setIsExpired(true)
        }
      } catch (error) {
        console.error('Error fetching poll:', error)
        toast({
          title: 'Error',
          description: 'Failed to load poll',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (pollId) {
      fetchPoll()
    }
  }, [pollId, toast])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!pollId) return

    const channel = pusherClient.subscribe(`poll-${pollId}`)

    channel.bind('vote-update', (data: Poll) => {
      setPoll(data)
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        setIsExpired(true)
      }
    })

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [pollId])

  // Check expiration periodically
  useEffect(() => {
    if (!poll?.expiresAt || isExpired) return

    const checkExpiration = () => {
      if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
        setIsExpired(true)
      }
    }

    const interval = setInterval(checkExpiration, 1000)
    return () => clearInterval(interval)
  }, [poll, isExpired])

  const handleVote = async (optionId: string) => {
    if (hasVoted || voting || isExpired) return

    setVoting(true)
    setSelectedOption(optionId)

    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optionId,
          fingerprint,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to vote')
      }

      setHasVoted(true)
      toast({
        title: 'Vote recorded!',
        description: 'Your vote has been counted',
      })
    } catch (error: any) {
      console.error('Error voting:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit vote',
        variant: 'destructive',
      })
      setSelectedOption(null)
    } finally {
      setVoting(false)
    }
  }

  const copyShareLink = () => {
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast({
      title: 'Copied!',
      description: 'Share link copied to clipboard',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const getPercentage = (votes: number, total: number) => {
    if (total === 0) return 0
    return Math.round((votes / total) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading poll...</p>
        </div>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Poll Not Found</CardTitle>
            <CardDescription>
              The poll you're looking for doesn't exist or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Create New Poll
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Create New Poll
            </Button>
          </Link>
        </div>

        <Card className={isExpired ? "border-t-4 border-t-gray-400" : ""}>
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <CardTitle className="text-2xl">{poll.question}</CardTitle>
              {isExpired && (
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded text-sm font-medium text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Expired</span>
                </div>
              )}
            </div>
            <CardDescription>
              {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'} • {isExpired ? 'Final Results' : 'Results update in real-time'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {poll.options.map((option) => {
              const percentage = getPercentage(option.votes, poll.totalVotes)
              const isSelected = selectedOption === option.id

              return (
                <div key={option.id}>
                  <Button
                    onClick={() => handleVote(option.id)}
                    disabled={hasVoted || voting || isExpired}
                    variant={isSelected && hasVoted ? 'default' : 'outline'}
                    className={`w-full justify-start h-auto py-4 relative overflow-hidden ${isExpired ? 'cursor-default hover:bg-background' : ''}`}
                  >
                    {/* Liquid Lava Lamp Effect */}
                    <div className="absolute left-0 top-0 bottom-0 overflow-hidden rounded-full">
                      <div
                        className={`h-full opacity-80 transition-all duration-1000 ease-in-out ${isSelected ? 'bg-gradient-to-r from-lava-from to-lava-to' : 'bg-ink/10'}`}
                        style={{ width: `${percentage}%` }}
                      >
                        {/* Floating Bubbles inside the bar */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-inherit rounded-full blur-sm animate-blob" style={{ animationDelay: '0s' }}></div>
                        <div className="absolute right-2 top-1/4 w-3 h-3 bg-inherit rounded-full blur-md animate-blob" style={{ animationDelay: '0.5s' }}></div>
                        <div className="absolute right-4 bottom-1/4 w-5 h-5 bg-inherit rounded-full blur-lg animate-blob" style={{ animationDelay: '1s' }}></div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <span className="font-medium">{option.text}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                        </span>
                        <span className="font-bold min-w-[3rem] text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </Button>
                </div>
              )
            })}

            {hasVoted && !isExpired && (
              <div className="pt-4 border-t">
                <p className="text-sm text-center text-muted-foreground">
                  ✓ You have voted. Results update automatically as others vote!
                </p>
              </div>
            )}

            {isExpired && (
              <div className="pt-4 border-t">
                <p className="text-sm text-center text-muted-foreground font-medium">
                  This poll has ended. Voting is closed.
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                onClick={copyShareLink}
                variant="secondary"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Share Link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  )
}
