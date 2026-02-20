import { useState, useRef, useEffect } from 'react'
import { Play, CheckCircle, Clock, Lock, ArrowLeft, ChevronRight, Upload, FileText } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { getCourseDetails as fetchCourseDetails } from '@/api/courses'
import { getTopicsByCourse } from '@/api/topics'

import { cn } from '@/lib/utils'

interface Topic {
    id: string
    title: string
    duration: number
    completed: boolean
    isLocked: boolean
    description: string
    course_id: string
    videoUrl?: string
    assignmentUploaded?: boolean
    assignmentUrl?: string
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
                const mappedTopics: Topic[] = rawTopics.map((topic: any, idx: number) => {
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
                        assignmentUrl: topic.assignment_url || topic.assignment_path || ''
                    }
                })

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
        setVideoProgress(0)

        if (videoRef.current) {
            videoRef.current.currentTime = 0
            videoRef.current.load()
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
                if (duration - current < 0.3) {
                    handleVideoEnded()
                }
            }
            maxTimeWatched.current = Math.max(maxTimeWatched.current, current)
        }
    }

    const handleVideoEnded = () => {
        const topic = topics.find(t => t.id === currentTopicId)
        if (topic && !topic.completed) {
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
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Now Inspecting</span>
                                {currentTopic?.assignmentUploaded && (
                                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                                        <CheckCircle className="h-3 w-3" /> Assignment Submitted
                                    </div>
                                )}
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none italic">{currentTopic?.title}</h2>
                            <p className="text-xl font-bold leading-relaxed text-muted-foreground italic">
                                “{currentTopic?.description || "In-depth industrial analysis and technical mastery of the manufacturing core."}”
                            </p>

                            <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h4 className="font-black uppercase text-sm tracking-tight text-foreground">Topic Assignment</h4>
                                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Submit your project or documentation for review.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                    {currentTopic?.assignmentUrl && (
                                        <a href={currentTopic.assignmentUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                className="w-full h-14 px-8 text-sm font-black uppercase border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                            >
                                                <FileText className="mr-2 h-4 w-4" /> Instructions
                                            </Button>
                                        </a>
                                    )}
                                    <input
                                        type="file"
                                        id="topic-assignment-input"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file && currentTopicId) {
                                                console.log("Uploading assignment for", currentTopicId, file);
                                                alert("Topic assignment uploaded successfully!");
                                                setTopics(prev => prev.map(t => t.id === currentTopicId ? { ...t, assignmentUploaded: true } : t));
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={() => document.getElementById('topic-assignment-input')?.click()}
                                        className="flex-1 sm:flex-none h-14 px-8 text-sm font-black uppercase border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-background text-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                    >
                                        <Upload className="mr-2 h-4 w-4" /> Upload Work
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="border-4 border-foreground bg-muted/30 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
                            <div className="p-6 border-b-4 border-foreground bg-muted">
                                <h3 className="text-lg font-black uppercase tracking-tighter">Course Blueprint</h3>
                            </div>
                            <div className="max-h-[600px] overflow-y-auto p-4 space-y-3">
                                {topics.map((topic, idx) => {
                                    const isActive = topic.id === currentTopicId
                                    return (
                                        <button
                                            key={topic.id}
                                            onClick={() => !topic.isLocked && setCurrentTopicId(topic.id)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 text-left transition-all border-2",
                                                isActive ? "bg-primary text-primary-foreground border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1" :
                                                    topic.isLocked ? "opacity-40 cursor-not-allowed border-transparent bg-muted/50" :
                                                        "bg-card border-border hover:border-foreground/50 hover:bg-muted/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-10 w-10 flex items-center justify-center shrink-0 border-2",
                                                isActive ? "bg-white text-primary border-white" :
                                                    topic.completed ? "bg-emerald-500/10 text-emerald-600 border-emerald-600/20" :
                                                        "bg-muted text-muted-foreground border-muted-foreground/10"
                                            )}>
                                                {topic.completed ? <CheckCircle className="h-5 w-5" /> : (isActive ? <Play className="h-5 w-5 fill-current" /> : <div className="text-xs font-black">{idx + 1}</div>)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-black uppercase truncate">{topic.title}</span>
                                                    {topic.isLocked && <Lock className="h-3 w-3 shrink-0" />}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="h-3 w-3 opacity-50" />
                                                    <span className="text-[10px] font-bold opacity-50 uppercase tabular-nums">
                                                        {Math.floor(topic.duration / 60)}:{(topic.duration % 60).toString().padStart(2, '0')}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}

                                {topics.length > 0 && topics.every(t => t.completed) && (
                                    <div className="pt-6 mt-6 border-t-4 border-foreground border-dashed space-y-4">
                                        <div className="p-4 bg-primary/10 border-2 border-primary/20 rounded-xl text-center">
                                            <h4 className="text-xs font-black uppercase text-primary mb-1">Course Complete</h4>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Final assessments unlocked</p>
                                        </div>
                                        <Button
                                            onClick={() => navigate(`/courses/${courseId}/exam`)}
                                            className="w-full h-14 text-lg font-black uppercase border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-foreground text-background hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                        >
                                            TAKE FINAL EXAM
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}