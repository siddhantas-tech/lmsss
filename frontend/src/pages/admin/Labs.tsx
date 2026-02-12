import { useEffect, useState } from "react";
import { Plus, Beaker, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
import { getLabs, createLab, updateLab, deleteLab } from "@/api/labs";
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
                await deleteLab(id);
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
                // Update existing
                await updateLab(editingId, formData);
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
                    className="h-12 px-6 rounded-2xl font-black text-sm shadow-lg transition-transform hover:scale-105 active:scale-95 bg-primary text-primary-foreground"
                >
                    <Plus className="mr-2 h-4 w-4" /> ADD NEW LAB
                </Button>
            </div>

            {/* Labs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {labs.map((lab) => (
                    <Card key={lab.id} className="group border-2 border-border rounded-3xl bg-card shadow-sm hover:shadow-xl hover:border-primary/50 transition-all flex flex-col relative overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                    <Beaker className="h-6 w-6" />
                                </div>
                                {/* Edit/Remove Actions */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(lab)}
                                        className="h-8 w-8 hover:bg-muted rounded-xl bg-background shadow-sm border"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(lab.id)}
                                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-xl bg-background shadow-sm border"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-6">
                                <span className="inline-block px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-3">{lab.code}</span>
                                <CardTitle className="text-xl font-black uppercase tracking-tight leading-tight">{lab.name}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-2 pb-8 flex-1">
                            <p className="text-sm font-medium text-muted-foreground line-clamp-3 leading-relaxed opacity-80">
                                {lab.description || "No description provided."}
                            </p>
                        </CardContent>
                    </Card>
                ))}

                {labs.length === 0 && (
                    <div className="col-span-full h-80 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center text-muted-foreground bg-muted/5 gap-4">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                            <Beaker className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="font-black uppercase tracking-[0.3em] text-[10px] opacity-40">Zero Infrastructure Nodes Detected</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Lab Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[550px] border-2 border-border shadow-2xl p-0 gap-0 overflow-hidden bg-background rounded-3xl">
                    <DialogHeader className="p-10 pb-6 bg-muted/30 border-b">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter leading-none">
                            {editingId ? "Modify Lab Node" : "Initialize Lab"}
                        </DialogTitle>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2">Infrastructure Parameter Configuration</p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="p-10 space-y-8">
                            <div className="space-y-3">
                                <Label htmlFor="labName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lab Designation</Label>
                                <Input
                                    id="labName"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Electronics Assembly Bay 1"
                                    className="h-14 border-2 border-border rounded-2xl font-bold focus-visible:border-primary transition-all text-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="labCode" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operational ID / Code</Label>
                                <Input
                                    id="labCode"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="LAB-E101"
                                    className="h-14 border-2 border-border rounded-2xl font-bold focus-visible:border-primary transition-all tracking-widest uppercase"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Technical Specification</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detail the equipment and capabilities..."
                                    className="min-h-[140px] border-2 border-border rounded-2xl font-medium p-5 focus-visible:border-primary transition-all resize-none leading-relaxed"
                                    required
                                />
                            </div>

                            <div className="pt-6">
                                <Button
                                    type="submit"
                                    className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:translate-y-[-2px] active:translate-y-[0px] bg-primary text-primary-foreground"
                                >
                                    {editingId ? "PROCESS CHANGES" : "DEPLOY INFRASTRUCTURE"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}
