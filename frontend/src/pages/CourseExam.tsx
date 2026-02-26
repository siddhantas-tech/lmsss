import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { getAssignmentByCourse } from "@/api/assignments";
import { submitQuiz, getFinalExamByCourse } from "@/api/quiz";
import {
    Loader2, CheckCircle, ArrowLeft,
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
    const [activeQ, setActiveQ] = useState(0);

    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!courseId) return;
            try {
                console.log("Loading exam data for courseId:", courseId);
                
                const [examRes, questionsRes] = await Promise.all([
                    getAssignmentByCourse(courseId).catch(err => {
                        console.error("Failed to load assignment for exam:", err);
                        return { data: null };
                    }),
                    getFinalExamByCourse(courseId).catch(err => {
                        console.error("Failed to load exam questions:", err);
                        return { data: [] };
                    })
                ]);
                
                console.log("Exam assignment data:", examRes.data);
                console.log("Exam questions data:", questionsRes.data);
                
                const aData = examRes.data;
                const foundExam = Array.isArray(aData) ? aData[0] : (aData?.assignment || aData?.assignments?.[0] || aData);
                setExam(foundExam && typeof foundExam === 'object' && (foundExam.id || foundExam._id) ? foundExam : null);

                const qData = questionsRes.data;
                const qList = Array.isArray(qData) ? qData : (qData?.questions || qData?.quiz || qData?.data || []);
                console.log("Processed questions list:", qList);
                setQuestions(Array.isArray(qList) ? qList : []);
            } catch (e) {
                console.error("Error loading exam data:", e);
                setError("ASSESSMENT SERVERS TEMPORARILY UNAVAILABLE.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [courseId]);

    useEffect(() => {
        if (questions.length > 0 && !submitted) {
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [questions.length, submitted]);

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const handleSubmit = async () => {
        if (questions.length > 0 && Object.keys(answers).length < questions.length) {
            alert("Please answer all questions before submitting");
            return;
        }
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);
        try {
            if (Object.keys(answers).length > 0) {
                console.log("Submitting exam answers:", answers);
                
                // Submit exam answers as per API spec
                const submissionData = {
                    topicId: '', // Final exam doesn't need topicId
                    courseId: courseId || '',
                    isFinalExam: true,
                    timeTaken: elapsed,
                    answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
                        questionId: questionId,
                        selectedOptionId: selectedOptionId
                    }))
                };
                
                console.log("Exam submission data:", submissionData);
                await submitQuiz(submissionData);
                console.log("Exam submitted successfully");
            }
            setSubmitted(true);
        } catch (e: any) {
            console.error("Exam submission error:", e);
            alert(`Failed to submit exam: ${e?.response?.data?.message || e?.message || 'Unknown error'}`);
            setSubmitting(false);
            if (timerRef.current) setInterval(() => setElapsed(e => e + 1), 1000);
        }
    };

    if (error) return (
        <div className="flex h-screen items-center justify-center bg-background px-6">
            <div className="max-w-md text-center space-y-6">
                <AlertTriangle className="w-12 h-12 mx-auto text-destructive opacity-30" />
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Technical Disruption</h2>
                    <p className="text-muted-foreground text-sm font-medium">{error}</p>
                </div>
                <Button onClick={() => navigate(`/courses/${courseId}`)} variant="outline" className="w-full">Back to Course</Button>
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Initializing Exam...</p>
            </div>
        </div>
    );

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="max-w-md w-full border rounded-3xl bg-card p-12 text-center space-y-8 shadow-sm">
                    <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Exam Complete</h1>
                        <p className="text-muted-foreground mt-2 text-sm font-medium italic">
                            Your responses have been recorded. Duration: {formatTime(elapsed)}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button onClick={() => navigate(`/courses/${courseId}`)} className="h-12 font-bold uppercase tracking-widest text-xs">Return to Training</Button>
                        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="h-12 font-bold uppercase tracking-widest text-xs">Exit to Dashboard</Button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[activeQ];
    const totalQ = questions.length;
    const answeredCount = Object.keys(answers).length;
    const allAnswered = totalQ > 0 && answeredCount === totalQ;

    // Debug logging for quiz options
    console.log('Current question:', currentQ);
    console.log('Available option fields:', currentQ ? Object.keys(currentQ) : 'No question');
    console.log('Options array:', currentQ?.quiz_options || currentQ?.options || currentQ?.QuizOptions || 'No options found');

    // No questions yet
    if (!loading && totalQ === 0) return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">No Exam Questions Yet</h1>
                    <p className="text-muted-foreground mt-2 text-sm">The instructor hasn't published any questions for this exam.</p>
                </div>
                <Button onClick={() => navigate(`/courses/${courseId}`)} variant="outline" className="w-full">Back to Course</Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between px-6 h-16">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(`/courses/${courseId}`)} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <h1 className="text-sm font-bold tracking-tight truncate max-w-[200px]">{exam?.title || "Final MCQ Exam"}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> {formatTime(elapsed)}
                        </div>
                    </div>
                </div>
                <div className="h-1 bg-muted">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(answeredCount / (totalQ || 1)) * 100}%` }} />
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
                {currentQ && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500" key={currentQ.id}>
                        <div className="space-y-4">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Question {activeQ + 1} of {totalQ}</span>
                            <h2 className="text-2xl font-bold tracking-tight leading-snug">{currentQ.question_text || currentQ.text || currentQ.question}</h2>
                        </div>

                        <div className="space-y-3">
                            {(currentQ.quiz_options || currentQ.options || currentQ.QuizOptions || []).map((opt: any, oi: number) => {
                                const isSelected = answers[currentQ.id] === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt.id }))}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-5 text-left border rounded-2xl transition-all duration-200 group",
                                            isSelected
                                                ? "bg-primary/5 border-primary shadow-sm"
                                                : "bg-background border-muted-foreground/10 hover:border-primary/40 hover:bg-muted/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-10 w-10 flex items-center justify-center shrink-0 border-2 rounded-xl font-bold text-xs transition-colors",
                                            isSelected ? "bg-primary text-white border-primary" : "border-muted-foreground/10 text-muted-foreground/40"
                                        )}>
                                            {String.fromCharCode(65 + oi)}
                                        </div>
                                        <span className={cn(
                                            "font-semibold text-sm tracking-tight",
                                            isSelected ? "text-primary" : "text-foreground"
                                        )}>
                                            {opt.option_text || opt.text || opt.optionText || opt.content}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between pt-8 border-t border-dashed">
                            <Button
                                variant="ghost"
                                disabled={activeQ === 0}
                                onClick={() => setActiveQ(q => q - 1)}
                                className="px-4 text-xs font-bold uppercase tracking-widest"
                            >
                                <ChevronLeft className="mr-1 h-3 w-3" /> Previous
                            </Button>

                            <div className="flex gap-1.5">
                                {questions.map((_, i) => (
                                    <div key={i} className={cn(
                                        "h-1 w-1 rounded-full transition-all",
                                        i === activeQ ? "bg-primary w-4" : answers[questions[i]?.id] ? "bg-primary/40" : "bg-muted-foreground/10"
                                    )} />
                                ))}
                            </div>

                            {activeQ < totalQ - 1 ? (
                                <Button
                                    onClick={() => setActiveQ(q => q + 1)}
                                    className="px-6 h-10 text-xs font-bold uppercase tracking-widest"
                                >
                                    Next <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!allAnswered || submitting}
                                    className="px-8 h-10 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                                >
                                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit Final Exam"}
                                </Button>
                            )}
                        </div>

                        {!allAnswered && (
                            <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                {totalQ - answeredCount} Question{totalQ - answeredCount !== 1 ? 's' : ''} Remaining
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
