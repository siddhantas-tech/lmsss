import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getAssignmentByCourse, submitAssignment } from "@/api/assignments";
import { getQuestions, submitQuiz } from "@/api/quiz";
import { Loader2, Upload, CheckCircle, FileText, ArrowLeft, Award, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CourseExamPage() {
    const { id: courseId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [exam, setExam] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const loadExamData = async () => {
            if (!courseId) return;
            try {
                const [examRes, questionsRes] = await Promise.all([
                    getAssignmentByCourse(courseId),
                    getQuestions({ courseId })
                ]);
                setExam(examRes.data);
                setQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
            } catch (e) {
                console.error("Failed to load exam data", e);
            } finally {
                setLoading(false);
            }
        };
        loadExamData();
    }, [courseId]);

    const handleSubmit = async () => {
        if (!exam) return;
        setSubmitting(true);
        try {
            // 1. Submit file if exists
            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                await submitAssignment(exam.id, formData);
            }

            // 2. Submit quiz answers
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

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background p-8 text-center space-y-6">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter">No Final Exam</h1>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">This course does not currently have a final assessment configured.</p>
                <Button onClick={() => navigate(`/courses/${courseId}`)} variant="outline" className="border-2 border-black">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classroom
                </Button>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="max-w-2xl w-full border-4 border-foreground bg-card p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-40 h-40 mx-auto rounded-full bg-emerald-500 flex items-center justify-center border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <CheckCircle className="w-24 h-24 text-white" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter">Exam Submitted</h1>
                        <p className="text-xl font-bold uppercase tracking-widest text-muted-foreground leading-tight">
                            Your final project and answers have been securely uploaded.
                        </p>
                        <p className="text-sm font-medium opacity-60 max-w-sm mx-auto">
                            The riidl industrial board will review your submission. Results will be posted to your dashboard within 48-72 hours.
                        </p>
                    </div>

                    <Button
                        onClick={() => navigate(`/dashboard`)}
                        className="h-16 px-12 text-xl font-black uppercase border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                    >
                        <Award className="mr-3 w-6 h-6" /> Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-16 px-8 leading-none">
            <div className="max-w-6xl w-full space-y-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b-4 border-foreground pb-8">
                    <div className="space-y-3">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Final Course Assessment</span>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">{exam.title || "Final Examination"}</h1>
                    </div>
                    <Button variant="ghost" onClick={() => navigate(`/courses/${courseId}`)} className="font-black uppercase tracking-widest text-xs h-12 border-2 border-foreground/10 hover:border-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Exit Exam
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left Column: Instructions & File Portal */}
                    <div className="space-y-8">
                        <Card className="border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                            <CardHeader className="bg-muted border-b-4 border-foreground p-6">
                                <CardTitle className="text-xl font-black uppercase flex items-center gap-3">
                                    <FileText className="w-6 h-6" /> Assignment Portal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase text-primary tracking-widest">Administrative Briefing</h4>
                                    <p className="text-lg font-bold italic leading-relaxed text-muted-foreground">
                                        “{exam.description || "Review the reference instructions and upload your final project file for evaluation."}”
                                    </p>
                                </div>

                                {exam.file_url && (
                                    <div className="p-6 bg-primary/5 border-4 border-primary/20 rounded-2xl flex items-center justify-between group transition-all hover:bg-primary/10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border-2 border-primary/20">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase">Instruction Sheet</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Reference Documentation</p>
                                            </div>
                                        </div>
                                        <a href={exam.file_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="font-black border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all">
                                                DOWNLOAD
                                            </Button>
                                        </a>
                                    </div>
                                )}

                                <div className="pt-6 border-t-2 border-dashed border-foreground/10 flex flex-col gap-6">
                                    <h4 className="text-xs font-black uppercase">Submit Final Work</h4>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="hidden"
                                            id="exam-file-input"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        />
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full h-32 border-4 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 flex flex-col gap-3 transition-all",
                                                file && "border-emerald-500 bg-emerald-500/5 hover:border-emerald-600 hover:bg-emerald-500/10"
                                            )}
                                            onClick={() => document.getElementById("exam-file-input")?.click()}
                                        >
                                            <Upload className={cn("w-8 h-8", file ? "text-emerald-500" : "text-muted-foreground/50")} />
                                            <div className="text-center">
                                                <p className="font-black uppercase tracking-widest text-xs">
                                                    {file ? file.name : "Authorize Submission File"}
                                                </p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 opacity-50">PDF, DOCX, ZIP (MAX 50MB)</p>
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Theory Questions */}
                    <div className="space-y-8">
                        <Card className="border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)]">
                            <CardHeader className="bg-foreground text-background p-6">
                                <CardTitle className="text-xl font-black uppercase flex items-center gap-3 text-background">
                                    <HelpCircle className="w-6 h-6" /> Theory Examination
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-12">
                                {questions.length > 0 ? (
                                    questions.map((q, idx) => (
                                        <div key={q.id} className="space-y-6">
                                            <div className="flex gap-4">
                                                <div className="h-8 w-8 bg-foreground text-background flex items-center justify-center font-black text-xs shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-xl font-bold leading-tight tracking-tight">{q.question_text}</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 pl-12">
                                                {q.quiz_options?.map((opt: any) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                                                        className={cn(
                                                            "w-full p-4 text-left border-2 font-bold uppercase tracking-wide text-[10px] transition-all",
                                                            answers[q.id] === opt.id
                                                                ? "bg-primary text-white border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1"
                                                                : "bg-white border-border hover:border-foreground/30"
                                                        )}
                                                    >
                                                        {opt.option_text}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-muted/20 rounded-3xl border-4 border-dashed border-border flex flex-col items-center justify-center gap-4">
                                        <Award className="w-12 h-12 text-muted-foreground opacity-20" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-black uppercase text-muted-foreground">No MCQ requirements</p>
                                            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase">Complete the assignment to finish the course</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="pt-4">
                            <Button
                                size="lg"
                                className="w-full h-20 text-2xl font-black uppercase italic tracking-tighter border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-primary text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:grayscale disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none"
                                onClick={handleSubmit}
                                disabled={submitting || (questions.length > 0 && Object.keys(answers).length < questions.length)}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-4 h-6 w-6 animate-spin" />
                                        Transmitting Data
                                    </>
                                ) : (
                                    "FINAL SUBMISSION"
                                )}
                            </Button>
                            {(questions.length > 0 && Object.keys(answers).length < questions.length) && (
                                <p className="text-center mt-4 text-[10px] font-black uppercase text-destructive tracking-widest animate-pulse">
                                    All questions must be answered before submission
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
