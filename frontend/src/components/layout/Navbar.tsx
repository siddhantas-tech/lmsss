import { Link } from "react-router-dom";
import { useState } from "react";
import { Search, Menu, BookOpen, LayoutDashboard, Grid } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";

export function Navbar() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <nav
            className="border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-40"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-3 font-black text-2xl text-foreground"
                    >
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                            R
                        </div>
                        <span className="hidden sm:inline tracking-tight uppercase">RIIDL</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1 lg:gap-4">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 text-foreground/80 font-bold px-4 py-2 rounded-xl transition-all hover:bg-muted hover:text-primary tracking-tight"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/courses"
                            className="flex items-center gap-2 text-foreground/80 font-bold px-4 py-2 rounded-xl transition-all hover:bg-muted hover:text-primary tracking-tight"
                        >
                            <BookOpen className="h-4 w-4" />
                            <span>Courses</span>
                        </Link>

                        <Link
                            to="/categories"
                            className="flex items-center gap-2 text-foreground/80 font-bold px-4 py-2 rounded-xl transition-all hover:bg-muted hover:text-primary tracking-tight"
                        >
                            <Grid className="h-4 w-4" />
                            <span>Categories</span>
                        </Link>
                    </div>

                    {/* Right Side Tools */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="relative w-48 lg:w-64">
                            <Input
                                type="search"
                                placeholder="Search..."
                                className="pl-10 h-11 bg-muted/50 border-border/10 rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold text-sm transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>

                        <ThemeToggle />
                    </div>

                    {/* Mobile Menu Icon */}
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle />
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-2 border-border">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] border-l-4 border-foreground p-0">
                                <div className="flex flex-col h-full bg-card">
                                    <div className="p-6 border-b-2 border-border">
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Navigation</h2>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                        <Link to="/dashboard" className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 font-black text-lg hover:bg-primary/10 transition-colors">
                                            <LayoutDashboard className="h-6 w-6 text-primary" /> Dashboard
                                        </Link>
                                        <Link to="/courses" className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 font-black text-lg hover:bg-primary/10 transition-colors">
                                            <BookOpen className="h-6 w-6 text-primary" /> Courses
                                        </Link>
                                        <Link to="/categories" className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 font-black text-lg hover:bg-primary/10 transition-colors">
                                            <Grid className="h-6 w-6 text-primary" /> Categories
                                        </Link>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
}
