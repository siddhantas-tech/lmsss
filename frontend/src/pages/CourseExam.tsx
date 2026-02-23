import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { getAssignmentByCourse } from "@/api/assignments";
import { submitQuiz, getFinalExamByCourse } from "@/api/quiz";
import {
    Loader2, CheckCircle, ArrowLeft, Award, HelpCircle,
    AlertTriangle, ChevronRight, ChevronLeft, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CourseExamPage() {
    const { id: courseId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [exam, setExam] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeQ, setActiveQ] = useState(0); // current question index

    // Timer
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!courseId) return;
            try {
                const [examRes, questionsRes] = await Promise.all([
                    getAssignmentByCourse(courseId).catch(() => ({ data: null })),
                    getFinalExamByCourse(courseId)
                ]);
                setExam(examRes.data);
                setQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
            } catch (e) {
                console.error("Failed to load exam data", e);
                setError("THE ASSESSMENT SERVERS ARE CURRENTLY UNREACHABLE.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [courseId]);

    // Start timer once questions are loaded
    useEffect(() => {
        if (questions.length > 0 && !submitted) {
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [questions.length, submitted]);

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const handleSubmit = async () => {
        if (questions.length > 0 && Object.keys(answers).length < questions.length) return;
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);
        try {
            if (Object.keys(answers).length > 0) {
                await submitQuiz({
                    course_id: courseId,
                    answers: Object.entries(answers).map(([qId, oId]) => ({
                        questionId: qId,
                        selectedOptionId: oId
                    }))
                });
            }
            setSubmitted(true);
        } catch (e) {
            console.error(e);
            alert("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (error) return (
        <div className="flex h-screen items-center justify-center bg-background px-6">
            <div className="max-w-md text-center space-y-6">
                <div className="w-20 h-20 border-4 border-destructive mx-auto flex items-center justify-center bg-destructive/5 text-destructive">
                    <AlertTriangle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-destructive leading-none">System Offline</h2>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70">{error}</p>
                </div>
                <Button onClick={() => navigate(`/courses/${courseId}`)} size="lg" className="w-full border-4 border-foreground font-black uppercase">RE-ESTABLISH CONNECTION</Button>
            </div>
        </div>
    );

    /* ── Loading ─── */
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Exam Paper...</p>
            </div>
        </div>
    );

    /* ── No exam configured ─── */
    if (!exam && questions.length === 0) return (
        <div className="flex flex-col h-screen items-center justify-center bg-background p-8 text-center space-y-6">
            <div className="w-24 h-24 border-4 border-foreground flex items-center justify-center">
                <AlertTriangle className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">No Exam Available</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs max-w-sm">
                This course does not currently have a final exam configured. Check back later.
            </p>
            <Button onClick={() => navigate(`/courses/${courseId}`)} variant="outline" className="border-4 border-foreground font-black uppercase">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
            </Button>
        </div>
    );

    /* ── Submitted ─── */
    if (submitted) {
        const total = questions.length;
        const answered = Object.keys(answers).length;
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="max-w-2xl w-full border-4 border-foreground bg-card p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-32 h-32 mx-auto bg-foreground flex items-center justify-center border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
                        <CheckCircle className="w-20 h-20 text-background" />
                    </div>
                    <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Exam Complete</span>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter">Answers Submitted</h1>
                        <p className="text-lg font-bold text-muted-foreground uppercase tracking-tight">
                            {answered} of {total} questions answered
                        </p>
                        <p className="text-sm font-medium opacity-50 max-w-sm mx-auto">
                            Time taken: {formatTime(elapsed)}. Your responses have been securely recorded and will be reviewed.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)} className="flex-1 h-14 border-4 border-foreground font-black uppercase">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
                        </Button>
                        <Button onClick={() => navigate('/dashboard')} className="flex-1 h-14 border-4 border-foreground bg-foreground text-background font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            <Award className="mr-2 h-4 w-4" /> Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[activeQ];
    const totalQ = questions.length;
    const answeredCount = Object.keys(answers).length;
    const allAnswered = answeredCount === totalQ;

    /* ── Main Exam UI ─── */
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">

            {/* Exam Header */}
            <header className="sticky top-0 z-40 border-b-4 border-foreground bg-background">
                <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-20 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/courses/${courseId}`)}
                            className="h-10 w-10 border-4 border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Final Examination</p>
                            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">{exam?.title || "Final Exam"}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Timer */}
                        <div className="hidden sm:flex items-center gap-2 border-2 border-foreground px-3 py-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-black tabular-nums text-sm">{formatTime(elapsed)}</span>
                        </div>
                        {/* Progress */}
                        <div className="hidden sm:block text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Progress</p>
                            <p className="text-sm font-black">{answeredCount}/{totalQ}</p>
                        </div>
                    </div>
                </div>

                {/* Thin progress bar */}
                <div className="h-1 bg-muted">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(answeredCount / (totalQ || 1)) * 100}%` }} />
                </div>
            </header>

            {/* Body */}
            <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Question navigator (sidebar) */}
                    <div className="lg:col-span-1 order-2 lg:order-1">
                        <div className="sticky top-28 border-4 border-foreground overflow-hidden">
                            <div className="bg-foreground text-background p-3">
                                <p className="text-[9px] font-black uppercase tracking-widest">Navigator</p>
                                <p className="text-xs font-bold opacity-60">{answeredCount}/{totalQ} answered</p>
                            </div>
                            <div className="p-3 grid grid-cols-4 gap-1.5">
                                {questions.map((q, i) => (
                                    <button
                                        key={q.id}
                                        onClick={() => setActiveQ(i)}
                                        className={cn(
                                            "h-9 w-full text-xs font-black border-2 transition-all",
                                            i === activeQ
                                                ? "bg-foreground text-background border-foreground"
                                                : answers[q.id]
                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                    : "border-border hover:border-foreground/50"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            {/* Submit button */}
                            <div className="p-3 border-t-2 border-foreground/10">
                                {!allAnswered && (
                                    <p className="text-[9px] font-black uppercase text-destructive tracking-widest text-center mb-2 animate-pulse">
                                        {totalQ - answeredCount} unanswered
                                    </p>
                                )}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!allAnswered || submitting}
                                    className="w-full h-12 font-black uppercase border-4 border-foreground bg-foreground text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-40 disabled:grayscale disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Award className="mr-2 w-4 h-4" />Submit Exam</>}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Main question pane */}
                    <div className="lg:col-span-3 order-1 lg:order-2 space-y-8">

                        {currentQ && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-200" key={currentQ.id}>
                                {/* Question Header */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-foreground text-background flex items-center justify-center font-black text-sm shrink-0 border-2 border-foreground">
                                            {activeQ + 1}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                            Question {activeQ + 1} of {totalQ}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight leading-tight">
                                        {currentQ.question_text}
                                    </h2>
                                </div>

                                {/* Options */}
                                <div className="space-y-3">
                                    {currentQ.quiz_options?.map((opt: any, oi: number) => {
                                        const isSelected = answers[currentQ.id] === opt.id;
                                        const letters = ['A', 'B', 'C', 'D', 'E'];
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt.id }))}
                                                className={cn(
                                                    "w-full flex items-center gap-5 p-5 text-left border-4 transition-all duration-150 group",
                                                    isSelected
                                                        ? "bg-foreground text-background border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] -translate-x-1 -translate-y-1"
                                                        : "bg-card border-border hover:border-foreground/60 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.06)]"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-10 w-10 flex items-center justify-center shrink-0 border-2 font-black text-sm transition-all",
                                                    isSelected
                                                        ? "bg-background text-foreground border-background"
                                                        : "border-foreground/20 bg-muted text-muted-foreground group-hover:border-foreground/40"
                                                )}>
                                                    {isSelected ? <CheckCircle className="w-5 h-5" /> : letters[oi] || oi + 1}
                                                </div>
                                                <span className={cn(
                                                    "font-bold text-lg tracking-tight leading-tight",
                                                    isSelected ? "text-background" : "text-foreground"
                                                )}>
                                                    {opt.option_text}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Navigation buttons */}
                        <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-foreground/10">
                            <Button
                                variant="outline"
                                disabled={activeQ === 0}
                                onClick={() => setActiveQ(q => q - 1)}
                                className="h-12 px-6 border-4 border-foreground font-black uppercase text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-30"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                            </Button>

                            <div className="flex gap-1">
                                {questions.map((_, i) => (
                                    <div key={i} className={cn(
                                        "h-2 w-2 border transition-all",
                                        i === activeQ ? "bg-foreground border-foreground w-6" :
                                            answers[questions[i]?.id] ? "bg-emerald-500 border-emerald-500" : "border-foreground/20"
                                    )} />
                                ))}
                            </div>

                            {activeQ < totalQ - 1 ? (
                                <Button
                                    onClick={() => setActiveQ(q => q + 1)}
                                    className="h-12 px-6 border-4 border-foreground bg-foreground text-background font-black uppercase text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    Next <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!allAnswered || submitting}
                                    className="h-12 px-6 border-4 border-foreground bg-foreground text-background font-black uppercase text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-40 disabled:grayscale disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Award className="mr-1 h-4 w-4" />Submit</>}
                                </Button>
                            )}
                        </div>

                        {/* Warning when trying to submit with unanswered questions */}
                        {!allAnswered && totalQ > 0 && (
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <HelpCircle className="w-4 h-4 shrink-0" />
                                <span>{totalQ - answeredCount} question{totalQ - answeredCount !== 1 ? 's' : ''} still need{totalQ - answeredCount === 1 ? 's' : ''} an answer before submitting.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
