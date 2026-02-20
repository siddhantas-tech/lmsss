import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getAssignmentByCourse, submitAssignment } from "@/api/assignments";
import { Loader2, Upload, CheckCircle, FileText } from "lucide-react";

export default function CourseAssignmentPage() {
    const { id } = useParams<{ id: string }>(); // Course ID
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getAssignmentByCourse(id!);
                setAssignment(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleSubmit = async () => {
        if (!file || !assignment) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            await submitAssignment(assignment.id, formData);
            setSubmitted(true);
        } catch (e) {
            alert("Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    if (!assignment) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <h1 className="text-2xl font-black uppercase text-muted-foreground">No Assignment Found</h1>
            <Button onClick={() => navigate(`/courses/${id}`)}>Back to Course</Button>
        </div>
    );

    if (submitted) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in zoom-in duration-500">
            <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4">
                <CheckCircle className="h-12 w-12" />
            </div>
            <h1 className="text-4xl font-black uppercase text-center">Assignment Submitted!</h1>
            <p className="text-muted-foreground text-lg text-center max-w-lg">
                Your work has been received. Your instructor will grade it soon.
            </p>
            <Button onClick={() => navigate(`/courses/${id}`)} size="lg" className="mt-8 font-black uppercase tracking-widest">
                Return to Course
            </Button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
            <Button variant="ghost" onClick={() => navigate(`/courses/${id}`)} className="mb-4">
                &larr; Back to Course
            </Button>

            <div className="space-y-4">
                <h1 className="text-4xl font-black uppercase tracking-tight">Final Assignment</h1>
                <p className="text-xl text-muted-foreground">{assignment.title}</p>
            </div>

            <Card className="border-l-4 border-l-primary shadow-xl">
                <CardHeader>
                    <CardTitle className="uppercase font-black text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Instructions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="prose prose-invert max-w-none bg-muted/5 p-6 rounded-xl border-2 border-dashed border-border/50">
                        <p className="whitespace-pre-wrap text-lg leading-relaxed">{assignment.description}</p>
                    </div>

                    <div className="flex gap-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Max Marks: <span className="text-foreground">{assignment.max_marks}</span></span>
                        <span>Pass Marks: <span className="text-foreground">{assignment.passing_marks}</span></span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="uppercase font-black">Your Submission</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-4 bg-muted/5 hover:bg-muted/10 transition-colors">
                        <Upload className="h-12 w-12 text-muted-foreground opacity-50" />
                        <div className="space-y-2 text-center">
                            <h3 className="font-bold text-lg">Upload your file</h3>
                            <p className="text-sm text-muted-foreground">PDF, DOCX, TXT allowed</p>
                        </div>
                        <Input
                            type="file"
                            className="max-w-sm mt-4"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            disabled={!file || submitting}
                            onClick={handleSubmit}
                            className="font-black uppercase tracking-widest px-8"
                        >
                            {submitting ? <Loader2 className="animate-spin mr-2" /> : "Submit Assignment"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
