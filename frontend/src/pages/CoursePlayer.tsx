import { useState, useRef, useEffect } from 'react'
import {
    Play, CheckCircle, Clock, Lock, ArrowLeft, ChevronRight,
    Upload, FileText, Award, List, AlertTriangle, Loader2
} from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { getCourseDetails as fetchCourseDetails } from '@/api/courses'
import { getTopicsByCourse } from '@/api/topics'
import { getAssignmentByCourse, submitAssignment } from '@/api/assignments'
import { cn } from '@/lib/utils'

/* ── types ─────────────────────────────────────────────────── */
interface VideoItem {
    id: string
    title: string
    url: string
    video_path?: string
    duration?: number
}

interface Topic {
    id: string
    title: string
    description: string
    course_id: string
    completed: boolean
    isLocked: boolean
    videos: VideoItem[]           // multiple videos
    primaryVideoUrl: string       // fallback single url
}

interface Course { title: string; description: string }

/* ── component ──────────────────────────────────────────────── */
export default function CoursePlayerPage() {
    const { id: courseId } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [course, setCourse] = useState<Course | null>(null)
    const [topics, setTopics] = useState<Topic[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Navigation state
    // 'topic' | 'assignment' | 'exam'
    const [view, setView] = useState<'topic' | 'assignment' | 'exam'>('topic')
    const [currentTopicId, setCurrentTopicId] = useState<string | null>(null)
    // Which video inside the topic is active (index)
    const [currentVideoIdx, setCurrentVideoIdx] = useState(0)
    const [videoProgress, setVideoProgress] = useState(0)

    // Assignment
    const [assignment, setAssignment] = useState<any>(null)
    const [assignmentFile, setAssignmentFile] = useState<File | null>(null)
    const [submittingAssignment, setSubmittingAssignment] = useState(false)
    const [assignmentSubmitted, setAssignmentSubmitted] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const maxTimeWatched = useRef(0)

    /* ── load ─── */
    useEffect(() => {
        const init = async () => {
            if (!courseId) return
            setLoading(true)
            try {
                const [courseRes, topicsRes, assignmentRes] = await Promise.all([
                    fetchCourseDetails(courseId),
                    getTopicsByCourse(courseId),
                    getAssignmentByCourse(courseId).catch(() => ({ data: null }))
                ])

                if (courseRes.data) {
                    setCourse({ title: courseRes.data.title || 'Course Player', description: courseRes.data.description || '' })
                }

                if (assignmentRes.data) setAssignment(assignmentRes.data)

                const raw = Array.isArray(topicsRes.data) ? topicsRes.data : []
                const mapped: Topic[] = raw.map((t: any, idx: number) => {
                    // Collect all videos for this topic
                    const vids: VideoItem[] = (Array.isArray(t.videos) && t.videos.length > 0)
                        ? t.videos.map((v: any) => ({
                            id: v.id,
                            title: v.title || t.title,
                            url: v.url || v.video_path || '',
                            video_path: v.video_path,
                            duration: v.duration || 0,
                        }))
                        : (t.video_url ? [{
                            id: t.id + '-v',
                            title: t.title,
                            url: t.video_url,
                            duration: t.video_duration_seconds || 0,
                        }] : [])

                    return {
                        id: t.id,
                        title: t.title,
                        description: t.description || '',
                        course_id: t.course_id || courseId,
                        completed: false,
                        isLocked: idx !== 0,
                        videos: vids,
                        primaryVideoUrl: vids[0]?.url || '',
                    }
                })

                setTopics(mapped)
                if (mapped.length > 0) setCurrentTopicId(mapped[0].id)
            } catch (e: any) {
                setError('Failed to load the course content.')
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [courseId])

    /* ── reset video when topic/index changes ─── */
    useEffect(() => {
        maxTimeWatched.current = 0
        setVideoProgress(0)
        setCurrentVideoIdx(0)
        if (videoRef.current) {
            videoRef.current.currentTime = 0
            videoRef.current.load()
        }
    }, [currentTopicId])

    /* ── restricted playback ─── */
    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        const handleRate = () => { if (video.playbackRate !== 1) video.playbackRate = 1 }
        const handleSeek = () => {
            if (video.currentTime > maxTimeWatched.current) {
                video.currentTime = maxTimeWatched.current
                video.pause(); video.play()
            }
        }
        video.addEventListener('ratechange', handleRate)
        video.addEventListener('seeking', handleSeek)
        return () => {
            video.removeEventListener('ratechange', handleRate)
            video.removeEventListener('seeking', handleSeek)
        }
    }, [currentTopicId, currentVideoIdx])

    const handleTimeUpdate = () => {
        if (!videoRef.current) return
        const { currentTime, duration } = videoRef.current
        if (duration > 0) {
            setVideoProgress((currentTime / duration) * 100)
            if (duration - currentTime < 0.3) handleVideoEnded()
        }
        maxTimeWatched.current = Math.max(maxTimeWatched.current, currentTime)
    }

    const handleVideoEnded = () => {
        const topic = topics.find(t => t.id === currentTopicId)
        if (!topic) return

        const isLastVideo = currentVideoIdx >= topic.videos.length - 1
        if (!isLastVideo) {
            // auto-advance to next video in topic
            const next = currentVideoIdx + 1
            setCurrentVideoIdx(next)
            maxTimeWatched.current = 0
            setVideoProgress(0)
        } else if (!topic.completed) {
            completeTopic(topic.id)
        }
    }

    const completeTopic = (id: string) => {
        setTopics(prev => {
            const idx = prev.findIndex(t => t.id === id)
            if (idx === -1) return prev
            const next = [...prev]
            next[idx] = { ...next[idx], completed: true }
            if (idx + 1 < next.length) next[idx + 1] = { ...next[idx + 1], isLocked: false }
            return next
        })
    }

    const handleAssignmentSubmit = async () => {
        if (!assignment || !assignmentFile) return
        setSubmittingAssignment(true)
        try {
            const fd = new FormData()
            fd.append('file', assignmentFile)
            await submitAssignment(assignment.id, fd)
            setAssignmentSubmitted(true)
        } catch (e) {
            alert('Submission failed. Please try again.')
        } finally {
            setSubmittingAssignment(false)
        }
    }

    /* ── derived ─── */
    const currentTopic = topics.find(t => t.id === currentTopicId)
    const currentVideos = currentTopic?.videos ?? []
    const currentVideo = currentVideos[currentVideoIdx]
    const allTopicsComplete = topics.length > 0 && topics.every(t => t.completed)
    const completedCount = topics.filter(t => t.completed).length

    /* ── loading / error ─── */
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs animate-pulse">Initializing Media...</p>
            </div>
        </div>
    )

    if (error) return (
        <div className="flex h-screen items-center justify-center bg-background px-6">
            <div className="max-w-md text-center">
                <h2 className="text-3xl font-black mb-2 uppercase italic tracking-tighter text-destructive">System Offline</h2>
                <p className="text-muted-foreground mb-8 font-medium">Unable to establish connection to the course server.</p>
                <Button onClick={() => navigate('/courses')} size="lg" className="w-full font-black">RE-ENTER CLASSROOM</Button>
            </div>
        </div>
    )

    /* ── views: assignment & exam ─── */
    const AssignmentView = () => (
        <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b-4 border-foreground pb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 border border-primary/20">Final Phase: Stage 01</span>
                <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none mt-4">{assignment?.title || 'Operational Project'}</h2>
                <div className="flex gap-2 mt-4">
                    <div className="h-1 w-20 bg-primary" />
                    <div className="h-1 w-10 bg-foreground/20" />
                </div>
                <p className="text-muted-foreground font-bold mt-6 italic bg-muted/30 p-4 border-l-4 border-primary">
                    “{assignment?.description || 'Implement the technical methodologies discussed in the course curriculum and submit your operational report for peer and instructor review.'}”
                </p>
            </div>

            {/* Stats */}
            {assignment && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Max Marks', value: assignment.max_marks },
                        { label: 'Pass Mark', value: assignment.passing_marks },
                        { label: 'Status', value: assignmentSubmitted ? 'SUBMITTED' : 'PENDING' }
                    ].map(stat => (
                        <div key={stat.label} className="border-4 border-foreground p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)]">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                            <p className={cn("text-2xl font-black mt-1", stat.label === 'Status' && assignmentSubmitted ? 'text-emerald-500' : '')}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Instructional briefing */}
            {assignment?.file_url && (
                <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                    <div className="flex items-center gap-4 p-5 border-4 border-foreground cursor-pointer hover:bg-muted/20 transition-colors group shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none bg-background">
                        <div className="h-14 w-14 bg-foreground text-background flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="font-black uppercase text-sm">Instructional Briefing Sheet</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Reference material & technical requirements</p>
                        </div>
                    </div>
                </a>
            )}

            {assignmentSubmitted ? (
                <div className="p-8 border-4 border-emerald-500 bg-emerald-500/5 text-center space-y-3 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.1)]">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                    <h3 className="text-2xl font-black uppercase">Assignment Submitted!</h3>
                    <p className="text-sm font-bold text-muted-foreground uppercase">Your work has been received and is under review.</p>
                    <Button
                        className="mt-4 h-14 px-10 font-black uppercase border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-foreground text-background hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                        onClick={() => navigate(`/courses/${courseId}/exam`)}
                    >
                        <Award className="mr-2 w-5 h-5" /> Proceed to Final Exam
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Upload Your Work</p>
                    <input type="file" id="assignment-submit-input" className="hidden" onChange={e => setAssignmentFile(e.target.files?.[0] || null)} />
                    <button
                        onClick={() => document.getElementById('assignment-submit-input')?.click()}
                        className={cn(
                            "w-full h-36 border-4 border-dashed flex flex-col items-center justify-center gap-3 transition-all",
                            assignmentFile
                                ? "border-emerald-500 bg-emerald-500/5"
                                : "border-foreground/30 hover:border-foreground hover:bg-muted/10"
                        )}
                    >
                        <Upload className={cn("w-10 h-10", assignmentFile ? "text-emerald-500" : "text-muted-foreground/40")} />
                        <div className="text-center">
                            <p className="font-black uppercase tracking-widest text-xs">
                                {assignmentFile ? assignmentFile.name : 'Select Submission File'}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">PDF, DOCX, ZIP accepted</p>
                        </div>
                    </button>

                    <Button
                        onClick={handleAssignmentSubmit}
                        disabled={!assignmentFile || submittingAssignment}
                        className="w-full h-16 text-lg font-black uppercase border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-foreground text-background hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-40 disabled:grayscale disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none"
                    >
                        {submittingAssignment ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                        {submittingAssignment ? 'Processing Transmission...' : 'Transmit Project Data'}
                    </Button>

                    <button
                        onClick={() => navigate(`/courses/${courseId}/exam`)}
                        className="w-full text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mt-2"
                    >
                        Skip assignment → Go to Final Exam
                    </button>
                </div>
            )}
        </div>
    )

    /* ── main render ─── */
    return (
        <div className="min-h-screen bg-background text-foreground">
            <style dangerouslySetInnerHTML={{ __html: `video::-webkit-media-controls-timeline{display:none!important}video::-webkit-media-controls-current-time-display{display:none!important}` }} />

            {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-6">
                        <Link to="/courses" className="h-10 w-10 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter truncate max-w-[280px] md:max-w-lg">{course?.title}</h1>
                            <p className="text-[10px] font-black italic text-muted-foreground mt-1">
                                {completedCount}/{topics.length} MODULES COMPLETE
                            </p>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="hidden md:flex items-center gap-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{Math.round((completedCount / (topics.length || 1)) * 100)}%</p>
                        <div className="h-2 w-36 bg-muted border border-foreground/10 overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-700" style={{ width: `${(completedCount / (topics.length || 1)) * 100}%` }} />
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* ── Left: Main content ── */}
                    <div className="lg:col-span-8 space-y-10">

                        {view === 'assignment' ? (
                            <AssignmentView />
                        ) : (
                            <>
                                {/* Video Player */}
                                <div className="space-y-4">
                                    <div className="relative aspect-video bg-black overflow-hidden rounded-3xl border-4 border-foreground shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)]">
                                        {currentVideo ? (
                                            <video
                                                key={`${currentTopicId}-${currentVideoIdx}`}
                                                ref={videoRef}
                                                className="h-full w-full object-cover"
                                                controls
                                                onEnded={handleVideoEnded}
                                                onTimeUpdate={handleTimeUpdate}
                                                controlsList="nodownload noplaybackrate"
                                                disablePictureInPicture
                                                playsInline
                                                src={currentVideo.url ? `/api/video?url=${encodeURIComponent(currentVideo.url)}` : `/api/video?topicId=${currentTopicId}`}
                                            >
                                                <source src={currentVideo.url ? `/api/video?url=${encodeURIComponent(currentVideo.url)}` : `/api/video?topicId=${currentTopicId}`} type="video/mp4" />
                                            </video>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-white/10 uppercase font-black italic text-2xl flex-col gap-2">
                                                <Play className="w-16 h-16 opacity-20" />
                                                No video for this topic
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress bar */}
                                    {currentVideo && (
                                        <div className="px-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                                <span>Stream Progress</span>
                                                <span className="tabular-nums text-primary">{Math.round(videoProgress)}%</span>
                                            </div>
                                            <div className="h-4 bg-muted border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
                                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Multi-video playlist for this topic */}
                                    {currentVideos.length > 1 && (
                                        <div className="border-4 border-foreground bg-muted/10 overflow-hidden">
                                            <div className="px-5 py-3 border-b-2 border-foreground/20 bg-muted/20 flex items-center gap-2">
                                                <List className="w-4 h-4" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Topic Videos ({currentVideos.length})</p>
                                            </div>
                                            <div className="divide-y divide-border">
                                                {currentVideos.map((v, i) => (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => {
                                                            setCurrentVideoIdx(i)
                                                            maxTimeWatched.current = 0
                                                            setVideoProgress(0)
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center gap-4 px-5 py-3 text-left transition-colors",
                                                            i === currentVideoIdx
                                                                ? "bg-foreground text-background"
                                                                : "hover:bg-muted/40"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "h-8 w-8 flex items-center justify-center shrink-0 border-2 text-[10px] font-black",
                                                            i === currentVideoIdx ? "border-background bg-white text-foreground" : "border-foreground/20"
                                                        )}>
                                                            {i === currentVideoIdx ? <Play className="w-3 h-3 fill-current" /> : i + 1}
                                                        </div>
                                                        <span className={cn("text-xs font-bold truncate", i === currentVideoIdx ? "text-background" : "")}>
                                                            {v.title || `Video ${i + 1}`}
                                                        </span>
                                                        {i < currentVideoIdx && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Topic Info */}
                                <div className="p-10 bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Now Inspecting</span>
                                        {currentTopic?.completed && (
                                            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 border border-emerald-500/20 uppercase tracking-widest">
                                                <CheckCircle className="h-3 w-3" /> Complete
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none italic">{currentTopic?.title}</h2>
                                    <p className="text-xl font-bold leading-relaxed text-muted-foreground italic">
                                        "{currentTopic?.description || 'In-depth industrial analysis and technical mastery of the manufacturing core.'}"
                                    </p>

                                    {currentTopic && !currentTopic.completed && (
                                        <div className="pt-6 border-t border-dashed border-foreground/20">
                                            <Button
                                                onClick={() => completeTopic(currentTopic.id)}
                                                className="h-12 px-8 font-black uppercase border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] bg-foreground text-background hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Complete
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Unlock certification banner */}
                                {allTopicsComplete && (
                                    <div
                                        className="border-4 border-foreground bg-foreground text-background p-8 flex items-center justify-between cursor-pointer group shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all animate-bounce"
                                        onClick={() => setView('assignment')}
                                    >
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Phase Two: Certification</p>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Enter Assessment Tier</h3>
                                            <p className="text-sm font-bold opacity-70 uppercase mt-1">Project Submission & Final MCQ Examination</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-black uppercase opacity-60">Status</p>
                                                <p className="text-xs font-black">UNLOCKED</p>
                                            </div>
                                            <ChevronRight className="w-10 h-10 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Right: Sidebar ── */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="border-4 border-foreground bg-muted/30 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden sticky top-28">
                            <div className="p-5 border-b-4 border-foreground bg-muted flex items-center justify-between">
                                <h3 className="text-lg font-black uppercase tracking-tighter">Course Blueprint</h3>
                                <span className="text-[9px] font-black bg-foreground text-background px-2 py-0.5">{completedCount}/{topics.length}</span>
                            </div>

                            <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
                                {/* Topic list */}
                                <div className="p-3 space-y-2">
                                    {topics.map((topic, idx) => {
                                        const isActive = topic.id === currentTopicId && view === 'topic'
                                        return (
                                            <button
                                                key={topic.id}
                                                onClick={() => {
                                                    if (topic.isLocked) return
                                                    setCurrentTopicId(topic.id)
                                                    setView('topic')
                                                    setCurrentVideoIdx(0)
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 text-left transition-all border-2",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
                                                        : topic.isLocked
                                                            ? "opacity-40 cursor-not-allowed border-transparent bg-muted/30"
                                                            : "bg-card border-border hover:border-foreground/50 hover:bg-muted/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-9 w-9 flex items-center justify-center shrink-0 border-2 text-xs font-black",
                                                    isActive ? "bg-white text-primary border-white" :
                                                        topic.completed ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                                                            "bg-muted text-muted-foreground border-muted-foreground/10"
                                                )}>
                                                    {topic.completed ? <CheckCircle className="h-4 w-4" /> : topic.isLocked ? <Lock className="h-3 w-3" /> : idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("text-xs font-black uppercase truncate", isActive ? "text-primary-foreground" : "")}>{topic.title}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Clock className="h-2.5 w-2.5 opacity-50" />
                                                        <span className="text-[9px] font-bold opacity-50 uppercase">{topic.videos.length} video{topic.videos.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Assignment row */}
                                {assignment && (
                                    <div className="px-3 pb-2 border-t-2 border-dashed border-foreground/10 pt-2 mt-2">
                                        <h4 className="text-[9px] font-black uppercase opacity-40 px-3 mb-2">Final Assessment</h4>
                                        <button
                                            onClick={() => { if (allTopicsComplete) setView('assignment') }}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 text-left transition-all border-2",
                                                view === 'assignment'
                                                    ? "bg-primary text-primary-foreground border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                    : allTopicsComplete
                                                        ? "border-foreground/30 hover:border-foreground hover:bg-muted/10"
                                                        : "opacity-30 cursor-not-allowed border-border"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-9 w-9 flex items-center justify-center shrink-0 border-2",
                                                view === 'assignment' ? "bg-white border-white" : "bg-muted border-muted-foreground/10"
                                            )}>
                                                {assignmentSubmitted
                                                    ? <CheckCircle className={cn("h-4 w-4", view === 'assignment' ? "text-primary" : "text-emerald-500")} />
                                                    : <FileText className={cn("h-4 w-4", view === 'assignment' ? "text-primary" : "text-muted-foreground")} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-xs font-black uppercase truncate", view === 'assignment' ? "text-primary-foreground" : "")}>Project Submission</p>
                                                <p className={cn("text-[9px] font-bold uppercase truncate opacity-60", view === 'assignment' ? "text-primary-foreground" : "")}>
                                                    {allTopicsComplete ? (assignmentSubmitted ? 'Verified' : 'Ready for upload') : 'Locked'}
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Final Exam row */}
                                <div className="px-3 pb-3">
                                    <button
                                        onClick={() => { if (allTopicsComplete) navigate(`/courses/${courseId}/exam`) }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 text-left transition-all border-2",
                                            allTopicsComplete
                                                ? "border-foreground bg-foreground text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                                                : "opacity-30 cursor-not-allowed border-border bg-muted/20"
                                        )}
                                    >
                                        <div className="h-9 w-9 flex items-center justify-center shrink-0 border-2 border-current/30">
                                            <Award className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black uppercase">Final Examination</p>
                                            <p className="text-[9px] font-bold uppercase opacity-60">
                                                {allTopicsComplete ? 'Commence Test' : 'Locked'}
                                            </p>
                                        </div>
                                        {allTopicsComplete && <ChevronRight className="h-4 w-4 shrink-0" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}