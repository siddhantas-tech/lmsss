import { useState, useEffect } from 'react'
import {
    Play, CheckCircle, Clock, Lock, ArrowLeft,
    Upload, FileText, List, Loader2
} from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { getCourseDetails } from '@/api/courses'
import { getTopicsByCourse } from '@/api/topics'
import { getAssignmentByCourse, submitAssignment } from '@/api/assignments'
import { getFinalExamByCourse } from '@/api/quiz'

export default function CoursePlayerPage() {
    const { id: courseId } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [course, setCourse] = useState<any>(null)
    const [topics, setTopics] = useState<any[]>([])
    const [activeTopicIndex, setActiveTopicIndex] = useState(0)
    const [activeVideoIndex, setActiveVideoIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set())

    const [phase, setPhase] = useState<'curriculum' | 'assignment' | 'exam'>('curriculum')

    const [assignment, setAssignment] = useState<any>(null)
    const [assignmentFile, setAssignmentFile] = useState<File | null>(null)
    const [submittingAssignment, setSubmittingAssignment] = useState(false)
    const [assignmentSubmitted, setAssignmentSubmitted] = useState(false)

    useEffect(() => {
        if (!courseId) return
        const load = async () => {
            try {
                console.log("Loading course data for courseId:", courseId);
                const [cRes, tRes, aRes] = await Promise.all([
                    getCourseDetails(courseId).catch(err => {
                        console.error("Failed to load course details:", err);
                        return { data: null };
                    }),
                    getTopicsByCourse(courseId).catch(err => {
                        console.error("Failed to load topics:", err);
                        return { data: [] };
                    }),
                    getAssignmentByCourse(courseId).catch(err => {
                        console.error("Failed to load assignment:", err);
                        return { data: null };
                    })
                ])
                
                console.log("Course data:", cRes.data);
                console.log("Topics data:", tRes.data);
                console.log("Assignment data:", aRes.data);
                
                setCourse(cRes.data)
                setTopics(tRes.data || [])
                
                const aData = aRes.data;
                const foundAssignment = Array.isArray(aData) ? aData[0] : (aData?.assignment || aData?.assignments?.[0] || aData);
                console.log("Found assignment:", foundAssignment);
                setAssignment(foundAssignment && typeof foundAssignment === 'object' && (foundAssignment.id || foundAssignment._id) ? foundAssignment : null)
            } catch (e) {
                console.error("Error loading course data:", e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [courseId])

    const activeTopic = topics[activeTopicIndex]
    const activeVideos = activeTopic?.videos || []
    const activeVideo = activeVideos[activeVideoIndex]

    const handleTopicComplete = () => {
        const newCompleted = new Set(completedTopics)
        newCompleted.add(activeTopic.id)
        setCompletedTopics(newCompleted)

        if (activeTopicIndex < topics.length - 1) {
            setActiveTopicIndex(activeTopicIndex + 1)
            setActiveVideoIndex(0)
        } else {
            setPhase('assignment')
        }
    }

    const handleAssignmentSubmit = async () => {
        if (!assignmentFile || !assignment) {
            alert("Please select a file to submit");
            return;
        }
        setSubmittingAssignment(true)
        try {
            console.log("Submitting assignment for assignment ID:", assignment.id);
            console.log("File:", assignmentFile);
            
            const formData = new FormData()
            formData.append('file', assignmentFile)
            
            const result = await submitAssignment(assignment.id, formData);
            console.log("Assignment submission result:", result);
            
            setAssignmentSubmitted(true)
            alert("Assignment submitted successfully!")
            // Auto-redirect to exam after assignment submission
            setTimeout(() => {
                setPhase('exam')
            }, 1500)
        } catch (e: any) {
            console.error("Assignment submission error:", e);
            alert(`Failed to submit assignment: ${e?.response?.data?.message || e?.message || 'Unknown error'}`);
        } finally {
            setSubmittingAssignment(false)
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )

    const completedCount = completedTopics.size
    const progressPercent = (completedCount / topics.length) * 100

    const CurriculumView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
                <div className="relative aspect-video bg-black overflow-hidden border border-border/50 group">
                    {activeVideo ? (
                        <video
                            key={activeVideo.id}
                            src={activeVideo.url || activeVideo.video_path}
                            controls
                            className="w-full h-full object-contain"
                            onEnded={() => {
                                if (activeVideoIndex < activeVideos.length - 1) {
                                    setActiveVideoIndex(activeVideoIndex + 1)
                                } else {
                                    handleTopicComplete()
                                }
                            }}
                        />
                    ) : (
                        <div className="flex inset-0 absolute items-center justify-center text-muted-foreground flex-col gap-4">
                            <Play className="h-12 w-12 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest italic">Stream Offline / Content Pending</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary italic">Section {activeTopicIndex + 1}</span>
                            <div className="h-0.5 w-6 bg-primary/30" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Unit {activeVideoIndex + 1} of {activeVideos.length || 1}</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">{activeTopic?.title}</h2>
                    </div>
                </div>

                <div className="prose prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed text-sm">
                        {activeTopic?.description || 'Deep dive into the specialized methodologies and core operational structures of this module.'}
                    </p>
                </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
                {activeVideos.length > 1 && (
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                            <List className="h-3 w-3" /> Module Segments
                        </h3>
                        <div className="space-y-2">
                            {activeVideos.map((vid: any, idx: number) => (
                                <button
                                    key={vid.id}
                                    onClick={() => setActiveVideoIndex(idx)}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-3 border transition-all text-left group",
                                        idx === activeVideoIndex
                                            ? "bg-primary/5 border-primary shadow-sm"
                                            : "hover:bg-muted/50 border-transparent hover:border-border"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 flex items-center justify-center shrink-0 border-2 rounded-xl transition-colors",
                                        idx === activeVideoIndex ? "bg-primary text-white border-primary" : "border-muted-foreground/10 text-muted-foreground/40"
                                    )}>
                                        {idx === activeVideoIndex ? <Play className="h-4 w-4" /> : idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-xs font-bold uppercase tracking-tight truncate", idx === activeVideoIndex ? "text-primary" : "text-foreground")}>
                                            {vid.title || `Part ${idx + 1}`}
                                        </p>
                                        <p className="text-[9px] font-medium text-muted-foreground uppercase mt-0.5 italic">Operational Unit</p>
                                    </div>
                                    {idx < activeVideoIndex && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Curriculum Roadmap</h3>
                    <div className="space-y-3">
                        {topics.map((topic, idx) => {
                            const isLocked = idx > completedCount && idx !== activeTopicIndex
                            const isDone = completedTopics.has(topic.id)
                            const isActive = idx === activeTopicIndex

                            return (
                                <div
                                    key={topic.id}
                                    onClick={() => !isLocked && setActiveTopicIndex(idx)}
                                    className={cn(
                                        "group flex items-center gap-4 p-3 border transition-all cursor-pointer relative overflow-hidden",
                                        isActive ? "bg-muted/50 border-primary/20" : "border-transparent",
                                        isLocked && "opacity-40 cursor-not-allowed"
                                    )}
                                >
                                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                    <div className={cn(
                                        "h-8 w-8 flex items-center justify-center shrink-0 font-bold text-xs border-2",
                                        isDone ? "bg-emerald-500 text-white border-emerald-500" :
                                            isActive ? "bg-primary text-white border-primary" : "border-muted-foreground/10"
                                    )}>
                                        {isDone ? <CheckCircle className="h-4 w-4" /> : isLocked ? <Lock className="h-3 w-3" /> : idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-xs font-bold uppercase tracking-tight truncate mb-0.5", isActive ? "text-primary" : "text-foreground")}>{topic.title}</p>
                                        {!isLocked && <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 italic">
                                            <Clock className="w-2.5 h-2.5" /> {topic.videos?.length || 1} Units
                                        </p>}
                                    </div>
                                </div>
                            )
                        })}

                        <div className={cn(
                            "flex items-center gap-4 p-4 border-2 border-dashed transition-all",
                            completedCount === topics.length ? "border-primary/40 bg-primary/5 cursor-pointer" : "border-muted/30 opacity-40 grayscale"
                        )}
                            onClick={() => completedCount === topics.length && setPhase('assignment')}>
                            <div className={cn(
                                "h-8 w-8 flex items-center justify-center shrink-0 border-2",
                                completedCount === topics.length ? "bg-primary text-white border-primary" : "border-muted/10"
                            )}>
                                {completedCount === topics.length ? <CheckCircle className="h-4 w-4" /> : <Lock className="h-3 w-3" />}
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-tight">Final Assessment</p>
                                <p className="text-[9px] font-medium text-muted-foreground uppercase italic">{completedCount === topics.length ? 'UNLOCKED: Ready for Evaluation' : 'COMPLETE ALL MODULES TO ACCESS'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const AssignmentView = () => (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b pb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Final Assessment</span>
                <h2 className="text-3xl font-bold tracking-tight mt-2">{assignment?.title || 'Operational Project'}</h2>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    {assignment?.description || 'Implement the technical methodologies discussed in the course curriculum and submit your operational report for review.'}
                </p>
            </div>

            {assignment && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Weightage', value: `${assignment.max_marks} pts` },
                        { label: 'Required', value: `${assignment.passing_marks} pts` },
                        { label: 'Status', value: assignmentSubmitted ? 'SUBMITTED' : 'OPEN' }
                    ].map(stat => (
                        <div key={stat.label} className="border rounded-xl p-4 bg-muted/20">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                            <p className={cn("text-lg font-bold mt-0.5", stat.label === 'Status' && assignmentSubmitted ? 'text-emerald-500' : '')}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {assignment?.file_url && (
                <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors group bg-background">
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Instructional Briefing</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase">Download Project Specifications</p>
                        </div>
                    </div>
                </a>
            )}

            {assignmentSubmitted ? (
                <div className="p-8 border rounded-2xl bg-emerald-500/5 text-center space-y-4 border-emerald-500/20">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Project Transmitted</h3>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">Your submission has been securely received.</p>
                    </div>
                    <Button
                        className="w-full h-12 font-bold uppercase tracking-wider"
                        onClick={() => setPhase('exam')}
                    >
                        Proceed to Final Exam
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Upload Submission</p>
                    <input type="file" id="assignment-submit-input" className="hidden" onChange={e => setAssignmentFile(e.target.files?.[0] || null)} />
                    <button
                        onClick={() => document.getElementById('assignment-submit-input')?.click()}
                        className={cn(
                            "w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all",
                            assignmentFile
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/20"
                        )}
                    >
                        <Upload className={cn("w-8 h-8", assignmentFile ? "text-primary" : "text-muted-foreground/30")} />
                        <div className="text-center">
                            <p className="font-bold text-xs">
                                {assignmentFile ? assignmentFile.name : 'Choose Project File'}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-medium">Click to browse files</p>
                        </div>
                    </button>

                    <Button
                        onClick={handleAssignmentSubmit}
                        disabled={!assignmentFile || submittingAssignment}
                        className="w-full h-12 text-sm font-bold uppercase tracking-widest"
                    >
                        {submittingAssignment ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                        Submit Project
                    </Button>

                    <button
                        onClick={() => setPhase('exam')}
                        className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mt-2"
                    >
                        Skip to Final Examination →
                    </button>
                </div>
            )}
        </div>
    )

    const ExamView = () => (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b pb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Final Examination</span>
                <h2 className="text-3xl font-bold tracking-tight mt-2">Course Completion Assessment</h2>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    Test your knowledge and understanding of the course material with this comprehensive examination.
                </p>
            </div>

            <div className="p-8 border rounded-2xl bg-primary/5 text-center space-y-4 border-primary/20">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Ready for Examination</h3>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">You have completed all course requirements.</p>
                </div>
                <Button
                    className="w-full h-12 font-bold uppercase tracking-wider"
                    onClick={() => navigate(`/courses/${courseId}/exam`)}
                >
                    Start Final Exam
                </Button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-background text-foreground">
            <style dangerouslySetInnerHTML={{ __html: `video::-webkit-media-controls-timeline{display:none!important}video::-webkit-media-controls-current-time-display{display:none!important}` }} />

            <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-6">
                        <Link to="/courses" className="h-10 w-10 border rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight truncate max-w-[280px] md:max-w-lg">{course?.title}</h1>
                            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                                {completedCount}/{topics.length} Modules Transmitted
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-48 h-2 bg-muted rounded-full overflow-hidden border">
                            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <span className="text-[10px] font-bold tabular-nums">{Math.round(progressPercent)}%</span>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-10">
                {phase === 'curriculum' ? <CurriculumView /> : 
                 phase === 'assignment' ? <AssignmentView /> : 
                 <ExamView />}
            </main>
        </div>
    )
}