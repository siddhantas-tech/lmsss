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
    Loader2, Trash2, Check, ExternalLink, Plus, Save,
    FileText, LayoutGrid, Upload, BookOpen, PenTool, Activity,
    ShieldCheck, AlertCircle
} from "lucide-react";

export function CourseAssignmentManager({ courseId }: { courseId: string }) {
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [showSubmissions, setShowSubmissions] = useState(false);
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

    // Form state for assignment settings
    const [form, setForm] = useState({ title: "", description: "", max_marks: "100", passing_marks: "40" });
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingRef, setUploadingRef] = useState(false);

    // Load initial data
    useEffect(() => {
        if (!courseId) return;
        loadAssignment();
        loadQuestions();
    }, [courseId]);

    const loadQuestions = async () => {
        try {
            const res = await getQuestions({ courseId });
            setQuestions(Array.isArray(res.data) ? res.data.filter((q: any) => q.is_final_exam) : []);
        } catch (e) {
            console.error("Failed to load questions", e);
        }
    };

    const loadAssignment = async () => {
        setLoading(true);
        try {
            const res = await getAssignmentByCourse(courseId);
            setAssignment(res.data);
            if (res.data) {
                setForm({
                    title: res.data.title || "",
                    description: res.data.description || "",
                    max_marks: String(res.data.max_marks || 100),
                    passing_marks: String(res.data.passing_marks || 40)
                });
            }
        } catch (e) {
            setAssignment(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.title) return alert("Title required");
        try {
            await createAssignment({
                course_id: courseId,
                ...form,
                max_marks: Number(form.max_marks),
                passing_marks: Number(form.passing_marks)
            });
            loadAssignment();
        } catch (e) {
            console.error(e);
            alert("Failed to initialize course-level assessment.");
        }
    };

    const handleUpdate = async () => {
        try {
            await updateAssignment(assignment.id, {
                title: form.title,
                description: form.description,
                max_marks: Number(form.max_marks),
                passing_marks: Number(form.passing_marks)
            });
            setIsEditing(false);
            loadAssignment();
            alert("Assessment settings updated.");
        } catch (e) {
            console.error(e);
            alert("Update failed.");
        }
    };

    const handleRefFileUpload = async (file: File) => {
        setUploadingRef(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            await uploadAssignmentFile(assignment.id, formData);
            loadAssignment();
            alert("Assignment Instruction Sheet uploaded.");
        } catch (e) {
            console.error(e);
            alert("Upload failed.");
        } finally {
            setUploadingRef(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure? This deletes the assignment and projects.")) return;
        try {
            await deleteAssignment(assignment.id);
            setAssignment(null);
        } catch (e) { console.error(e); }
    };

    const loadSubmissions = async () => {
        if (!assignment) return;
        try {
            const res = await getAssignmentSubmissions(assignment.id);
            setSubmissions(Array.isArray(res.data) ? res.data : []);
            setShowSubmissions(true);
        } catch (e) { console.error(e); }
    };

    const handleEvaluate = async (subId: string, marks: number) => {
        try {
            await evaluateSubmission(subId, { marks_awarded: marks });
            loadSubmissions();
            alert("Grade submitted.");
        } catch (e) { console.error(e); }
    };

    const handleAddQuestion = async () => {
        if (!qForm.text) return;
        try {
            await createQuestion({
                course_id: courseId,
                question_text: qForm.text,
                question_type: 'multiple_choice',
                question_order: questions.length + 1,
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
            loadQuestions();
        } catch (e) { console.error(e); }
    };

    const handleDeleteQuestion = async (id: string) => {
        try {
            await deleteQuestion(id);
            loadQuestions();
        } catch (e) { console.error(e); }
    };

    if (loading) return (
        <div className="p-12 border-4 border-dashed border-muted rounded-3xl flex items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" />
        </div>
    );

    if (!assignment) {
        return (
            <Card className="border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <CardHeader className="bg-foreground text-background p-8">
                    <div className="flex items-center gap-3 uppercase font-black tracking-tighter text-2xl">
                        <ShieldCheck className="w-8 h-8" />
                        Final Assessment Engine
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Initialize the concluding project and MCQ exam</p>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="uppercase font-black text-[10px] tracking-widest">Assessment Identity</Label>
                            <Input placeholder="e.g. Master Certification Exam" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border-2 border-foreground h-12 font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="uppercase font-black text-[10px] tracking-widest text-primary">Total Weightage</Label>
                                <Input type="number" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} className="border-2 border-primary h-12 font-black text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="uppercase font-black text-[10px] tracking-widest">Pass Criteria</Label>
                                <Input type="number" value={form.passing_marks} onChange={e => setForm({ ...form, passing_marks: e.target.value })} className="border-2 border-foreground h-12 font-black text-center" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="uppercase font-black text-[10px] tracking-widest">Administrative Brief & Instructions</Label>
                        <Textarea placeholder="Detail the exam protocol, project scope, and submission guidelines..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border-2 border-foreground min-h-[120px]" />
                    </div>
                    <Button onClick={handleCreate} className="w-full h-16 bg-foreground text-background font-black uppercase tracking-widest border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                        DEPLOY ASSESSMENT ENGINE
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-10">
            {/* Main Config Card */}
            <Card className="border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
                <CardHeader className="bg-muted p-6 border-b-4 border-foreground flex flex-row items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">Final Phase</span>
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none">{assignment.title}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className="border-2 border-foreground hover:bg-foreground hover:text-background">
                            <PenTool className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleDelete} className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {isEditing ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="uppercase font-black text-[10px] tracking-widest">Title</Label>
                                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border-2 border-foreground" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="uppercase font-black text-[10px] tracking-widest">Max Marks</Label>
                                        <Input type="number" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} className="border-2 border-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="uppercase font-black text-[10px] tracking-widest">Pass Marks</Label>
                                        <Input type="number" value={form.passing_marks} onChange={e => setForm({ ...form, passing_marks: e.target.value })} className="border-2 border-foreground" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="uppercase font-black text-[10px] tracking-widest">Description</Label>
                                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border-2 border-foreground min-h-[100px]" />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleUpdate} className="flex-1 font-black">SAVE CONFIGURATION</Button>
                                <Button variant="outline" onClick={() => setIsEditing(false)} className="border-2 border-foreground font-black">CANCEL</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                            {/* Project Section */}
                            <div className="md:col-span-12 space-y-6">
                                <div className="p-6 border-4 border-foreground bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-foreground text-background flex items-center justify-center shrink-0">
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Project Assignment</p>
                                            <h4 className="font-black text-xl uppercase tracking-tighter">Instructional Briefing Sheet</h4>
                                            <p className="text-[10px] font-bold opacity-60 uppercase">{assignment.file_url ? 'Active Document Linked' : 'No instruction file uploaded'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {assignment.file_url && (
                                            <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                                                <Button size="icon" variant="outline" className="h-12 w-12 border-2 border-foreground hover:bg-muted">
                                                    <ExternalLink className="w-5 h-5" />
                                                </Button>
                                            </a>
                                        )}
                                        <input type="file" id="exam-ref-upload" className="hidden" onChange={e => e.target.files?.[0] && handleRefFileUpload(e.target.files[0])} />
                                        <Button
                                            disabled={uploadingRef}
                                            onClick={() => document.getElementById('exam-ref-upload')?.click()}
                                            className="h-12 px-6 border-4 border-foreground bg-foreground text-background font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                        >
                                            {uploadingRef ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                                            {assignment.file_url ? "REPLACE BRIEF" : "UPLOAD BRIEF"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 border-2 border-foreground bg-muted/20">
                                    <p className="text-[9px] font-black uppercase opacity-50">Exam Weight</p>
                                    <p className="text-xl font-black">{assignment.max_marks} PTS</p>
                                </div>
                                <div className="p-4 border-2 border-foreground bg-muted/20">
                                    <p className="text-[9px] font-black uppercase opacity-50">Pass Threshold</p>
                                    <p className="text-xl font-black text-emerald-600">{assignment.passing_marks} PTS</p>
                                </div>
                                <div className="p-4 border-2 border-foreground bg-muted/20">
                                    <p className="text-[9px] font-black uppercase opacity-50">MCQ Bank</p>
                                    <p className="text-xl font-black">{questions.length} Qs</p>
                                </div>
                                <div className="p-4 border-2 border-foreground bg-muted/20 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black uppercase opacity-50">Submissions</p>
                                        <p className="text-xl font-black">{submissions.length || '0'}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={loadSubmissions} className="font-black text-[9px] uppercase hover:bg-foreground hover:text-background">View</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* MCQ Paper Creator Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
                    <CardHeader className="bg-foreground text-background p-6">
                        <div className="flex items-center gap-3 uppercase font-black tracking-tighter text-lg">
                            <BookOpen className="w-5 h-5" />
                            Final Exam Paper Builder
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Question Specification</Label>
                                <Input
                                    placeholder="Enter question text..."
                                    value={qForm.text}
                                    onChange={e => setQForm({ ...qForm, text: e.target.value })}
                                    className="border-2 border-foreground font-bold h-12"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response Options (check the correct identifier)</Label>
                                {qForm.options.map((opt, i) => (
                                    <div key={i} className="flex gap-3 items-center">
                                        <div
                                            onClick={() => {
                                                const next = [...qForm.options];
                                                next.forEach((o, idx) => o.is_correct = idx === i);
                                                setQForm({ ...qForm, options: next });
                                            }}
                                            className={cn(
                                                "h-10 w-10 border-4 border-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0 font-black",
                                                opt.is_correct ? "bg-primary text-primary-foreground" : "bg-muted"
                                            )}
                                        >
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <Input
                                            placeholder={`Response Option ${i + 1}`}
                                            value={opt.option_text || ""}
                                            onChange={e => {
                                                const next = [...qForm.options];
                                                next[i].option_text = e.target.value;
                                                setQForm({ ...qForm, options: next });
                                            }}
                                            className="border-2 border-foreground h-10 font-medium"
                                        />
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleAddQuestion} disabled={!qForm.text} className="w-full h-12 bg-foreground text-background font-black uppercase tracking-widest group">
                                <Plus className="mr-2 group-hover:rotate-180 transition-transform" /> APPEND TO EXAM BANK
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" /> Active Question Bank
                        </h3>
                        <span className="bg-foreground text-background px-3 py-1 text-[10px] font-black uppercase">{questions.length} Items</span>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="p-6 border-4 border-foreground bg-card relative group hover:translate-x-1 hover:translate-y-1 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black uppercase bg-muted px-2 py-0.5 border-2 border-foreground">Q#{idx + 1}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="font-black text-lg mb-6 leading-tight uppercase tracking-tight">{q.question_text}</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {q.quiz_options?.map((opt: any) => (
                                        <div key={opt.id} className={cn(
                                            "p-3 text-xs font-bold uppercase tracking-wider border-2 border-foreground flex items-center justify-between",
                                            opt.is_correct ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 opacity-60"
                                        )}>
                                            {opt.option_text}
                                            {opt.is_correct && <Check className="w-3 h-3" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {questions.length === 0 && (
                            <div className="p-10 border-4 border-dashed border-muted text-center space-y-3 opacity-30">
                                <AlertCircle className="w-10 h-10 mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Question bank is empty</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submissions Section */}
            {showSubmissions && (
                <Card className="border-4 border-foreground shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                    <CardHeader className="bg-foreground text-background p-6">
                        <CardTitle className="text-xl font-black uppercase tracking-wider">Candidate Submissions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {submissions.map(sub => (
                                <div key={sub.id} className="p-6 border-4 border-foreground bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-foreground text-background flex items-center justify-center font-black">
                                            {sub.user_id.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-tighter">Candidate {sub.user_id.slice(0, 6)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(sub.submitted_at).toLocaleDateString()} @ {new Date(sub.submitted_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <a href={sub.file_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="border-2 border-foreground font-black uppercase text-[10px] tracking-widest gap-2">
                                                <ExternalLink className="w-3 h-3" /> View Answer Sheet
                                            </Button>
                                        </a>

                                        <div className="flex items-center gap-2">
                                            {sub.marks_awarded !== null ? (
                                                <div className="text-right px-4 border-l-2 border-foreground/10">
                                                    <span className={cn("text-2xl font-black", sub.marks_awarded >= assignment.passing_marks ? "text-emerald-500" : "text-destructive")}>
                                                        {sub.marks_awarded} / {assignment.max_marks}
                                                    </span>
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                                        {sub.marks_awarded >= assignment.passing_marks ? 'QUALIFIED' : 'DISQUALIFIED'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        placeholder="Score"
                                                        className="w-24 border-2 border-foreground text-center font-black"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleEvaluate(sub.id, Number(e.currentTarget.value))
                                                        }}
                                                    />
                                                    <Button onClick={(e) => {
                                                        const val = (e.currentTarget.previousElementSibling as HTMLInputElement).value;
                                                        if (val) handleEvaluate(sub.id, Number(val));
                                                    }} className="font-bold bg-primary uppercase text-xs">Commit</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {submissions.length === 0 && <p className="py-12 text-center text-[10px] font-black uppercase opacity-40">No work submitted yet.</p>}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/5 text-[10px] font-black uppercase py-8 opacity-20 hover:opacity-100" onClick={() => navigate('/admin/courses')}>
                Exit Content Manager
            </Button>
        </div>
    );
}
