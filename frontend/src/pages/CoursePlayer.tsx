import { useState, useRef, useEffect } from 'react'
import { Play, CheckCircle, Clock, Lock, ArrowLeft, MoreVertical, ChevronRight } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { getQuizByTopic } from '@/api/quiz'
import { getCourseDetails as fetchCourseDetails } from '@/api/courses'
import { TopicQuizModal } from '@/components/course/topic-quiz-modal'
import { getTopicsByCourse } from '@/api/topics'
import { cn } from '@/lib/utils'

interface QuizQuestion {
    id: string
    question: string
    options: { id: string; text: string }[]
    correctAnswerIndex: number
}

interface Topic {
    id: string
    title: string
    duration: number
    completed: boolean
    isLocked: boolean
    description: string
    course_id: string
    questions: QuizQuestion[]
    videoUrl?: string
}

interface Course {
    title: string
    description: string
}

export default function CoursePlayerPage() {
    const { id: courseId } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [course, setCourse] = useState<Course | null>(null)
    const [topics, setTopics] = useState<Topic[]>([])
    const [currentTopicId, setCurrentTopicId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isQuizOpen, setIsQuizOpen] = useState(false)
    const [videoError, setVideoError] = useState<string | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const maxTimeWatched = useRef(0)

    // Load Course and Topics
    useEffect(() => {
        const initPlayer = async () => {
            if (!courseId) return
            setLoading(true)

            try {
                const [courseRes, topicsRes] = await Promise.all([
                    fetchCourseDetails(courseId),
                    getTopicsByCourse(courseId)
                ])

                if (courseRes.data) {
                    setCourse({
                        title: courseRes.data.title || 'Course Player',
                        description: courseRes.data.description || ''
                    })
                }

                const rawTopics = Array.isArray(topicsRes.data) ? topicsRes.data : []
                const mappedTopics: Topic[] = await Promise.all(
                    rawTopics.map(async (topic: any, idx: number) => {
                        // Fetch Quiz
                        let questions: QuizQuestion[] = []
                        try {
                            const quizRes = await getQuizByTopic(topic.id)
                            const quizData = quizRes.data?.questions || []
                            questions = quizData.map((q: any) => ({
                                id: q.id,
                                question: q.question_text,
                                options: (q.options || []).map((opt: any) => ({
                                    id: opt.id,
                                    text: opt.option_text
                                })),
                                correctAnswerIndex: (q.options || []).findIndex((opt: any) => opt.is_correct) ?? 0,
                            }))
                        } catch (e) { /* No quiz */ }

                        // Resolve Video
                        const topicVideo = (topic.videos && topic.videos.length > 0) ? topic.videos[0] : (topic.video || null)
                        const vUrl = topicVideo?.url || topicVideo?.video_path || topic.video_url || ''
                        const vDuration = topicVideo?.duration || topic.duration || topic.video_duration_seconds || 0

                        return {
                            id: topic.id,
                            title: topic.title,
                            duration: Number(vDuration),
                            completed: false, // In a real app, track from user_progress
                            isLocked: idx !== 0,
                            videoUrl: vUrl,
                            description: topic.description || '',
                            course_id: topic.course_id || courseId,
                            questions,
                        }
                    })
                )

                setTopics(mappedTopics)
                if (mappedTopics.length > 0) {
                    setCurrentTopicId(mappedTopics[0].id)
                }
            } catch (err: any) {
                console.error('Failed to load course player:', err)
                setError('Failed to load the course content. Please try again later.')
            } finally {
                setLoading(false)
            }
        }

        initPlayer()
    }, [courseId])

    // Reset progress and handle logic when current topic changes
    useEffect(() => {
        maxTimeWatched.current = 0
        setVideoError(null)
        if (videoRef.current) {
            videoRef.current.currentTime = 0
        }
    }, [currentTopicId])

    // Restricted Playback & Speed Control
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleRateChange = () => {
            if (video.playbackRate !== 1) video.playbackRate = 1
        }

        const handleSeeking = () => {
            if (video.currentTime > maxTimeWatched.current) {
                video.currentTime = maxTimeWatched.current
            }
        }

        video.addEventListener('ratechange', handleRateChange)
        video.addEventListener('seeking', handleSeeking)

        return () => {
            video.removeEventListener('ratechange', handleRateChange)
            video.removeEventListener('seeking', handleSeeking)
        }
    }, [currentTopicId])

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            maxTimeWatched.current = Math.max(maxTimeWatched.current, videoRef.current.currentTime)
        }
    }

    const handleVideoEnded = () => {
        const currentTopic = topics.find(t => t.id === currentTopicId)
        if (currentTopic?.questions && currentTopic.questions.length > 0) {
            setIsQuizOpen(true)
        } else {
            // If no quiz, auto complete and unlock next
            completeTopic(currentTopicId!)
        }
    }

    const completeTopic = (id: string) => {
        setTopics(prev => {
            const index = prev.findIndex(t => t.id === id)
            const newTopics = [...prev]
            newTopics[index] = { ...newTopics[index], completed: true }
            if (index + 1 < newTopics.length) {
                newTopics[index + 1] = { ...newTopics[index + 1], isLocked: false }
            }
            return newTopics
        })
    }

    const handleQuizSubmit = async (answers: Record<string, string>) => {
        const topic = topics.find(t => t.id === currentTopicId)
        if (!topic) return

        const correctCount = topic.questions.reduce((acc, q) => {
            const selectedOptIdx = q.options.findIndex(o => o.id === answers[q.id])
            return selectedOptIdx === q.correctAnswerIndex ? acc + 1 : acc
        }, 0)

        const score = (correctCount / topic.questions.length) * 100

        if (score >= 85) {
            completeTopic(currentTopicId!)
            setIsQuizOpen(false)
            alert(`Passed! Score: ${score.toFixed(0)}%. Next module unlocked.`)
        } else {
            alert(`Score: ${score.toFixed(0)}%. You need 85% to pass. Try watching the video again.`)
            setIsQuizOpen(false)
            if (videoRef.current) {
                videoRef.current.currentTime = 0
                maxTimeWatched.current = 0
            }
        }
    }

    const currentTopic = topics.find(t => t.id === currentTopicId)

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="font-bold text-muted-foreground animate-pulse leading-none">Initializing Player...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-background px-6">
                <div className="max-w-md text-center">
                    <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive text-4xl font-black">!</div>
                    <h2 className="text-3xl font-black mb-2 text-foreground uppercase tracking-tight">Access Error</h2>
                    <p className="text-muted-foreground mb-8 font-medium">There was a problem loading your session. Please check your connection.</p>
                    <Button onClick={() => navigate('/courses')} size="lg" className="w-full font-black rounded-xl">
                        <ArrowLeft className="mr-2 h-5 w-5" /> RE-ENTER CLASSROOM
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Premium Header */}
            <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-6">
                        <Link
                            to="/courses"
                            className="group flex items-center justify-center h-10 w-10 rounded-full border border-border/60 bg-background hover:bg-muted transition-all duration-300 active:scale-95"
                        >
                            <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black tracking-tight leading-none uppercase truncate max-w-[300px] md:max-w-lg">
                                {course?.title}
                            </h1>
                            <div className="mt-1.5 flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                                    <Play className="h-2.5 w-2.5 fill-current" /> Auto-Progress
                                </div>
                                <span className="text-xs font-bold text-muted-foreground tabular-nums tracking-wide">
                                    {topics.filter(t => t.completed).length}/{topics.length} COMPLETE
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-700 ease-out"
                                style={{ width: `${(topics.filter(t => t.completed).length / (topics.length || 1)) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs font-black text-muted-foreground tabular-nums bg-muted/30 px-2 py-1 rounded-md border border-border/50">
                            {Math.round((topics.filter(t => t.completed).length / (topics.length || 1)) * 100)}%
                        </span>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Player & Info (2/3) */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* The Video Container */}
                        <div className="group relative aspect-video overflow-hidden rounded-[2.5rem] bg-black shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                            {currentTopic ? (
                                <>
                                    {videoError ? (
                                        <div className="flex flex-col items-center justify-center h-full p-12 text-center text-white/50 space-y-4">
                                            <Lock className="h-16 w-16 mb-4 opacity-20" />
                                            <p className="text-xl font-black uppercase tracking-widest">Media Server Error</p>
                                            <p className="text-sm font-medium opacity-60 max-w-[280px]">The video stream is currently unreachable. Please refresh or contact support.</p>
                                            <Button variant="outline" onClick={() => window.location.reload()} className="bg-white/5 border-white/10 hover:bg-white/10 text-white mt-4 font-black">RETRY CONNECTION</Button>
                                        </div>
                                    ) : (
                                        <video
                                            key={currentTopic.id}
                                            ref={videoRef}
                                            src={`/api/video?topicId=${currentTopic.id}`}
                                            className="h-full w-full object-cover"
                                            controls
                                            onEnded={handleVideoEnded}
                                            onTimeUpdate={handleTimeUpdate}
                                            onError={() => setVideoError('Playback interrupted')}
                                            controlsList="nodownload noplaybackrate"
                                            disablePictureInPicture
                                            playsInline
                                            preload="metadata"
                                        >
                                            <source src={`/api/video?topicId=${currentTopic.id}`} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-2xl font-black text-white/20 uppercase tracking-tighter italic">Initializing Media Stream...</p>
                                </div>
                            )}
                        </div>

                        {/* Topic Info */}
                        <div className="space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 block">Currently Playing</span>
                                    <h2 className="text-4xl font-black tracking-tight leading-tight uppercase">
                                        {currentTopic?.title}
                                    </h2>
                                </div>
                                {currentTopic?.completed && (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-white">
                                        <CheckCircle className="h-6 w-6" />
                                    </div>
                                )}
                            </div>

                            <div className="rounded-[2rem] bg-card/50 border border-border/40 p-10 hover:border-primary/20 transition-colors duration-300">
                                <h3 className="text-lg font-black uppercase tracking-widest mb-4">Module Insight</h3>
                                <p className="text-xl font-medium leading-relaxed text-muted-foreground italic">
                                    {currentTopic?.description || "In this module, we dive deep into the core mechanics and industry-standard practices relevant to the topic."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Topics List (1/3) */}
                    <div className="lg:col-span-4 lg:pl-4">
                        <div className="sticky top-[7.5rem] rounded-[2.5rem] bg-card border border-border/60 shadow-2xl shadow-black/5 overflow-hidden">
                            <div className="bg-muted/30 px-8 py-6 border-b border-border/40 flex items-center justify-between">
                                <h3 className="font-black uppercase tracking-widest text-sm text-foreground/80">Curriculum</h3>
                                <div className="text-[10px] font-black bg-foreground text-background px-2.5 py-1 rounded-full">{topics.length} MODULES</div>
                            </div>

                            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {topics.map((topic, index) => {
                                    const isActive = topic.id === currentTopicId
                                    const isLocked = topic.isLocked
                                    const isCompleted = topic.completed

                                    return (
                                        <button
                                            key={topic.id}
                                            disabled={isLocked}
                                            onClick={() => setCurrentTopicId(topic.id)}
                                            className={cn(
                                                "flex w-full items-center gap-5 p-6 text-left transition-all duration-300 border-b border-border/30 last:border-none",
                                                isActive ? "bg-primary/[0.03]" : "hover:bg-muted/40",
                                                isLocked && "opacity-40 cursor-not-allowed grayscale-[0.8]"
                                            )}
                                        >
                                            <div className={cn(
                                                "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-500",
                                                isActive ? "bg-primary border-primary shadow-[0_8px_20px_rgba(var(--primary),0.3)]" : "bg-background border-border/80 shadow-sm",
                                                isCompleted && !isActive && "bg-emerald-50 border-emerald-200 text-emerald-600"
                                            )}>
                                                {isCompleted ? (
                                                    <CheckCircle className={cn("h-6 w-6", isActive ? "text-white" : "text-emerald-500")} />
                                                ) : isLocked ? (
                                                    <Lock className="h-5 w-5 text-muted-foreground/50" />
                                                ) : (
                                                    <Play className={cn("h-5 w-5", isActive ? "text-white fill-current" : "text-primary")} />
                                                )}
                                                {isActive && (
                                                    <span className="absolute -right-1 -top-1 flex h-4 w-4">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-white/20"></span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 space-y-1.5 min-w-0">
                                                <p className={cn(
                                                    "truncate text-sm font-black uppercase tracking-tight",
                                                    isActive ? "text-primary" : "text-foreground/90"
                                                )}>
                                                    {index + 1}. {topic.title}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground/60">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span className="text-[11px] font-bold tabular-nums">
                                                            {topic.duration > 0 ? (topic.duration > 120 ? `${Math.ceil(topic.duration / 60)} Mins` : `${topic.duration} Secs`) : "TBD"}
                                                        </span>
                                                    </div>
                                                    {isActive && (
                                                        <div className="text-[9px] font-black uppercase bg-primary text-white px-2 py-0.5 rounded shadow-sm">NOW PLAYING</div>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className={cn(
                                                "h-5 w-5 shrink-0 transition-transform duration-300",
                                                isActive ? "translate-x-1 text-primary" : "text-border/80 opacity-0 group-hover:opacity-100"
                                            )} />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Quiz Overlay */}
            {currentTopic && isQuizOpen && (
                <TopicQuizModal
                    topic={currentTopic}
                    onSubmit={handleQuizSubmit}
                    onClose={() => setIsQuizOpen(false)}
                />
            )}
        </div>
    )
}