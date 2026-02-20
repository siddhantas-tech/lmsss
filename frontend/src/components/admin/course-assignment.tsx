import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { createAssignment, getAssignmentByCourse, getAssignmentSubmissions, evaluateSubmission, deleteAssignment, updateAssignment, uploadAssignmentFile } from "@/api/assignments";
import { getQuestions, createQuestion, deleteQuestion } from "@/api/quiz";
import { Loader2, Trash2, Check, ExternalLink, Plus, Save, FileText, LayoutGrid, Upload } from "lucide-react";

export function CourseAssignmentManager({ courseId }: { courseId: string }) {
    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [showSubmissions, setShowSubmissions] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

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

    // Form state
    const [form, setForm] = useState({ title: "", description: "", max_marks: "100", passing_marks: "40" });
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingRef, setUploadingRef] = useState(false);

    // Load assignment
    useEffect(() => {
        if (!courseId) return;
        loadAssignment();
        loadQuestions();
    }, [courseId]);

    const loadQuestions = async () => {
        setLoadingQuestions(true);
        try {
            const res = await getQuestions({ courseId });
            setQuestions(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error("Failed to load questions", e);
        } finally {
            setLoadingQuestions(false);
        }
    };

    const loadAssignment = async () => {
        setLoading(true);
        try {
            const res = await getAssignmentByCourse(courseId);
            setAssignment(res.data);
        } catch (e) {
            setAssignment(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
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
            alert("Failed to initialize exam. Please ensure the backend supports assignment creation.");
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
            alert("Assignment configuration updated securely.");
        } catch (e) {
            console.error(e);
            alert("Update failed. Backend support for patch/put admin/assignments may be missing.");
        }
    };

    const handleRefFileUpload = async (file: File) => {
        setUploadingRef(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            await uploadAssignmentFile(assignment.id, formData);
            loadAssignment();
            setUploadingRef(false);
            alert("Instruction Sheet uploaded and linked to exam.");
        } catch (e) {
            console.error(e);
            setUploadingRef(false);
            alert("Upload failed. Backend support for admin/assignments/:id/upload may be missing.");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete assignment?")) return;
        try {
            await deleteAssignment(assignment.id);
            setAssignment(null);
            setSubmissions([]);
            setShowSubmissions(false);
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
            loadSubmissions(); // Refresh
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

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;

    if (!assignment) {
        return (
            <Card className="border-l-4 border-l-primary/50">
                <CardHeader>
                    <CardTitle className="text-lg font-black uppercase">Create Final Exam</CardTitle>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Configure the course final assessment</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Exam Title</Label>
                        <Input placeholder="Final Exam 2024" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Exam Description / Instructions</Label>
                        <Textarea placeholder="Describe the exam rules, duration, and requirements..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Max Marks</Label>
                            <Input type="number" placeholder="100" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Passing Marks</Label>
                            <Input type="number" placeholder="40" value={form.passing_marks} onChange={e => setForm({ ...form, passing_marks: e.target.value })} />
                        </div>
                    </div>
                    <Button onClick={handleCreate} className="font-bold uppercase">Initialize Exam</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-black uppercase">Final Exam: {assignment.title}</CardTitle>
                <div className="flex gap-2">
                    {assignment.file_url && (
                        <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                                <FileText className="w-4 h-4" />
                            </Button>
                        </a>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                {isEditing ? (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest">Exam Title</Label>
                                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border-2 border-foreground" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Max Marks</Label>
                                    <Input type="number" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} className="border-2 border-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Pass Marks</Label>
                                    <Input type="number" value={form.passing_marks} onChange={e => setForm({ ...form, passing_marks: e.target.value })} className="border-2 border-foreground" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Instructions</Label>
                            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border-2 border-foreground min-h-[120px]" />
                        </div>
                        <div className="flex gap-3 pt-4 border-t-2 border-dashed border-border">
                            <Button onClick={handleUpdate} className="flex-1 font-black uppercase tracking-widest bg-primary text-white">Save Changes</Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="px-8 font-black uppercase tracking-widest border-2 border-foreground">Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-muted/5 p-8 rounded-2xl border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Administrative Briefing</h4>
                            <p className="text-lg font-bold italic leading-relaxed text-muted-foreground">“{assignment.description}”</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t-2 border-dashed border-foreground/10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Evaluation weight</p>
                                <p className="text-xl font-black">{assignment.max_marks} MARKS</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Success line</p>
                                <p className="text-xl font-black text-emerald-500">{assignment.passing_marks} MARKS</p>
                            </div>
                            <div className="sm:col-span-2 flex items-end justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setForm({ title: assignment.title, description: assignment.description, max_marks: String(assignment.max_marks), passing_marks: String(assignment.passing_marks) });
                                        setIsEditing(true);
                                    }}
                                    className="font-black uppercase tracking-widest text-[10px] border-2 border-foreground hover:bg-foreground hover:text-white transition-all h-10 px-6"
                                >
                                    Reconfigure Exam
                                </Button>
                            </div>
                        </div>

                        <div className="pt-8 border-t-4 border-foreground">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h5 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" /> Instruction Sheet
                                    </h5>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Reference document for industrial project</p>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    {assignment.file_url ? (
                                        <div className="px-4 py-2 bg-emerald-500/10 border-2 border-emerald-500 rounded-lg flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Document Linked</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black text-destructive uppercase tracking-widest px-3 py-1 bg-destructive/5 rounded-full border border-destructive/20">Missing Documentation</span>
                                    )}
                                    <input
                                        type="file"
                                        id="exam-ref-upload"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleRefFileUpload(file);
                                        }}
                                    />
                                    <Button
                                        disabled={uploadingRef}
                                        onClick={() => document.getElementById('exam-ref-upload')?.click()}
                                        className="font-black uppercase tracking-widest text-[10px] border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-background text-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all h-12 px-8"
                                    >
                                        {uploadingRef ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                        {assignment.file_url ? "Change Reference" : "Upload Reference"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t pt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-black uppercase text-sm">Exam Paper: Questions</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Design the final test questions</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadQuestions} disabled={loadingQuestions}>
                            {loadingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Question List */}
                        <div className="space-y-4">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="p-4 border-2 rounded-xl bg-muted/5 relative group">
                                    <p className="text-xs font-black uppercase text-primary mb-2">Question {idx + 1}</p>
                                    <p className="font-bold text-sm mb-4">{q.question_text}</p>
                                    <div className="space-y-2">
                                        {q.quiz_options?.map((opt: any) => (
                                            <div key={opt.id} className={cn("text-xs p-2 rounded border", opt.is_correct ? "border-emerald-500 bg-emerald-500/10 font-bold" : "border-border")}>
                                                {opt.option_text}
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive"
                                        onClick={() => handleDeleteQuestion(q.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {questions.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-8">No questions added yet.</p>}
                        </div>

                        {/* Add Question Form */}
                        <div className="p-6 border-2 border-dashed rounded-2xl bg-muted/5 space-y-4">
                            <h5 className="text-xs font-black uppercase tracking-widest">Add New MCQ</h5>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold">Question Text</Label>
                                <Input
                                    placeholder="e.g. What is the melting point of..."
                                    value={qForm.text}
                                    onChange={e => setQForm({ ...qForm, text: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-bold">Options (Check the correct one)</Label>
                                {qForm.options.map((opt, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            type="radio"
                                            name="correct-opt"
                                            checked={opt.is_correct}
                                            onChange={() => {
                                                const next = [...qForm.options];
                                                next.forEach((o, idx) => o.is_correct = idx === i);
                                                setQForm({ ...qForm, options: next });
                                            }}
                                        />
                                        <Input
                                            placeholder={`Option ${i + 1}`}
                                            className="h-8 text-xs"
                                            value={opt.option_text}
                                            onChange={e => {
                                                const next = [...qForm.options];
                                                next[i].option_text = e.target.value;
                                                setQForm({ ...qForm, options: next });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <Button className="w-full font-bold uppercase gap-2" size="sm" onClick={handleAddQuestion}>
                                <Plus className="w-4 h-4" /> Save Question
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black uppercase text-sm">Student Exam Submissions</h4>
                        <Button variant="outline" size="sm" onClick={() => showSubmissions ? setShowSubmissions(false) : loadSubmissions()}>
                            {showSubmissions ? "Hide" : "View Submissions"}
                        </Button>
                    </div>

                    {showSubmissions && (
                        <div className="space-y-3">
                            {submissions.map(sub => (
                                <div key={sub.id} className="border p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card hover:bg-muted/5 transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase text-muted-foreground">User ID: {sub.user_id.slice(0, 8)}...</p>
                                        <div className="flex items-center gap-2">
                                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                                                View Answer Sheet <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <span className="text-xs text-muted-foreground">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {sub.marks_awarded !== null ? (
                                            <div className="text-right">
                                                <span className={sub.marks_awarded >= assignment.passing_marks ? "text-green-600 font-black" : "text-destructive font-bold"}>
                                                    {sub.marks_awarded} / {assignment.max_marks}
                                                </span>
                                                <p className="text-[10px] font-bold uppercase">{sub.marks_awarded >= assignment.passing_marks ? "Passed" : "Failed"}</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Marks"
                                                    className="w-20 h-8 text-right font-mono"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleEvaluate(sub.id, Number(e.currentTarget.value))
                                                    }}
                                                    onBlur={(e) => {
                                                        if (e.target.value) handleEvaluate(sub.id, Number(e.target.value))
                                                    }}
                                                />
                                                <Button size="sm" variant="ghost" className="h-8">Save</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {submissions.length === 0 && <p className="text-sm text-muted-foreground italic">No submissions found.</p>}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
