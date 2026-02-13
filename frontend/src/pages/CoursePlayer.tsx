import { useState, useRef, useEffect } from 'react'
import { Play, CheckCircle, Clock, Lock, ArrowLeft, ChevronRight } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { getQuizByTopic } from '@/api/quiz'
import { getCourseDetails as fetchCourseDetails } from '@/api/courses'
import { getTopicsByCourse } from '@/api/topics'
import { TopicQuizModal } from '@/components/course/topic-quiz-modal'
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
    const [videoProgress, setVideoProgress] = useState(0)

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

                            // Try multiple possible response structures
                            let quizData = []

                            if (Array.isArray(quizRes.data)) {
                                quizData = quizRes.data
                            } else if (quizRes.data?.questions) {
                                quizData = quizRes.data.questions
                            } else if (quizRes.data?.data?.questions) {
                                quizData = quizRes.data.data.questions
                            } else {
                                quizData = []
                            }

                            if (quizData.length === 0) {
                                // Fallback or just empty
                            }

                            questions = quizData.map((q: any, qIdx: number) => {
                                const options = (q.options || []).map((opt: any, optIdx: number) => ({
                                    id: opt.id || `opt-${optIdx}`,
                                    text: opt.option_text || opt.text
                                }))

                                let correctIdx = (q.options || []).findIndex((opt: any) =>
                                    opt.is_correct === true || opt.is_correct === "true" || opt.isCorrect === true
                                )

                                if (correctIdx === -1) correctIdx = 0 // Default to first if none marked

                                return {
                                    id: q.id || `q-${qIdx}`,
                                    question: q.question_text || q.question,
                                    options,
                                    correctAnswerIndex: correctIdx,
                                }
                            })
                        } catch (e: any) {
                            console.error('Quiz load error:', e)
                        }

                        // Resolve Video
                        const topicVideo = (topic.videos && topic.videos.length > 0) ? topic.videos[0] : (topic.video || null)
                        const vUrl = topicVideo?.url || topicVideo?.video_path || topic.video_url || ''
                        const vDuration = topicVideo?.duration || topic.duration || topic.video_duration_seconds || 0

                        return {
                            id: topic.id,
                            title: topic.title,
                            duration: Number(vDuration),
                            completed: false,
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
                setError('Failed to load the course content.')
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
        setVideoProgress(0)
        setIsQuizOpen(false)
        if (videoRef.current) {
            videoRef.current.currentTime = 0
            videoRef.current.load() // Ensure video source refreshes correctly
        }
    }, [currentTopicId])

    // Restricted Playback
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleRateChange = () => {
            if (video.playbackRate !== 1) video.playbackRate = 1
        }

        const handleSeeking = () => {
            if (video.currentTime > maxTimeWatched.current) {
                video.currentTime = maxTimeWatched.current
                video.pause()
                video.play()
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
            const current = videoRef.current.currentTime
            const duration = videoRef.current.duration
            if (duration > 0) {
                setVideoProgress((current / duration) * 100)

                // Backup trigger if onEnded fails (within 0.3s of end)
                if (duration - current < 0.3 && !isQuizOpen) {
                    handleVideoEnded()
                }
            }
            maxTimeWatched.current = Math.max(maxTimeWatched.current, current)
        }
    }

    const handleVideoEnded = () => {
        if (isQuizOpen) return

        const topic = topics.find(t => t.id === currentTopicId)

        if (topic && topic.questions && topic.questions.length > 0) {
            setIsQuizOpen(true)
        } else if (topic) {
            completeTopic(currentTopicId!)
        }
    }

    const completeTopic = (id: string) => {
        setTopics(prev => {
            const index = prev.findIndex(t => t.id === id)
            if (index === -1) return prev
            const newTopics = [...prev]
            newTopics[index] = { ...newTopics[index], completed: true }
            if (index + 1 < newTopics.length) {
                newTopics[index + 1] = { ...newTopics[index + 1], isLocked: false }
            }
            return newTopics
        })
    }

    const handleQuizSubmit = (score: number) => {
        if (score >= 85) {
            completeTopic(currentTopicId!)
            setIsQuizOpen(false)
        } else {
            // Reset video for retry
            setIsQuizOpen(false)
            if (videoRef.current) {
                videoRef.current.currentTime = 0
                maxTimeWatched.current = 0
                setVideoProgress(0)
            }
        }
    }

    const currentTopic = topics.find(t => t.id === currentTopicId)

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="font-bold text-muted-foreground animate-pulse leading-none uppercase tracking-widest text-xs">Initializing Media...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-background px-6">
                <div className="max-w-md text-center">
                    <h2 className="text-3xl font-black mb-2 uppercase italic tracking-tighter text-destructive">System Offline</h2>
                    <p className="text-muted-foreground mb-8 font-medium">Unable to establish connection to the course server.</p>
                    <Button onClick={() => navigate('/courses')} size="lg" className="w-full font-black rounded-xl">
                        RE-ENTER CLASSROOM
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <style dangerouslySetInnerHTML={{
                __html: `
                video::-webkit-media-controls-timeline { display: none !important; }
                video::-webkit-media-controls-current-time-display { display: none !important; }
            `}} />

            <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-6">
                        <Link to="/courses" className="h-10 w-10 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter truncate max-w-[300px] md:max-w-lg">
                                {course?.title}
                            </h1>
                            <div className="mt-1 flex items-center gap-3">
                                <span className="text-[10px] font-black italic text-muted-foreground">
                                    {topics.filter(t => t.completed).length}/{topics.length} MODULES COMPLETE
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <div className="h-2 w-32 bg-muted border border-foreground/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-700"
                                style={{ width: `${(topics.filter(t => t.completed).length / (topics.length || 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    <div className="lg:col-span-8 space-y-10">
                        {/* Video Layer */}
                        <div className="space-y-6">
                            <div className="relative aspect-video bg-black overflow-hidden rounded-3xl border-4 border-foreground shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)]">
                                {currentTopic ? (
                                    <video
                                        key={currentTopic.id}
                                        ref={videoRef}
                                        src={`/api/video?topicId=${currentTopic.id}`}
                                        className="h-full w-full object-cover"
                                        controls
                                        onEnded={handleVideoEnded}
                                        onTimeUpdate={handleTimeUpdate}
                                        onError={() => setVideoError('Playback Error')}
                                        controlsList="nodownload noplaybackrate"
                                        disablePictureInPicture
                                        playsInline
                                    >
                                        <source src={`/api/video?topicId=${currentTopic.id}`} type="video/mp4" />
                                    </video>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-white/10 uppercase font-black italic text-3xl">Ready for Launch</div>
                                )}
                            </div>

                            {/* No-Drag Progress Bar */}
                            <div className="px-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                    <span>Stream Progress</span>
                                    <span className="tabular-nums text-primary">{Math.round(videoProgress)}%</span>
                                </div>
                                <div className="h-4 bg-muted border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${videoProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Current Info */}
                        <div className="space-y-6 p-10 bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Now Inspecting</span>
                            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none italic">{currentTopic?.title}</h2>
                            <p className="text-xl font-bold leading-relaxed text-muted-foreground italic">
                                “{currentTopic?.description || "In-depth industrial analysis and technical mastery of the manufacturing core."}”
                            </p>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-30 space-y-4">
                            <div className="bg-foreground text-background p-6 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <h3 className="font-black uppercase tracking-tighter text-xl italic">Curriculum Plan</h3>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
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
                                                "w-full p-6 text-left border-4 transition-all duration-300",
                                                isActive ? "bg-primary/10 border-primary translate-x-1" : "bg-card border-foreground/10 hover:border-foreground grayscale-[0.5] hover:grayscale-0",
                                                isLocked && "opacity-20 cursor-not-allowed pointer-events-none"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl font-black tabular-nums opacity-20 italic">0{index + 1}</span>
                                                <div className="flex-1">
                                                    <p className="font-black uppercase tracking-tighter text-sm leading-none">{topic.title}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">{topic.duration > 60 ? `${Math.ceil(topic.duration / 60)} Mins` : `${topic.duration} Secs`}</p>
                                                </div>
                                                {isCompleted ? <CheckCircle className="text-green-500 w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4 text-muted-foreground" /> : null}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* THE POP-UP BOX (Modal) */}
            {currentTopic && (
                <TopicQuizModal
                    isOpen={isQuizOpen}
                    topicTitle={currentTopic.title}
                    questions={currentTopic.questions}
                    onClose={() => setIsQuizOpen(false)}
                    onSubmit={handleQuizSubmit}
                />
            )}
        </div>
    )
}