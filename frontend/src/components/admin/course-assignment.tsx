import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createAssignment, getAssignmentByCourse, getAssignmentSubmissions, evaluateSubmission, deleteAssignment } from "@/api/assignments";
import { Loader2, Trash2, Check, ExternalLink } from "lucide-react";

export function CourseAssignmentManager({ courseId }: { courseId: string }) {
    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [showSubmissions, setShowSubmissions] = useState(false);

    // Form state
    const [form, setForm] = useState({ title: "", description: "", max_marks: "100", passing_marks: "40" });

    // Load assignment
    useEffect(() => {
        if (!courseId) return;
        loadAssignment();
    }, [courseId]);

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
        } catch (e) { console.error(e); }
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

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;

    if (!assignment) {
        return (
            <Card className="border-l-4 border-l-primary/50">
                <CardHeader><CardTitle className="text-lg font-black uppercase">Create Course Assignment</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Assignment Title</Label>
                        <Input placeholder="Enter title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Instructions / Prompt</Label>
                        <Textarea placeholder="Describe the assignment..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
                    <Button onClick={handleCreate} className="font-bold uppercase">Create Assignment</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-black uppercase">Assignment: {assignment.title}</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted/10 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-4 whitespace-pre-wrap">{assignment.description}</p>
                    <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Max Marks: {assignment.max_marks}</span>
                        <span>Pass: {assignment.passing_marks}</span>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black uppercase text-sm">Student Submissions</h4>
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
                                                View Submission <ExternalLink className="w-3 h-3" />
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
