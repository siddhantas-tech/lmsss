import { TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AdminDashboardPage() {
    return (
        <main className="w-full max-w-7xl mx-auto px-8 py-8">
            {/* Dashboard Header */}
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Dashboard</h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-70">System Overview & Metrics</p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users */}
                <Card className="border-2 border-foreground rounded-xl p-6 bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-0">
                        <div className="flex flex-col h-24 justify-between">
                            <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Total Users</p>
                            <p className="font-black text-4xl leading-none">0</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Courses */}
                <Card className="border-2 border-foreground rounded-xl p-6 bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-0">
                        <div className="flex flex-col h-24 justify-between">
                            <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Active Courses</p>
                            <p className="font-black text-4xl leading-none">0</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Enrollments */}
                <Card className="border-2 border-foreground rounded-xl p-6 bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-0">
                        <div className="flex flex-col h-24 justify-between">
                            <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Total Enrollments</p>
                            <p className="font-black text-4xl leading-none">0</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Revenue */}
                <Card className="border-2 border-foreground rounded-xl p-6 bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-0">
                        <div className="flex flex-col h-24 justify-between">
                            <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Total Revenue</p>
                            <p className="font-black text-4xl leading-none">$0.00</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Section: Trends & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enrollment Trend */}
                <Card className="border-2 border-foreground rounded-xl bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <CardHeader className="p-5 border-b-2 border-foreground/10 bg-muted/5">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-black uppercase tracking-tight">Enrollment Trend</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        {/* Empty State Chart Area */}
                        <div className="h-[150px] w-full bg-muted/5 rounded-lg border-2 border-dashed border-foreground/10 flex items-center justify-center relative overflow-hidden">
                            <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">No Data Available</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-2 border-foreground rounded-xl bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <CardHeader className="p-5 border-b-2 border-foreground/10 bg-muted/5">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-orange-500" />
                            <CardTitle className="text-sm font-black uppercase tracking-tight">Recent Activity</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 min-h-[190px] flex items-center justify-center">
                        <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">No Recent Activity</p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
