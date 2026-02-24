import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
    createAssignment,
    getAssignmentByCourse,
    uploadAssignmentFile,
    deleteAssignment,
} from "@/api/assignments";
import { getQuestions, createQuestion, deleteQuestion } from "@/api/quiz";
import api from "@/api/axios";
import {
    Loader2, Trash2, Plus, Upload, FileText, BookOpen,
    CheckCircle2, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ─────────────────────────────────────────────────────────────
   ASSIGNMENT FILE UPLOAD SECTION
───────────────────────────────────────────────────────────── */
function AssignmentSection({ courseId }: { courseId: string }) {
    const { toast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);

    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: "Final Assessment", description: "Submit your completed project file." });

    useEffect(() => {
        if (!courseId) return;
        fetchAssignment();
    }, [courseId]);

    async function fetchAssignment() {
        setLoading(true);
        try {
            const res = await getAssignmentByCourse(courseId);
            const data = res.data;
            // Robust check: handle array, nested object, or direct object
            const foundAssignment = Array.isArray(data) ? data[0] : (data?.assignment || data?.assignments?.[0] || data);
            setAssignment(foundAssignment && typeof foundAssignment === 'object' && foundAssignment.id ? foundAssignment : null);
        } catch {
            setAssignment(null);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateAssignment() {
        if (!form.title.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Title is required." });
            return;
        }
        setCreating(true);
        try {
            // First get a topic for this course to use as topic_id
            const topicsRes = await api.get(`/topics/course/${courseId}`);
            const topics = topicsRes.data;
            const firstTopic = Array.isArray(topics) && topics.length > 0 ? topics[0] : null;
            
            if (!firstTopic) {
                throw new Error("No topics found for this course. Please create a topic first.");
            }

            const res = await createAssignment({
                topic_id: firstTopic.id,
                title: form.title,
                description: form.description,
                max_marks: 100,
                passing_marks: 40,
            });
            const data = res.data;
            const foundAssignment = (data?.assignment || data?.assignments?.[0] || data?.data || data);
            setAssignment(foundAssignment && typeof foundAssignment === 'object' ? foundAssignment : null);
            toast({ title: "Created", description: "Assignment created. Now upload an instruction file." });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e?.message || e?.response?.data?.message || "Failed to create assignment." });
        } finally {
            setCreating(false);
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Auto-create assignment if it doesn't exist yet
        let targetAssignment = assignment;
        if (!targetAssignment) {
            setUploading(true);
            try {
                // First get a topic for this course to use as topic_id
                const topicsRes = await api.get(`/topics/course/${courseId}`);
                const topics = topicsRes.data;
                const firstTopic = Array.isArray(topics) && topics.length > 0 ? topics[0] : null;
                
                if (!firstTopic) {
                    throw new Error("No topics found for this course. Please create a topic first.");
                }

                const res = await createAssignment({
                    topic_id: firstTopic.id,
                    title: form.title || "Final Assessment",
                    description: form.description || "",
                    max_marks: 100,
                    passing_marks: 40,
                });
                const data = res.data;
                const created = (data?.assignment || data?.assignments?.[0] || data?.data || data);
                targetAssignment = created;
                setAssignment(created);
            } catch (e: any) {
                toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to create assignment before upload." });
                setUploading(false);
                e.target.value = "";
                return;
            }
        } else {
            setUploading(true);
        }

        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await uploadAssignmentFile(targetAssignment.id, fd);
            const updatedAssignment = { ...targetAssignment, ...(res.data || {}), file_url: res.data?.file_url || res.data?.url };
            setAssignment(updatedAssignment);
            toast({ title: "Uploaded", description: "Assignment file uploaded successfully." });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Upload Failed", description: e?.response?.data?.message || "Could not upload file." });
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    async function handleDelete() {
        if (!assignment || !confirm("Delete this assignment?")) return;
        try {
            await deleteAssignment(assignment.id);
            setAssignment(null);
            toast({ title: "Deleted", description: "Assignment removed." });
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete assignment." });
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {assignment ? (
                /* ── Existing assignment ── */
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-5 border-2 border-foreground bg-muted/5">
                        <div className="h-10 w-10 flex-shrink-0 bg-foreground text-background flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-sm uppercase">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{assignment.description}</p>
                            {assignment.file_url && (
                                <a
                                    href={assignment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest text-primary underline underline-offset-4"
                                >
                                    View Instruction File ↗
                                </a>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 flex-shrink-0"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* File upload / replace */}
                    <div>
                        <input ref={fileRef} type="file" hidden onChange={handleFileUpload}
                            accept=".pdf,.doc,.docx,.zip,.txt,.pptx" />
                        <Button
                            variant="outline"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="w-full h-12 border-2 border-dashed border-foreground font-black text-xs uppercase tracking-widest hover:bg-muted/20"
                        >
                            {uploading
                                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</>
                                : <><Upload className="h-4 w-4 mr-2" /> {assignment.file_url ? "Replace Instruction File" : "Upload Instruction File"}</>
                            }
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            Accepted: PDF, DOC, DOCX, ZIP, TXT, PPTX
                        </p>
                    </div>
                </div>
            ) : (
                /* ── Create assignment ── */
                <div className="space-y-5">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Assignment Title
                        </Label>
                        <Input
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Final Project Submission"
                            className="h-11 border-2 border-foreground font-bold"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Instructions
                        </Label>
                        <Textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe what students need to submit..."
                            className="min-h-[90px] border-2 border-foreground font-medium resize-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleCreateAssignment}
                            disabled={creating}
                            className="flex-1 h-11 font-black text-xs uppercase tracking-widest"
                        >
                            {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : <><Plus className="h-4 w-4 mr-2" />Create Assignment</>}
                        </Button>
                        <div className="flex-1">
                            <input ref={fileRef} type="file" hidden onChange={handleFileUpload}
                                accept=".pdf,.doc,.docx,.zip,.txt,.pptx" />
                            <Button
                                variant="outline"
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="w-full h-11 border-2 border-dashed border-foreground font-black text-xs uppercase tracking-widest"
                            >
                                {uploading
                                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading...</>
                                    : <><Upload className="h-4 w-4 mr-2" />Upload & Auto-Create</>
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   FINAL EXAM QUIZ BUILDER SECTION
───────────────────────────────────────────────────────────── */
function QuizBuilderSection({ courseId }: { courseId: string }) {
    const { toast } = useToast();

    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);

    // New question form state
    const emptyForm = () => ({
        question_text: "",
        options: ["", "", "", ""],
        correct_index: 0,
    });
    const [form, setForm] = useState(emptyForm());

    useEffect(() => {
        if (!courseId) return;
        fetchQuestions();
    }, [courseId]);

    async function fetchQuestions() {
        setLoading(true);
        try {
            const res = await getQuestions({ course_id: courseId, is_final_exam: true });
            const data = res.data;
            // Robust check for questions array
            const qList = Array.isArray(data) ? data : (data?.questions || data?.quiz || data?.data || []);
            setQuestions(Array.isArray(qList) ? qList : []);
        } catch {
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddQuestion() {
        if (!form.question_text.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Question text is required." });
            return;
        }
        const filledOptions = form.options.filter(o => o.trim());
        if (filledOptions.length < 2) {
            toast({ variant: "destructive", title: "Error", description: "At least 2 answer options required." });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                course_id: courseId,
                is_final_exam: true,
                question_text: form.question_text.trim(),
                options: form.options
                    .filter(o => o.trim())
                    .map((o, i) => ({
                        option_text: o.trim(),
                        is_correct: i === form.correct_index,
                    })),
            };
            const res = await createQuestion(payload);
            const data = res.data;
            const foundQ = (data?.question || data?.quiz || data?.data || data);
            setQuestions(prev => [...prev, foundQ]);
            setForm(emptyForm());
            toast({ title: "Added", description: "Question added to exam." });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e?.response?.data?.message || "Failed to save question." });
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteQuestion(id: string) {
        if (!confirm("Remove this question from the exam?")) return;
        try {
            await deleteQuestion(id);
            setQuestions(prev => prev.filter(q => q.id !== id));
            toast({ title: "Removed", description: "Question deleted." });
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete question." });
        }
    }

    function updateOption(index: number, value: string) {
        const opts = [...form.options];
        opts[index] = value;
        setForm({ ...form, options: opts });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Question count badge */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-foreground bg-muted/5">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-black text-xs uppercase tracking-widest">
                        {questions.length} Question{questions.length !== 1 ? "s" : ""}
                    </span>
                </div>
                {questions.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        Exam Ready
                    </div>
                )}
            </div>

            {/* Existing questions list */}
            {questions.length > 0 && (
                <div className="space-y-2">
                    {questions.map((q, i) => {
                        const opts: any[] = q.options || q.QuizOptions || [];
                        const isOpen = expanded === i;
                        return (
                            <div key={q.id} className="border-2 border-foreground">
                                <button
                                    type="button"
                                    onClick={() => setExpanded(isOpen ? null : i)}
                                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/10 transition-colors"
                                >
                                    <span className="h-7 w-7 flex-shrink-0 flex items-center justify-center bg-foreground text-background text-xs font-black">
                                        {i + 1}
                                    </span>
                                    <span className="flex-1 font-bold text-sm truncate">
                                        {q.question_text || q.text}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                            {opts.length} opts
                                        </span>
                                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                                            className="h-6 w-6 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </button>
                                {isOpen && opts.length > 0 && (
                                    <div className="px-4 pb-4 space-y-1.5 border-t-2 border-dashed border-border pt-3">
                                        {opts.map((o: any, oi: number) => (
                                            <div key={o.id || oi} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${o.is_correct ? "bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400" : "bg-muted/30 border border-border"}`}>
                                                {o.is_correct && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                                                <span>{o.option_text}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {questions.length === 0 && (
                <div className="py-10 border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <AlertCircle className="h-8 w-8 opacity-20" />
                    <p className="font-black uppercase text-[10px] tracking-widest opacity-40">No Questions Yet</p>
                    <p className="text-xs opacity-60">Add questions below to build the final exam.</p>
                </div>
            )}

            {/* Add new question form */}
            <div className="border-4 border-foreground p-6 space-y-5 bg-muted/5">
                <h4 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add New Question
                </h4>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Question Text
                    </Label>
                    <Textarea
                        value={form.question_text}
                        onChange={e => setForm({ ...form, question_text: e.target.value })}
                        placeholder="e.g., Which manufacturing process uses additive layering?"
                        className="min-h-[80px] border-2 border-foreground font-medium resize-none"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Answer Options — click radio to mark correct answer
                    </Label>
                    {form.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, correct_index: i })}
                                className={`h-7 w-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${form.correct_index === i
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-foreground hover:border-green-400"
                                    }`}
                            >
                                {form.correct_index === i && <CheckCircle2 className="h-4 w-4" />}
                            </button>
                            <Input
                                value={opt}
                                onChange={e => updateOption(i, e.target.value)}
                                placeholder={`Option ${i + 1}`}
                                className={`h-10 border-2 font-medium ${form.correct_index === i ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-foreground/40"}`}
                            />
                        </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground">
                        The highlighted (green) option is the correct answer.
                    </p>
                </div>

                <Button
                    onClick={handleAddQuestion}
                    disabled={saving}
                    className="w-full h-12 font-black text-xs uppercase tracking-widest"
                >
                    {saving
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                        : <><Plus className="h-4 w-4 mr-2" />Add Question to Exam</>
                    }
                </Button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT — tabbed layout: Assignment | Exam
───────────────────────────────────────────────────────────── */
export function CourseAssignmentManager({ courseId }: { courseId: string }) {
    const [tab, setTab] = useState<"assignment" | "exam">("assignment");

    return (
        <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="p-0 border-b-2 border-foreground">
                <div className="flex">
                    <button
                        onClick={() => setTab("assignment")}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-black uppercase tracking-widest transition-colors border-r-2 border-foreground ${tab === "assignment"
                            ? "bg-foreground text-background"
                            : "hover:bg-muted/20"
                            }`}
                    >
                        <Upload className="h-4 w-4" /> Assignment
                    </button>
                    <button
                        onClick={() => setTab("exam")}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-black uppercase tracking-widest transition-colors ${tab === "exam"
                            ? "bg-foreground text-background"
                            : "hover:bg-muted/20"
                            }`}
                    >
                        <BookOpen className="h-4 w-4" /> Final Exam Quiz
                    </button>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {tab === "assignment" ? (
                    <div className="space-y-2">
                        <div className="mb-4">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                File Upload Assignment
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Upload an instruction file that students will download, complete, and submit.
                            </p>
                        </div>
                        <AssignmentSection courseId={courseId} />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="mb-4">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Final Exam — MCQ Quiz Builder
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Build multiple-choice questions for the course final exam.
                            </p>
                        </div>
                        <QuizBuilderSection courseId={courseId} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
