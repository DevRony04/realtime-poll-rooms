import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock } from 'lucide-react'

interface PollCardProps {
    id: string
    question: string
    createdAt: Date
    expiresAt?: Date | null
    votesCount?: number
}

// Simple time formatter since we might not have date-fns
// If date-fns is available, I'll update it later
function formatTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " years ago"

    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " months ago"

    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " days ago"

    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " hours ago"

    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " minutes ago"

    return Math.floor(seconds) + " seconds ago"
}

export function PollCard({ id, question, createdAt, expiresAt, votesCount }: PollCardProps) {
    const isExpired = expiresAt && new Date(expiresAt) < new Date()

    return (
        <Link href={`/poll/${id}`} className="block transition-transform hover:-translate-y-1">
            <Card className="h-full rounded-3xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-xl hover:shadow-2xl transition-all">
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <CardTitle className="text-xl line-clamp-2 text-ink">{question}</CardTitle>
                        {isExpired && (
                            <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full bg-ink/5 border border-ink/10 text-xs font-medium text-ink/60">
                                Expired
                            </span>
                        )}
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs text-ink/60">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(createdAt)}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-ink/60 font-medium">
                            {votesCount !== undefined ? `${votesCount} Votes` : 'Vote Now'}
                        </span>
                        <Button size="sm" variant={isExpired ? "secondary" : "default"} className="rounded-full">
                            {isExpired ? 'View Results' : 'Vote'} <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
