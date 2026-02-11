'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Loader2,
  Plus,
  Trash2,
  FileQuestion,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import {
  getQuizQuestions,
  createQuizQuestion,
} from '@/api/quiz'

/* ---------------- types ---------------- */

interface QuizOption {
  id: string
  option_text: string
  is_correct: boolean
  option_order: number
}

interface QuizQuestion {
  id: string
  question_text: string
  question_order: number
  quiz_options: QuizOption[]
}

interface QuizEditDialogProps {
  topic: {
    id: string
    title: string
    course_id: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

/* ---------------- component ---------------- */

export function QuizEditDialog({
  topic,
  open,
  onOpenChange,
  onSuccess,
}: QuizEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  // New question form state
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState([
    { text: '', correct: true },
    { text: '', correct: false },
    { text: '', correct: false },
    { text: '', correct: false },
  ])

  /* ---------------- effects ---------------- */

  useEffect(() => {
    if (open && topic) {
      fetchQuestions()
    }
  }, [open, topic])

  /* ---------------- api ---------------- */

  async function fetchQuestions() {
    if (!topic) return
    setFetching(true)

    try {
      const res = await getQuizQuestions({ topicId: topic.id })
      setQuestions(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Error fetching quiz questions:', err)
      setQuestions([])
    } finally {
      setFetching(false)
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!topic) return

    setLoading(true)

    try {
      const nextOrder =
        questions.length > 0
          ? Math.max(...questions.map(q => q.question_order)) + 1
          : 1

      await createQuizQuestion({
        topic_id: topic.id,
        course_id: topic.course_id,
        question_text: questionText,
        question_order: nextOrder,
        question_type: 'multiple_choice',
        options: options.map((opt, idx) => ({
          option_text: opt.text,
          is_correct: opt.correct,
          option_order: idx,
        })),
      })

      // Reset form
      setQuestionText('')
      setOptions([
        { text: '', correct: true },
        { text: '', correct: false },
        { text: '', correct: false },
        { text: '', correct: false },
      ])

      await fetchQuestions()
      onSuccess()
    } catch (err) {
      console.error('Error creating quiz question:', err)
      alert('Failed to create question')
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- helpers ---------------- */

  const updateOptionText = (idx: number, text: string) => {
    const next = [...options]
    next[idx].text = text
    setOptions(next)
  }

  const setCorrectOption = (idx: number) => {
    setOptions(
      options.map((opt, i) => ({
        ...opt,
        correct: i === idx,
      }))
    )
  }

  if (!topic) return null

  /* ---------------- render ---------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Quiz Builder: {topic.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Existing Questions */}
          <div>
            <Label className="text-xs font-bold uppercase">
              Questions ({questions.length})
            </Label>

            {fetching ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin" />
              </div>
            ) : questions.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-4">
                No questions yet
              </p>
            ) : (
              <div className="space-y-3 mt-4">
                {questions.map((q, i) => (
                  <Card key={q.id}>
                    <CardHeader className="py-2">
                      <CardTitle className="text-xs">
                        {i + 1}. {q.question_text}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1">
                      {q.quiz_options
                        ?.sort((a, b) => a.option_order - b.option_order)
                        .map(opt => (
                          <div
                            key={opt.id}
                            className={cn(
                              opt.is_correct && 'text-green-600 font-bold'
                            )}
                          >
                            • {opt.option_text}
                            {opt.is_correct && ' ✓'}
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add Question */}
          <div>
            <Label className="text-xs font-bold uppercase">
              Add New Question
            </Label>

            <Card className="mt-3">
              <CardContent className="p-4">
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <Input
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    placeholder="Question text"
                    required
                  />

                  <RadioGroup
                    value={options.findIndex(o => o.correct).toString()}
                    onValueChange={(val: string) => setCorrectOption(Number(val))}
                  >
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <RadioGroupItem value={idx.toString()} />
                        <Input
                          value={opt.text}
                          onChange={e =>
                            updateOptionText(idx, e.target.value)
                          }
                          placeholder={`Option ${idx + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </RadioGroup>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      <Plus className="mr-2" />
                    )}
                    Add Question
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}