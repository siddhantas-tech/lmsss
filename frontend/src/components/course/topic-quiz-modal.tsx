import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
}

interface TopicQuizModalProps {
    isOpen: boolean;
    topicTitle: string;
    questions: QuizQuestion[];
    onClose: () => void;
    onSubmit: (score: number) => void;
}

export function TopicQuizModal({ isOpen, topicTitle, questions, onClose, onSubmit }: TopicQuizModalProps) {
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
        if (submitted) return
        setAnswers({
            ...answers,
            [questionIndex]: optionIndex
        })
    }

    const handleSubmit = () => {
        let correctCount = 0
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) {
                correctCount++
            }
        })
        const finalScore = Math.round((correctCount / questions.length) * 100)
        setScore(finalScore)
        setSubmitted(true)
    }

    const handleFinish = () => {
        onSubmit(score)
        // Reset state for next time
        setAnswers({})
        setSubmitted(false)
        setScore(0)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-background p-8">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-black uppercase tracking-tighter mb-4">
                        {submitted ? 'Quiz Results' : `Quiz: ${topicTitle}`}
                    </DialogTitle>
                </DialogHeader>

                {!submitted ? (
                    <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                        {questions.map((q, qIdx) => (
                            <div key={q.id} className="space-y-4">
                                <h3 className="text-xl font-black leading-tight flex gap-3">
                                    <span className="bg-foreground text-background w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                                        {qIdx + 1}
                                    </span>
                                    {q.question}
                                </h3>
                                <div className="grid gap-3">
                                    {q.options.map((opt, oIdx) => (
                                        <button
                                            key={oIdx}
                                            onClick={() => handleOptionSelect(qIdx, oIdx)}
                                            className={cn(
                                                "text-left p-4 rounded-xl border-4 font-bold transition-all",
                                                answers[qIdx] === oIdx
                                                    ? "bg-primary border-foreground text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1 translate-y-1"
                                                    : "bg-muted/10 border-transparent hover:border-foreground/20"
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center space-y-6">
                        <div className={cn(
                            "w-24 h-24 mx-auto rounded-3xl flex items-center justify-center border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
                            score >= 70 ? "bg-green-500" : "bg-red-500"
                        )}>
                            {score >= 70 ? (
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            ) : (
                                <AlertCircle className="w-12 h-12 text-white" />
                            )}
                        </div>
                        <div>
                            <p className="text-5xl font-black uppercase italic tracking-tighter">{score}%</p>
                            <p className="font-bold text-muted-foreground uppercase tracking-widest mt-2">
                                {score >= 70 ? 'Congratulations! You passed.' : 'Keep studying and try again!'}
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-8 flex gap-4">
                    {!submitted ? (
                        <>
                            <Button variant="ghost" onClick={onClose} className="font-black h-12 px-6">
                                CANCEL
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length < questions.length}
                                className="font-black h-12 px-8 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ml-auto"
                            >
                                SUBMIT QUIZ <Send className="ml-2 w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleFinish}
                            className="w-full font-black h-14 text-xl border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                        >
                            {score >= 70 ? 'CONTINUE COURSE' : 'RETRY TOPIC'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
