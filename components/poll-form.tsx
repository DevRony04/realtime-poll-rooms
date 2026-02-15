"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Plus, X } from 'lucide-react'

export function PollForm() {
    const router = useRouter()
    const { toast } = useToast()
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState(['', ''])
    const [expiresIn, setExpiresIn] = useState('0') // 0 = Never
    const [isCreating, setIsCreating] = useState(false)

    const addOption = () => {
        setOptions([...options, ''])
    }

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index))
        }
    }

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options]
        newOptions[index] = value
        setOptions(newOptions)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!question.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a question',
                variant: 'destructive',
            })
            return
        }

        const validOptions = options.filter(opt => opt.trim())
        if (validOptions.length < 2) {
            toast({
                title: 'Error',
                description: 'Please provide at least 2 options',
                variant: 'destructive',
            })
            return
        }

        setIsCreating(true)

        try {
            const response = await fetch('/api/polls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question,
                    options: validOptions,
                    expiresIn: parseInt(expiresIn),
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create poll')
            }

            const poll = await response.json()

            toast({
                title: 'Success!',
                description: 'Your poll has been created',
            })

            router.push(`/poll/${poll.id}`)
        } catch (error) {
            console.error('Error creating poll:', error)
            toast({
                title: 'Error',
                description: 'Failed to create poll. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create a New Poll</CardTitle>
                <CardDescription>
                    Add your question and at least 2 options
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="question">Question</Label>
                        <Input
                            id="question"
                            placeholder="What's your question?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={isCreating}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="expiration">Poll Expiration</Label>
                        <select
                            id="expiration"
                            className="flex h-12 w-full border-2 border-terminal-dim bg-black px-3 py-2 text-sm text-terminal-green ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-terminal-dim focus-visible:outline-none focus-visible:border-terminal-green focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 font-mono rounded-none"
                            value={expiresIn}
                            onChange={(e) => setExpiresIn(e.target.value)}
                            disabled={isCreating}
                        >
                            <option value="0">Never</option>
                            <option value="3600">1 Hour</option>
                            <option value="86400">24 Hours</option>
                            <option value="604800">7 Days</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Options</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                                disabled={isCreating}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Option
                            </Button>
                        </div>

                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    placeholder={`Option ${index + 1}`}
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    disabled={isCreating}
                                />
                                {options.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeOption(index)}
                                        disabled={isCreating}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Poll'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
