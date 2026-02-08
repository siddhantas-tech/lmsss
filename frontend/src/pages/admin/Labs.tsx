import { useEffect, useState } from "react";
import { Plus, Beaker, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button.tsx";
import { Input } from "@/components/ui/Input.tsx";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { getLabs, createLab } from "@/api/labs";
import { useToast } from "@/hooks/use-toast";

interface Lab {
    id: string;
    name: string;
    code: string;
    description?: string;
}

export default function LabsPage() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", code: "", description: "" });
    const [editingId, setEditingId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchLabs();
    }, []);

    const fetchLabs = async () => {
        try {
            const res = await getLabs();
            setLabs(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching labs:", error);
            setLabs([]); // Ensure labs is always an array
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load labs"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = () => {
        setFormData({ name: "", code: "", description: "" });
        setEditingId(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (lab: Lab) => {
        setFormData({ name: lab.name, code: lab.code, description: lab.description || "" });
        setEditingId(lab.id);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this lab?")) {
            try {
                // Implement delete when API is available
                setLabs(labs.filter(lab => lab.id !== id));
                toast({
                    title: "Deleted",
                    description: "Lab deleted successfully"
                });
            } catch (error) {
                console.error("Error deleting lab:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to delete lab"
                });
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingId) {
                // Update existing - implement when API is available
                setLabs(labs.map(lab =>
                    lab.id === editingId
                        ? { ...lab, ...formData }
                        : lab
                ));
                toast({
                    title: "Updated",
                    description: "Lab updated successfully"
                });
            } else {
                // Create new
                const res = await createLab(formData);
                const newLab = res.data || {
                    id: Math.random().toString(36).substr(2, 9),
                    ...formData
                };
                setLabs([...labs, newLab]);
                toast({
                    title: "Created",
                    description: "Lab created successfully"
                });
            }

            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error saving lab:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save lab"
            });
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <main className="w-full max-w-7xl mx-auto px-8 py-8">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Labs</h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-70">Infrastructure Management</p>
                </div>
                <Button
                    onClick={handleOpenDialog}
                    className="h-12 px-6 rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-foreground bg-primary text-primary-foreground hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" /> ADD NEW LAB
                </Button>
            </div>

            {/* Labs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {labs.map((lab) => (
                    <Card key={lab.id} className="group border-2 border-foreground rounded-3xl bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex flex-col relative overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-start justify-between gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                                    <Beaker className="h-5 w-5 text-primary" />
                                </div>
                                {/* Edit/Remove Actions Top Right */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(lab)}
                                        className="h-8 w-8 hover:bg-muted rounded-full"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(lab.id)}
                                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-full"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="inline-block px-2 py-0.5 rounded-md border border-foreground/10 bg-muted/20 text-[10px] font-black uppercase tracking-widest mb-2">{lab.code}</span>
                                <CardTitle className="text-lg font-black uppercase tracking-tight leading-tight">{lab.name}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 pb-6 flex-1">
                            <p className="text-sm font-medium text-muted-foreground line-clamp-3 leading-relaxed">
                                {lab.description || "No description provided."}
                            </p>
                        </CardContent>
                    </Card>
                ))}

                {labs.length === 0 && (
                    <div className="col-span-full h-64 border-2 border-dashed border-foreground/20 rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                        <Beaker className="h-12 w-12 mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-sm">No Labs Configured</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Lab Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-0 gap-0 overflow-hidden bg-background rounded-3xl">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                            {editingId ? "Edit Lab" : "Create Lab"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="px-8 pb-8 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="labName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lab Name</Label>
                                <Input
                                    id="labName"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="h-12 border-2 border-foreground/10 rounded-2xl font-bold focus-visible:ring-primary/20 bg-muted/5"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="labCode" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lab ID / Code</Label>
                                <Input
                                    id="labCode"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="h-12 border-2 border-foreground/10 rounded-2xl font-bold focus-visible:ring-primary/20 bg-muted/5"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lab Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="min-h-[120px] border-2 border-foreground/10 rounded-2xl font-bold p-4 focus-visible:ring-primary/20 bg-muted/5 resize-none"
                                    required
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-foreground bg-primary text-primary-foreground hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    {editingId ? "SAVE CHANGES" : "CREATE LAB"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}
