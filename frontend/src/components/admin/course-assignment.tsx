import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
    createAssignment,
    getAssignmentByCourse,
    getAssignmentSubmissions,
    evaluateSubmission,
    deleteAssignment,
    updateAssignment,
    uploadAssignmentFile
} from "@/api/assignments";
import { getQuestions, createQuestion, deleteQuestion } from "@/api/quiz";
import {
    Loader2, Trash2, Check, Plus,
    FileText, Upload, BookOpen, Activity,
    AlertCircle, Settings2, Pencil
} from "lucide-react";

export function CourseAssignmentManager({ courseId }: { courseId: string }) {
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);

    // Question Form
    const [qForm, setQForm] = useState({
        text: "",
        options: [
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false }
        ]
    });

    const [form, setForm] = useState({ title: "Final Assessment", description: "Course Final Project & Exam", max_marks: "100", passing_marks: "40" });
    const [isEditingSettings, setIsEditingSettings] = useState(false);
    const [uploadingRef, setUploadingRef] = useState(false);

    useEffect(() => {
        if (!courseId) return;
        loadData();
    }, [courseId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assignRes, questionsRes] = await Promise.all([
                getAssignmentByCourse(courseId).catch(() => ({ data: null })),
                getQuestions({ courseId })
            ]);

            setAssignment(assignRes.data);
            if (assignRes.data) {
                setForm({
                    title: assignRes.data.title || "",
                    description: assignRes.data.description || "",
                    max_marks: String(assignRes.data.max_marks || 100),
                    passing_marks: String(assignRes.data.passing_marks || 40)
                });
                // Load submissions if assignment exists
                const subsRes = await getAssignmentSubmissions(assignRes.data.id).catch(() => ({ data: [] }));
                setSubmissions(Array.isArray(subsRes.data) ? subsRes.data : []);
            }

            setQuestions(Array.isArray(questionsRes.data) ? questionsRes.data.filter((q: any) => q.is_final_exam) : []);
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async () => {
        try {
            const res = await createAssignment({
                course_id: courseId,
                ...form,
                max_marks: Number(form.max_marks),
                passing_marks: Number(form.passing_marks)
            });
            setAssignment(res.data);
            return res.data;
        } catch (e) {
            alert("Failed to create assessment.");
            return null;
        }
    };

    const handleUpdateSettings = async () => {
        try {
            await updateAssignment(assignment.id, {
                title: form.title,
                description: form.description,
                max_marks: Number(form.max_marks),
                passing_marks: Number(form.passing_marks)
            });
            setIsEditingSettings(false);
            loadData();
        } catch (e) {
            alert("Update failed.");
        }
    };

    const handleFileUpload = async (file: File) => {
        let currentAssign = assignment;
        if (!currentAssign) {
            currentAssign = await handleCreateAssignment();
        }
        if (!currentAssign) return;

        setUploadingRef(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            await uploadAssignmentFile(currentAssign.id, formData);
            loadData();
        } catch (e) {
            alert("Upload failed.");
        } finally {
            setUploadingRef(false);
        }
    };

    const handleAddQuestion = async () => {
        if (!qForm.text) return;
        try {
            await createQuestion({
                course_id: courseId,
                question_text: qForm.text,
                question_type: 'multiple_choice',
                is_final_exam: true,
                options: qForm.options.filter(o => o.option_text)
            });
            setQForm({
                text: "",
                options: [
                    { option_text: "", is_correct: false },
                    { option_text: "", is_correct: false },
                    { option_text: "", is_correct: false },
                    { option_text: "", is_correct: false }
                ]
            });
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteQuestion = async (id: string) => {
        try {
            await deleteQuestion(id);
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleEvaluate = async (subId: string, marks: number) => {
        try {
            await evaluateSubmission(subId, { marks_awarded: marks });
            loadData();
        } catch (e) { console.error(e); }
    };

    if (loading) return (
        <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Final Assessment</h2>
                    <p className="text-sm text-muted-foreground">Manage the final exam and project assignment.</p>
                </div>
                {!assignment && (
                    <Button onClick={handleCreateAssignment} variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Setup Assessment
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Assignment & Settings */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Assignment Upload */}
                    <Card className="border shadow-none">
                        <CardHeader className="pb-3 italic">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Final Project Brief
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3">
                                <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3 bg-muted/30">
                                    <Upload className="h-6 w-6 mx-auto text-muted-foreground/50" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold">Upload Instructional Briefing</p>
                                        <p className="text-[10px] text-muted-foreground">Students will download this file.</p>
                                    </div>
                                    <input
                                        type="file"
                                        id="brief-upload"
                                        className="hidden"
                                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 text-[10px] font-bold"
                                        onClick={() => document.getElementById('brief-upload')?.click()}
                                        disabled={uploadingRef}
                                    >
                                        {uploadingRef ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                        {assignment?.file_url ? "REPLACE FILE" : "CHOOSE FILE"}
                                    </Button>
                                    {assignment?.file_url && (
                                        <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-primary font-bold hover:underline">
                                            VIEW CURRENT FILE
                                        </a>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assessment Settings Toggle */}
                    <Card className="border shadow-none">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 italic">
                                    <Settings2 className="h-4 w-4" /> Settings
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingSettings(!isEditingSettings)}>
                                    <Pencil className="h-3 w-3" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditingSettings ? (
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold">Max Marks</Label>
                                        <Input type="number" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} className="h-8 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold">Passing Marks</Label>
                                        <Input type="number" value={form.passing_marks} onChange={e => setForm({ ...form, passing_marks: e.target.value })} className="h-8 text-xs font-bold" />
                                    </div>
                                    <Button size="sm" className="w-full text-xs font-bold h-8" onClick={handleUpdateSettings}>UPDATE</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Weightage</p>
                                        <p className="text-lg font-bold">{assignment?.max_marks || 100} pts</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Required</p>
                                        <p className="text-lg font-bold">{assignment?.passing_marks || 40} pts</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Final Exam Quiz Builder */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border shadow-none overflow-hidden">
                        <CardHeader className="bg-muted/50 border-b py-3 px-4">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center justify-between italic">
                                <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Final Exam Question Bank</div>
                                <span className="bg-foreground text-background text-[10px] px-2 py-0.5 rounded italic">{questions.length} Questions</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Simple Add Question Form */}
                            <div className="p-4 border-b bg-muted/20 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">New Question Content</Label>
                                    <Input
                                        placeholder="Enter question text here..."
                                        value={qForm.text}
                                        onChange={e => setQForm({ ...qForm, text: e.target.value })}
                                        className="h-10 text-sm font-semibold shadow-none border-foreground/10 focus-visible:ring-0 focus-visible:border-foreground/30"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {qForm.options.map((opt, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <button
                                                onClick={() => {
                                                    const next = [...qForm.options];
                                                    next.forEach((o, idx) => o.is_correct = idx === i);
                                                    setQForm({ ...qForm, options: next });
                                                }}
                                                className={cn(
                                                    "h-8 w-8 rounded border flex items-center justify-center text-[10px] font-bold transition-all shrink-0",
                                                    opt.is_correct ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground hover:border-foreground/30"
                                                )}
                                            >
                                                {String.fromCharCode(65 + i)}
                                            </button>
                                            <Input
                                                placeholder={`Option ${i + 1}`}
                                                value={opt.option_text}
                                                onChange={e => {
                                                    const next = [...qForm.options];
                                                    next[i].option_text = e.target.value;
                                                    setQForm({ ...qForm, options: next });
                                                }}
                                                className="h-8 text-xs shadow-none border-foreground/5 bg-background"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Button size="sm" className="w-full text-xs font-bold" onClick={handleAddQuestion} disabled={!qForm.text}>
                                    ADD TO EXAMINATION BANK
                                </Button>
                            </div>

                            {/* Question List */}
                            <div className="divide-y max-h-[500px] overflow-y-auto">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="p-4 hover:bg-muted/10 transition-colors group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start gap-3">
                                                <span className="text-[10px] font-bold text-muted-foreground bg-muted h-5 w-5 rounded flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <p className="font-bold text-sm tracking-tight pt-0.5">{q.question_text}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteQuestion(q.id)}>
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-8">
                                            {q.quiz_options?.map((opt: any) => (
                                                <div key={opt.id} className={cn(
                                                    "text-[10px] font-semibold flex items-center justify-between p-2 rounded border",
                                                    opt.is_correct ? "bg-primary/5 text-primary border-primary/20" : "bg-muted/30 border-transparent text-muted-foreground opacity-70"
                                                )}>
                                                    <span className="truncate">{opt.option_text}</span>
                                                    {opt.is_correct && <Check className="h-3 w-3" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {questions.length === 0 && (
                                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                                        <AlertCircle className="h-5 w-5 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest italic opacity-50">No questions defined for this exam</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Candidate Submissions - Relegated to the bottom, very clean */}
            {submissions.length > 0 && (
                <Card className="border shadow-none">
                    <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 italic">
                            <Activity className="h-4 w-4" /> Candidate Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {submissions.map(sub => (
                                <div key={sub.id} className="p-4 flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-[10px]">
                                            {sub.user_id.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs">Student {sub.user_id.slice(0, 6)}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase">{new Date(sub.submitted_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">
                                            DOWNLOAD ANSWER SHEET
                                        </a>
                                        <div className="flex items-center gap-2">
                                            {sub.marks_awarded !== null ? (
                                                <div className="text-right">
                                                    <p className="text-xs font-bold">{sub.marks_awarded} / {assignment.max_marks}</p>
                                                    <p className={cn("text-[9px] font-bold uppercase", sub.marks_awarded >= (assignment?.passing_marks || 40) ? "text-emerald-500" : "text-destructive")}>
                                                        {sub.marks_awarded >= (assignment?.passing_marks || 40) ? 'Pass' : 'Fail'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1">
                                                    <Input
                                                        type="number"
                                                        placeholder="Score"
                                                        className="w-16 h-7 text-xs font-bold text-center"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleEvaluate(sub.id, Number(e.currentTarget.value))
                                                        }}
                                                    />
                                                    <Button size="sm" onClick={(e) => {
                                                        const val = (e.currentTarget.previousElementSibling as HTMLInputElement).value;
                                                        if (val) handleEvaluate(sub.id, Number(val));
                                                    }} className="h-7 px-2 text-[10px] font-bold uppercase italic">Grade</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
