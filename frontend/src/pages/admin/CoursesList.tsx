import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/Card";
import { getCourses, deleteCourse } from "@/api/courses";

interface Course {
    id: string;
    title: string;
    description?: string;
    category_id?: string;
}

export default function AdminCoursesList() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await getCourses();
            setCourses(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching courses:", error);
            setCourses([]); // Ensure courses is always an array
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (courseId: string) => {
        if (window.confirm("Are you sure you want to delete this course?")) {
            try {
                await deleteCourse(courseId);
                setCourses(courses.filter(c => c.id !== courseId));
            } catch (error) {
                console.error("Error deleting course:", error);
            }
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <main className="w-full max-w-7xl mx-auto px-8 py-8">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Course Management</h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-70">Curriculum & Content</p>
                </div>
                <Button asChild className="h-10 px-6 rounded-xl font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 border-foreground bg-primary text-primary-foreground hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                    <Link to="/admin/courses/new">
                        <Plus className="mr-2 h-3.5 w-3.5" /> CREATE COURSE
                    </Link>
                </Button>
            </div>

            {/* Toolbar */}
            <div className="relative max-w-md mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 pl-9 border-2 border-foreground/10 rounded-xl font-bold bg-card text-sm focus-visible:ring-primary/20"
                />
            </div>

            {/* Courses Table */}
            <Card className="border-2 border-foreground rounded-3xl bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/5 border-b-2 border-foreground/10">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Course</TableHead>
                                <TableHead className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</TableHead>
                                <TableHead className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map((course) => (
                                    <TableRow key={course.id} className="hover:bg-muted/5 border-b border-foreground/5 last:border-0 group">
                                        <TableCell className="px-6 py-2.5 font-bold">
                                            <div className="flex items-center gap-3">
                                                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center font-black text-[10px] border border-primary/20 text-primary">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-sm">{course.title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-2.5 text-xs text-muted-foreground">
                                            {course.description || "-"}
                                        </TableCell>
                                        <TableCell className="px-6 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link to={`/admin/courses/edit/${course.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted rounded-full">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive rounded-full"
                                                    onClick={() => handleDelete(course.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No courses found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    );
}
