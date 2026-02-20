import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { getQuizByTopic } from '@/api/quiz'
import { getTopicsByCourse } from '@/api/topics'
import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, RotateCcw, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizOption {
    id: string
    text: string
}

interface QuizQuestion {
    id: string
    question: string
    options: QuizOption[]
    correctAnswerIndex: number
    topicTitle?: string
}

export default function CourseExamPage() {
    const { id: courseId } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [questions, setQuestions] = useState<QuizQuestion[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [visited, setVisited] = useState<Set<number>>(new Set([0]))
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    useEffect(() => {
        const loadExam = async () => {
            if (!courseId) return
            setLoading(true)
            try {
                // 1. Get Topics
                const topicsRes = await getTopicsByCourse(courseId)
                const topics = Array.isArray(topicsRes.data) ? topicsRes.data : []

                // 2. Get Questions for each topic
                const allQuestions: QuizQuestion[] = []

                // Fetch sequentially to modify questions array
                await Promise.all(topics.map(async (topic: any) => {
                    try {
                        const quizRes = await getQuizByTopic(topic.id)
                        let quizData = []
                        if (Array.isArray(quizRes.data)) quizData = quizRes.data
                        else if (quizRes.data?.questions) quizData = quizRes.data.questions
                        else if (quizRes.data?.data?.questions) quizData = quizRes.data.data.questions

                        const topicQuestions = quizData.map((q: any, qIdx: number) => {
                            const optionsList = q.quiz_options || q.options || []
                            const options = optionsList.map((opt: any, optIdx: number) => ({
                                id: opt.id || `opt-${optIdx}`,
                                text: opt.option_text || opt.text
                            }))

                            let correctIdx = optionsList.findIndex((opt: any) =>
                                opt.is_correct === true || opt.is_correct === "true" || opt.isCorrect === true
                            )
                            if (correctIdx === -1) correctIdx = 0

                            return {
                                id: q.id || `q-${topic.id}-${qIdx}`,
                                question: q.question_text || q.question,
                                options,
                                correctAnswerIndex: correctIdx,
                                topicTitle: topic.title
                            }
                        })
                        allQuestions.push(...topicQuestions)
                    } catch (e) {
                        // Ignore empty quizzes
                    }
                }))

                setQuestions(allQuestions)
            } catch (error) {
                console.error("Exam load error", error)
            } finally {
                setLoading(false)
            }
        }
        loadExam()
    }, [courseId])

    const handleOptionSelect = (optionId: string) => {
        if (submitted) return
        const currentQ = questions[currentQuestionIndex]
        setAnswers({
            ...answers,
            [currentQ.id]: optionId
        })
    }

    const handleNavigation = (index: number) => {
        if (index < 0 || index >= questions.length) return
        setCurrentQuestionIndex(index)
        setVisited(prev => new Set([...prev, index]))
    }

    const handleSubmit = () => {
        if (!questions.length) return

        let correctCount = 0
        questions.forEach(q => {
            const selectedOptId = answers[q.id]
            const correctOpt = q.options[q.correctAnswerIndex]
            if (correctOpt && selectedOptId === correctOpt.id) {
                correctCount++
            }
        })

        const finalScore = Math.round((correctCount / questions.length) * 100)
        setScore(finalScore)
        setSubmitted(true)
    }

    const PASS_THRESHOLD = 85

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background p-8 text-center space-y-6">
                <h1 className="text-4xl font-black uppercase">No Questions Found</h1>
                <p className="text-muted-foreground">This course does not have any exam questions configured.</p>
                <Button onClick={() => navigate(`/courses/${courseId}`)} variant="outline">Back to Course</Button>
            </div>
        )
    }

    if (submitted) {
        const passed = score >= PASS_THRESHOLD

        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="max-w-2xl w-full border-4 border-foreground bg-card p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center space-y-8">
                    <div className={cn(
                        "w-40 h-40 mx-auto rounded-full flex items-center justify-center border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
                        passed ? "bg-emerald-500" : "bg-destructive"
                    )}>
                        {passed ? <CheckCircle2 className="w-20 h-20 text-white" /> : <AlertCircle className="w-20 h-20 text-white" />}
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-6xl font-black uppercase italic tracking-tighter">{score}%</h1>
                        <p className="text-xl font-bold uppercase tracking-widest">
                            {passed ? "Exam Passed" : "Exam Failed"}
                        </p>
                        <p className="text-muted-foreground">
                            {passed
                                ? "Congratulations! You have successfully completed the course requirements."
                                : "You did not meet the minimum passing score of 85%. Please review the material and try again."
                            }
                        </p>
                    </div>

                    <div className="flex gap-4 justify-center pt-8">
                        {passed ? (
                            <Button onClick={() => navigate(`/courses/${courseId}/assignment`)} className="h-14 px-8 text-lg font-black uppercase border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                <Award className="mr-2 w-5 h-5" /> Proceed to Assignment
                            </Button>
                        ) : (
                            <Button onClick={() => {
                                setSubmitted(false);
                                setAnswers({});
                                setVisited(new Set([0]));
                                setCurrentQuestionIndex(0);
                                setScore(0);
                            }} className="h-14 px-8 text-lg font-black uppercase border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-background hover:bg-muted/10 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                <RotateCcw className="mr-2 w-5 h-5" /> Retake Exam
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const currentQ = questions[currentQuestionIndex]

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* LEFT: Question Area */}
            <div className="flex-1 p-8 md:p-12 flex flex-col h-screen overflow-y-auto">
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-xl font-black uppercase tracking-tighter text-muted-foreground">Final Examination</h1>
                    <div className="text-sm font-bold uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </div>
                </div>

                <div className="flex-1 space-y-8">
                    <h2 className="text-3xl md:text-4xl font-black leading-tight">
                        {currentQ.question}
                    </h2>

                    <div className="grid gap-4 max-w-2xl">
                        {currentQ.options.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => handleOptionSelect(opt.id)}
                                className={cn(
                                    "text-left p-6 rounded-xl border-4 font-bold transition-all uppercase tracking-tight text-lg relative group",
                                    answers[currentQ.id] === opt.id
                                        ? "bg-primary border-foreground text-primary-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                                        : "bg-background border-muted-foreground/20 hover:border-foreground/50 hover:bg-muted/5"
                                )}
                            >
                                <span className="mr-4 opacity-50 text-sm group-hover:opacity-100 transition-opacity">
                                    {String.fromCharCode(65 + currentQ.options.findIndex(o => o.id === opt.id))}
                                </span>
                                {opt.text}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center pt-8 border-t">
                    <Button
                        disabled={currentQuestionIndex === 0}
                        onClick={() => handleNavigation(currentQuestionIndex - 1)}
                        variant="ghost"
                        className="font-black uppercase tracking-widest"
                    >
                        <ChevronLeft className="mr-2 w-5 h-5" /> Previous
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            className="bg-green-500 text-black hover:bg-green-400 font-black h-12 px-8 uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all"
                        >
                            Submit Exam
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleNavigation(currentQuestionIndex + 1)}
                            className="font-black uppercase tracking-widest"
                        >
                            Next <ChevronRight className="ml-2 w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* RIGHT: Palette Sidebar */}
            <div className="w-full md:w-80 border-l bg-muted/5 p-6 h-screen overflow-y-auto hidden md:flex flex-col">
                <div className="mb-6">
                    <h3 className="font-black uppercase tracking-tighter text-lg mb-4">Question Palette</h3>
                    <div className="grid grid-cols-5 gap-3">
                        {questions.map((_, idx) => {
                            const isAnswered = !!answers[questions[idx].id]
                            const isCurrent = currentQuestionIndex === idx
                            const isVisited = visited.has(idx)

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleNavigation(idx)}
                                    className={cn(
                                        "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm border-2 transition-all",
                                        isCurrent ? "border-primary bg-primary/20 text-primary ring-2 ring-primary ring-offset-2" :
                                            isAnswered ? "bg-green-500 border-green-600 text-white" :
                                                isVisited ? "bg-white border-red-200 text-red-500" :
                                                    "bg-muted border-transparent text-muted-foreground opacity-50 hover:opacity-100"
                                    )}
                                >
                                    {idx + 1}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-auto space-y-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div> Answered
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-white border-2 border-red-200 text-red-500 flex items-center justify-center">1</div> Not Answered
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-muted border border-transparent opacity-50"></div> Not Visited
                    </div>
                </div>
            </div>
        </div>
    )
}
