import { LayoutDashboard, BookOpen, Users, Settings, LogOut, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/admin/theme-toggle'

// 1. CHANGED: Import from react-router-dom instead of next/...
import { Link, useLocation } from 'react-router-dom'

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/admin', // We can keep the key name 'href' here for the data object
        icon: LayoutDashboard,
    },
    {
        title: 'Courses',
        href: '/admin/courses',
        icon: BookOpen,
    },
    {
        title: 'Users',
        href: '/admin/users',
        icon: Users,
    },
    {
        title: 'Categories',
        href: '/admin/categories',
        icon: Folder,
    },
    {
        title: 'Labs',
        href: '/admin/labs',
        icon: Settings,
    },
]

export function AdminSidebar() {
    // 2. CHANGED: useLocation replaces usePathname
    const location = useLocation();
    const pathname = location.pathname;

    return (
        <div className="flex h-full w-64 flex-col border-r-4 border-foreground bg-background text-foreground">
            <div className="flex h-16 items-center justify-between border-b-4 border-foreground px-6">
                {/* 3. CHANGED: Link uses 'to' instead of 'href' */}
                <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tighter">
                    <span className="bg-foreground text-background px-2 py-1 rounded-sm">Edu</span>Admin
                </Link>
                <div onClick={(e) => e.stopPropagation()}>
                    <ThemeToggle />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-6">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {sidebarItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.href} // 3. CHANGED: 'to' instead of 'href'
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-3 font-bold transition-all hover:translate-x-1 hover:bg-secondary border-2 border-transparent",
                                pathname === item.href ? "bg-secondary border-foreground" : "hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="mt-auto border-t-4 border-foreground p-4">
                <Button variant="ghost" className="w-full justify-start gap-3 font-bold hover:bg-destructive/10 hover:text-destructive">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}
