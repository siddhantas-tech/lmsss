import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizOption {
    id: string;
    text: string;
}

interface QuizQuestion {
    id: string;
    question: string;
    options: QuizOption[];
    correctAnswerIndex: number;
}

interface TopicQuizModalProps {
    isOpen: boolean;
    topicTitle: string;
    questions: QuizQuestion[];
    onClose: () => void;
    onSubmit: (score: number, answers: Record<string, string>) => void;
}

export function TopicQuizModal({ isOpen, topicTitle, questions, onClose, onSubmit }: TopicQuizModalProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    const handleOptionSelect = (questionId: string, optionId: string) => {
        if (submitted) return
        setAnswers({
            ...answers,
            [questionId]: optionId
        })
    }

    const handleSubmit = () => {
        if (!questions.length) return
        let correctCount = 0
        questions.forEach((q) => {
            const selectedOptionId = answers[q.id];
            if (q.correctAnswerIndex >= 0 && q.options[q.correctAnswerIndex]) {
                const correctOption = q.options[q.correctAnswerIndex];
                if (selectedOptionId === correctOption.id) {
                    correctCount++
                }
            }
        })
        const finalScore = Math.round((correctCount / questions.length) * 100)
        setScore(finalScore)
        setSubmitted(true)
    }

    const handleFinish = () => {
        onSubmit(score, answers)
        // Reset state for next time
        setAnswers({})
        setSubmitted(false)
        setScore(0)
    }

    const PASS_THRESHOLD = 85

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="sm:max-w-[600px] border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-background p-8"
            >
                <DialogHeader>
                    <DialogTitle className="text-3xl font-black uppercase tracking-tighter mb-4">
                        {submitted ? 'Assessment Report' : `Terminal: ${topicTitle}`}
                    </DialogTitle>
                </DialogHeader>

                {!submitted ? (
                    <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                        {questions.map((q, qIdx) => (
                            <div key={q.id} className="space-y-4">
                                <h3 className="text-xl font-black leading-tight flex gap-3 italic">
                                    <span className="bg-foreground text-background w-8 h-8 rounded-lg flex items-center justify-center shrink-0 not-italic">
                                        {qIdx + 1}
                                    </span>
                                    {q.question}
                                </h3>
                                <div className="grid gap-3">
                                    {q.options.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleOptionSelect(q.id, opt.id)}
                                            className={cn(
                                                "text-left p-5 rounded-xl border-4 font-black transition-all uppercase tracking-tight text-sm",
                                                answers[q.id] === opt.id
                                                    ? "bg-primary border-foreground text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1 translate-y-1"
                                                    : "bg-muted/10 border-transparent hover:border-foreground/20"
                                            )}
                                        >
                                            {opt.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center space-y-8">
                        <div className={cn(
                            "w-32 h-32 mx-auto rounded-4xl flex items-center justify-center border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
                            score >= PASS_THRESHOLD ? "bg-emerald-500 shadow-emerald-500/20" : "bg-destructive shadow-destructive/20"
                        )}>
                            {score >= PASS_THRESHOLD ? (
                                <CheckCircle2 className="w-16 h-16 text-white" />
                            ) : (
                                <AlertCircle className="w-16 h-16 text-white" />
                            )}
                        </div>
                        <div>
                            <p className="text-7xl font-black uppercase italic tracking-tighter leading-none">{score}%</p>
                            <p className="font-black text-muted-foreground uppercase tracking-[0.3em] text-[10px] mt-4">
                                {score >= PASS_THRESHOLD ? 'PROTOCOL PASSED. ACCESS GRANTED.' : `REQUIREMENT: ${PASS_THRESHOLD}% MINIMUM. RETRY.`}
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-10 flex gap-4">
                    {!submitted ? (
                        <>
                            <Button variant="ghost" onClick={onClose} className="font-black h-12 px-6 uppercase tracking-widest text-xs">
                                ABORT
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length < questions.length}
                                className="font-black h-12 px-10 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ml-auto uppercase tracking-widest text-xs"
                            >
                                TRANSMIT ANSWERS
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleFinish}
                            className="w-full font-black h-16 text-xl border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tighter italic"
                        >
                            {score >= PASS_THRESHOLD ? 'INITIALIZE NEXT MODULE' : 'RELOAD SOURCE VIDEO'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
