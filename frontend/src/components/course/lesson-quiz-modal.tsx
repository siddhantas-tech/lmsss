'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export interface QuizQuestion {
    id: string
    question: string
    options: string[]
    correctAnswer: number
}

interface LessonQuizModalProps {
    isOpen: boolean
    lessonTitle: string
    questions: QuizQuestion[]
    onClose: () => void
    onSubmit: (score: number) => void
}

export function LessonQuizModal({
    isOpen,
    lessonTitle,
    questions,
    onClose,
    onSubmit,
}: LessonQuizModalProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    const question = questions[currentQuestion]
    const isLastQuestion = currentQuestion === questions.length - 1

    const handleSelectAnswer = (optionIndex: number) => {
        const newAnswers = [...selectedAnswers]
        newAnswers[currentQuestion] = optionIndex
        setSelectedAnswers(newAnswers)
    }

    const handleNext = () => {
        if (isLastQuestion) {
            handleSubmit()
        } else {
            setCurrentQuestion(currentQuestion + 1)
        }
    }

    const handleSubmit = () => {
        let correctCount = 0
        questions.forEach((q, index) => {
            if (selectedAnswers[index] === q.correctAnswer) {
                correctCount++
            }
        })
        const finalScore = Math.round((correctCount / questions.length) * 100)
        setScore(finalScore)
        setSubmitted(true)
    }

    const handleClose = () => {
        if (submitted) {
            onSubmit(score)
            setCurrentQuestion(0)
            setSelectedAnswers([])
            setSubmitted(false)
            setScore(0)
            onClose()
        } else {
            // Allow closing without submitting (user can retake later)
            onClose()
        }
    }

    const handleRetake = () => {
        setCurrentQuestion(0)
        setSelectedAnswers([])
        setSubmitted(false)
        setScore(0)
    }

    if (!question && !submitted) return null

    if (!submitted) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl border-none rounded-[2.5rem] shadow-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black">Lesson Quiz: {lessonTitle}</DialogTitle>
                        <DialogDescription className="text-base font-bold text-muted-foreground mt-2">
                            Question {currentQuestion + 1} of {questions.length}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8 py-4">
                        {/* Progress Bar */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-black text-muted-foreground uppercase tracking-widest">
                                <span>Progress</span>
                                <span>
                                    {currentQuestion + 1}/{questions.length}
                                </span>
                            </div>
                            <div className="h-4 bg-muted/20 rounded-full overflow-hidden border border-border/5">
                                <div
                                    className="h-full bg-primary transition-all duration-500 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Question */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black text-foreground leading-tight">{question.question}</h3>

                            {/* Options */}
                            <RadioGroup
                                value={selectedAnswers[currentQuestion]?.toString() ?? ''}
                                onValueChange={(value: string) => handleSelectAnswer(parseInt(value))}
                                className="gap-4"
                            >
                                <div className="space-y-3">
                                    {question.options.map((option, index) => (
                                        <div key={index} className="relative group">
                                            <RadioGroupItem
                                                value={index.toString()}
                                                id={`option-${index}`}
                                                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 opacity-0"
                                            />
                                            <Label
                                                htmlFor={`option-${index}`}
                                                className={`flex items-center w-full cursor-pointer p-6 rounded-2xl border-2 transition-all font-bold text-lg min-h-[80px] ${selectedAnswers[currentQuestion] === index
                                                    ? "bg-primary text-primary-foreground border-primary shadow-xl -translate-y-1"
                                                    : "bg-muted/10 border-border/5 hover:border-primary/30 hover:bg-muted/20"
                                                    }`}
                                            >
                                                <span className={`mr-4 h-8 w-8 rounded-lg flex items-center justify-center border-2 transition-all ${selectedAnswers[currentQuestion] === index
                                                    ? "bg-white/20 border-white/40"
                                                    : "bg-background border-border"
                                                    }`}>
                                                    {String.fromCharCode(65 + index)}
                                                </span>
                                                {option}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-4 pt-6 border-t border-border/5">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                                disabled={currentQuestion === 0}
                                className="h-14 px-8 rounded-2xl font-black border-2 border-border/5"
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={selectedAnswers[currentQuestion] === undefined}
                                className="flex-1 h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                            >
                                {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Results Screen
    const isPassed = score >= 70
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md border-none rounded-[3rem] shadow-2xl p-10 overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 ${isPassed ? 'bg-green-500' : 'bg-destructive'}`} />

                <DialogHeader className="text-center pt-4">
                    <DialogTitle className="text-3xl font-black tracking-tight">Quiz Results</DialogTitle>
                </DialogHeader>

                <div className="space-y-8 py-6 text-center">
                    <div className="flex justify-center relative">
                        <div className={`h-24 w-24 rounded-full flex items-center justify-center animate-in zoom-in duration-500 ${isPassed ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                            {isPassed ? (
                                <CheckCircle className="h-16 w-16 text-green-600" />
                            ) : (
                                <XCircle className="h-16 w-16 text-destructive" />
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="relative inline-block">
                            <h3 className={`text-7xl font-black ${isPassed ? 'text-green-600' : 'text-destructive'}`}>
                                {score}%
                            </h3>
                        </div>
                        <p className="text-xl font-black text-foreground mt-4 uppercase tracking-tight">
                            {isPassed ? '🎉 Goal Achieved!' : '😔 Keep Improving'}
                        </p>
                        <p className="text-muted-foreground font-bold text-sm mt-1 px-4">
                            {isPassed
                                ? 'Excellent work! You have mastered this topic and unlocked the next lesson.'
                                : 'A 70% score is required to proceed. Would you like to try again or review?'}
                        </p>
                    </div>

                    <Card className="bg-muted/10 border-none rounded-[2rem] shadow-inner">
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Correct Answers</span>
                                    <span className="font-black text-foreground text-lg">
                                        {Math.round((score / 100) * questions.length)}/{questions.length}
                                    </span>
                                </div>
                                <div className="h-px bg-border/5" />
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Passing Requirement</span>
                                    <span className="font-black text-foreground text-lg">70%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-3 pt-4">
                        {isPassed ? (
                            <Button onClick={handleClose} className="h-16 rounded-[1.5rem] font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                                Unlock Next Lesson
                            </Button>
                        ) : (
                            <>
                                <Button onClick={handleRetake} className="h-16 rounded-[1.5rem] font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                                    Try Again
                                </Button>
                                <Button onClick={handleClose} variant="outline" className="h-16 rounded-[1.5rem] font-black border-2 border-border/10">
                                    Review Lesson
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
