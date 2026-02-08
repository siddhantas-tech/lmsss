import { useEffect, useState } from "react";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Zap } from "lucide-react";
import { getMyEnrollments } from "@/api/enrollments";

export default function DashboardPage() {
    const [enrollmentCount, setEnrollmentCount] = useState(0);
    const [activityData, setActivityData] = useState<Array<{ date: string; count: number }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch enrollments
                const enrollRes = await getMyEnrollments();
                setEnrollmentCount(enrollRes.data?.length || 0);

                // Generate activity data (empty for now, can be populated from backend)
                const data = [];
                const today = new Date();
                for (let i = 0; i < 365; i++) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    data.push({
                        date: d.toISOString().split('T')[0],
                        count: 0, // Real data would come from backend
                    });
                }
                setActivityData(data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const stats = [
        { title: "Enrolled", value: enrollmentCount.toString(), icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Topics", value: "0", icon: GraduationCap, color: "text-green-500", bg: "bg-green-500/10" },
        { title: "Streak", value: "0d", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10" },
    ];

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="bg-background">
            <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
                {/* Welcome Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl sm:text-7xl font-black text-gradient tracking-tight uppercase">Dashboard</h1>
                    <p className="text-xl font-bold text-muted-foreground max-w-2xl leading-relaxed">
                        Track your manufacturing certifications and daily learning progress.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map((stat, i) => (
                        <Card key={i} className="border-4 border-foreground rounded-4xl bg-card overflow-hidden group hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`p-4 rounded-2xl border-2 border-foreground ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-muted-foreground font-black text-xs uppercase tracking-widest">{stat.title}</h3>
                                    <p className="text-4xl font-black">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Learning Activity Heatmap */}
                <Card className="border-4 border-foreground bg-card rounded-4xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <CardHeader className="p-10 pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-black uppercase">Learning Activity</CardTitle>
                            <p className="text-muted-foreground font-bold italic">Engagement over the past 365 days</p>
                        </div>
                        <Badge variant="outline" className="h-10 px-6 rounded-xl border-4 border-primary/20 text-primary font-black uppercase tracking-widest bg-primary/5">
                            Realtime
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-10 pt-8 overflow-x-auto scrollbar-hide">
                        <ActivityHeatmap data={activityData} />
                    </CardContent>
                </Card>


            </main>
        </div>
    );
}
