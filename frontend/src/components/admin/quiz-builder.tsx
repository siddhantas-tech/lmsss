import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FileQuestion, Plus, Trash2, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getQuizQuestions, createQuizQuestion, updateQuizQuestion, deleteQuizQuestion } from '@/api/quiz'
import { cn } from '@/lib/utils'

interface QuizBuilderProps {
    lesson: {
        id: string
        title: string
        course_id: string
    } | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

interface Question {
    id: string
    text: string
    options: string[]
    correctIndex: number
}

export function QuizBuilder({ lesson, open, onOpenChange, onSuccess }: QuizBuilderProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(false)
    const [draftQuestion, setDraftQuestion] = useState('')
    const [draftOptions, setDraftOptions] = useState(['', '', '', ''])
    const [draftCorrectIndex, setDraftCorrectIndex] = useState(0)
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (open && lesson?.id) {
            loadQuestions()
        }
    }, [open, lesson?.id])

    const loadQuestions = async () => {
        setLoading(true)
        try {
            const res = await getQuizQuestions({ lessonId: lesson?.id })
            setQuestions(Array.isArray(res.data) ? res.data : [])
        } catch (e: any) {
            console.error('Failed to load quiz questions:', e)
        } finally {
            setLoading(false)
        }
    }

    const handleAddOrUpdate = async () => {
        const text = draftQuestion.trim()
        const options = draftOptions.map(o => o.trim()).filter(Boolean)
        if (!text || options.length < 2) return

        const payload = {
            text,
            options,
            correctIndex: Number(draftCorrectIndex),
            lessonId: lesson?.id,
        }

        try {
            if (editingId) {
                await updateQuizQuestion(editingId, payload)
                setQuestions(qs => qs.map(q => q.id === editingId ? { ...q, ...payload } : q))
            } else {
                const res = await createQuizQuestion(payload)
                setQuestions(qs => [...qs, { ...payload, id: res.data.id || Date.now().toString() }])
            }
            resetDraft()
        } catch (e: any) {
            console.error('Failed to save question:', e)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteQuizQuestion(id)
            setQuestions(qs => qs.filter(q => q.id !== id))
        } catch (e: any) {
            console.error('Failed to delete question:', e)
        }
    }

    const resetDraft = () => {
        setDraftQuestion('')
        setDraftOptions(['', '', '', ''])
        setDraftCorrectIndex(0)
        setEditingId(null)
    }

    const startEdit = (q: Question) => {
        setDraftQuestion(q.text)
        setDraftOptions([...q.options, '', '', '', ''].slice(0, 4))
        setDraftCorrectIndex(q.correctIndex)
        setEditingId(q.id)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background">
                <DialogHeader>
                    <DialogTitle className="font-black text-2xl uppercase tracking-tighter flex items-center gap-2">
                        <FileQuestion className="h-6 w-6" /> Quiz Builder
                    </DialogTitle>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Draft Question */}
                    <Card className="border-2 border-foreground">
                        <CardHeader>
                            <CardTitle className="font-black uppercase text-sm">
                                {editingId ? 'Edit Question' : 'New Question'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Question</Label>
                                <Input
                                    value={draftQuestion}
                                    onChange={e => setDraftQuestion(e.target.value)}
                                    placeholder="Enter question text"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Options (select correct)</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {draftOptions.map((opt, idx) => {
                                        const isCorrect = Number(draftCorrectIndex) === idx
                                        return (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "flex items-center gap-2 rounded-md border p-2",
                                                    isCorrect ? "border-green-600 bg-green-50" : ""
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name="correct"
                                                    checked={isCorrect}
                                                    onChange={() => setDraftCorrectIndex(idx)}
                                                />
                                                <Input
                                                    value={opt}
                                                    onChange={e => {
                                                        const next = [...draftOptions]
                                                        next[idx] = e.target.value
                                                        setDraftOptions(next)
                                                    }}
                                                    placeholder={`Option ${idx + 1}`}
                                                    className={cn(isCorrect ? "border-green-600" : "")}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleAddOrUpdate}
                                    disabled={!draftQuestion.trim() || draftOptions.filter(o => o.trim()).length < 2}
                                >
                                    {editingId ? 'Update' : <><Plus className="h-3 w-3 mr-1" /> Add Question</>}
                                </Button>
                                {editingId && (
                                    <Button size="sm" variant="outline" onClick={resetDraft}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Existing Questions */}
                    <Card className="border-2 border-foreground">
                        <CardHeader>
                            <CardTitle className="font-black uppercase text-sm">Questions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                                </div>
                            ) : questions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No questions yet.</p>
                            ) : (
                                questions.map(q => (
                                    <div key={q.id} className="rounded-md border p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="font-bold">{q.text}</div>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => startEdit(q)}>Edit</Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(q.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {q.options.map((o, i) => {
                                                const isCorrect = Number(q.correctIndex) === i
                                                return (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "text-sm rounded-md border px-2 py-1",
                                                            isCorrect ? "border-green-600 bg-green-50 font-bold" : ""
                                                        )}
                                                    >
                                                        {o}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="font-black">
                        CLOSE
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}