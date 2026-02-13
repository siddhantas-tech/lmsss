import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { FileQuestion, Plus, Trash2, Loader2, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getQuizQuestions, createQuizQuestion, updateQuizQuestion, deleteQuizQuestion } from '@/api/quiz'
import { cn } from '@/lib/utils'

interface QuizBuilderProps {
    topic: {
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

export function QuizBuilder({ topic, open, onOpenChange, onSuccess }: QuizBuilderProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(false)
    const [draftQuestion, setDraftQuestion] = useState('')
    const [draftOptions, setDraftOptions] = useState(['', '', '', ''])
    const [draftCorrectIndex, setDraftCorrectIndex] = useState(0)
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (open && topic?.id) {
            loadQuestions()
        }
    }, [open, topic?.id])

    const loadQuestions = async () => {
        setLoading(true)
        try {
            // Backend expects topicId query param.
            // Also need to map response back to component state.
            const res = await getQuizQuestions({ topicId: topic?.id })

            if (Array.isArray(res.data)) {
                const mappedQuestions: Question[] = res.data.map((q: any) => ({
                    id: q.id,
                    text: q.question_text,
                    // Map options array of objects to array of strings
                    options: q.quiz_options?.map((o: any) => o.option_text) || [],
                    // Find index of option where is_correct is true
                    correctIndex: q.quiz_options?.findIndex((o: any) => o.is_correct) ?? 0
                }))
                setQuestions(mappedQuestions)
            } else {
                setQuestions([])
            }
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

        try {
            if (editingId) {
                // For update, we only need the fields being updated
                await updateQuizQuestion(editingId, {
                    topic_id: topic?.id,
                    course_id: topic?.course_id,
                    question_text: text,
                    question_type: 'multiple_choice', // Default type
                    question_order: questions.length + 1, // Simple ordering
                    options: draftOptions
                        .filter(o => o.trim()) // Ensure we strictly only send non-empty options
                        .map((optToken, idx) => ({
                            option_text: optToken,
                            is_correct: idx === Number(draftCorrectIndex)
                        }))
                })

                // Update local state to reflect changes immediately
                setQuestions(qs => qs.map(q => q.id === editingId ? {
                    id: editingId,
                    text: text,
                    options: draftOptions.filter(o => o.trim()),
                    correctIndex: Number(draftCorrectIndex)
                } : q))
            } else {
                const res = await createQuizQuestion({
                    topic_id: topic?.id,
                    course_id: topic?.course_id,
                    question_text: text,
                    question_type: 'multiple_choice',
                    question_order: questions.length + 1,
                    options: draftOptions
                        .filter(o => o.trim())
                        .map((optToken, idx) => ({
                            option_text: optToken,
                            is_correct: idx === Number(draftCorrectIndex)
                        }))
                })
                // Append new question to local state
                const newQuestion: Question = {
                    id: res.data.id,
                    text: text,
                    options: draftOptions.filter(o => o.trim()),
                    correctIndex: Number(draftCorrectIndex)
                }
                setQuestions(qs => [...qs, newQuestion])
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
            <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-y-auto border-2 border-border shadow-2xl bg-background p-0">
                <div className="flex flex-col h-full">
                    <DialogHeader className="p-6 border-b bg-muted/20">
                        <DialogTitle className="font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <FileQuestion className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="block">Quiz Builder</span>
                                <span className="block text-[10px] text-muted-foreground font-bold tracking-widest">{topic?.title}</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Draft Question */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-primary">Question Editor</h3>
                            </div>
                            <Card className="border-2 border-border shadow-sm overflow-hidden">
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Question Statement</Label>
                                        <Input
                                            value={draftQuestion}
                                            onChange={e => setDraftQuestion(e.target.value)}
                                            placeholder="What is the result of...?"
                                            className="text-lg font-bold border-2 focus-visible:border-primary transition-all h-12"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Options & Correct Answer</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {draftOptions.map((opt, idx) => {
                                                const isCorrect = Number(draftCorrectIndex) === idx
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={cn(
                                                            "group relative flex items-center gap-3 rounded-xl border-2 p-3 transition-all",
                                                            isCorrect
                                                                ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]"
                                                                : "border-border bg-muted/30 hover:border-muted-foreground/30"
                                                        )}
                                                    >
                                                        <div className="relative flex items-center justify-center h-5 w-5">
                                                            <input
                                                                type="radio"
                                                                name="correct"
                                                                checked={isCorrect}
                                                                onChange={() => setDraftCorrectIndex(idx)}
                                                                className="peer hidden"
                                                            />
                                                            <div
                                                                onClick={() => setDraftCorrectIndex(idx)}
                                                                className={cn(
                                                                    "h-5 w-5 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center",
                                                                    isCorrect ? "border-emerald-500 bg-emerald-500 shadow-inner" : "border-muted-foreground/30 hover:border-muted-foreground"
                                                                )}
                                                            >
                                                                {isCorrect && <Check className="h-3 w-3 text-white" />}
                                                            </div>
                                                        </div>
                                                        <Input
                                                            value={opt}
                                                            onChange={e => {
                                                                const next = [...draftOptions]
                                                                next[idx] = e.target.value
                                                                setDraftOptions(next)
                                                            }}
                                                            placeholder={`Option ${idx + 1}`}
                                                            className="flex-1 border-none bg-transparent font-medium p-0 focus-visible:ring-0 shadow-none h-auto"
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            onClick={handleAddOrUpdate}
                                            disabled={!draftQuestion.trim() || draftOptions.filter(o => o.trim()).length < 2}
                                            className="font-bold gap-2 px-6"
                                        >
                                            {editingId ? 'Update Question' : <><Plus className="h-4 w-4" /> Add to Quiz</>}
                                        </Button>
                                        {editingId && (
                                            <Button variant="outline" onClick={resetDraft} className="font-bold">
                                                Discard Changes
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Existing Questions */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Current Curriculum ({questions.length})</h3>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin opacity-20" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Retrieving questions...</span>
                                    </div>
                                ) : questions.length === 0 ? (
                                    <div className="py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No questions in this quiz Yet</p>
                                    </div>
                                ) : (
                                    questions.map((q, qIndex) => (
                                        <div
                                            key={q.id}
                                            className="group/q relative rounded-2xl border-2 border-border bg-card p-5 transition-all hover:border-primary/30"
                                        >
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex gap-3">
                                                    <span className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black shrink-0">
                                                        {qIndex + 1}
                                                    </span>
                                                    <div className="font-black text-lg tracking-tight leading-tight">{q.text}</div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover/q:opacity-100 transition-opacity shrink-0">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(q)}>
                                                        <Plus className="h-4 w-4 rotate-45" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(q.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map((o, i) => {
                                                    const isCorrect = Number(q.correctIndex) === i
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                "flex items-center gap-2 text-xs rounded-xl border px-3 py-2 font-medium transition-colors",
                                                                isCorrect
                                                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                                                                    : "border-border bg-muted/20 text-muted-foreground"
                                                            )}
                                                        >
                                                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", isCorrect ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" : "bg-transparent")} />
                                                            {o}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <DialogFooter className="p-6 border-t bg-muted/20">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="font-black uppercase tracking-widest text-[10px]">
                            FINALIZE & CLOSE
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}