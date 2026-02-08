import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Layers,
    Beaker,
    ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar"

const sidebarLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Courses", href: "/admin/courses", icon: BookOpen },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Categories", href: "/admin/categories", icon: Layers },
    { name: "Labs", href: "/admin/labs", icon: Beaker },
];

export function AdminSidebar() {
    const location = useLocation();

    return (
        <Sidebar className="border-r-2 border-foreground/20" collapsible="icon">
            <SidebarHeader className="p-4 border-b-2 border-foreground/10 bg-card transition-all duration-300 ease-in-out group-data-[collapsible=icon]:p-2">
                <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-4">

                    <div className="flex items-center gap-1.5 overflow-hidden group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
                        <div className="h-7 px-2 shrink-0 rounded-md bg-foreground text-background flex items-center justify-center font-bold border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] text-xs group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-[10px]">
                            Edu
                        </div>
                        <span className="font-bold tracking-tight text-lg whitespace-nowrap group-data-[collapsible=icon]:hidden">Admin</span>
                    </div>

                    <div className="ml-auto group-data-[collapsible=icon]:hidden">
                        <ThemeToggle />
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="p-3 space-y-6 bg-background">
                <SidebarGroup>
                    <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 group-data-[collapsible=icon]:hidden">
                        Platform Management
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1.5">
                            {sidebarLinks.map((link) => {
                                const isActive = location.pathname === link.href;
                                return (
                                    <SidebarMenuItem key={link.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={link.name}
                                            className={cn(
                                                "h-12 rounded-xl border-2 transition-all",
                                                isActive
                                                    ? "bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                                                    : "hover:bg-muted border-transparent hover:border-foreground/20"
                                            )}
                                        >
                                            <Link to={link.href}>
                                                <link.icon className={cn("size-5!", isActive ? "text-primary-foreground" : "text-foreground")} />
                                                <span className="font-bold uppercase tracking-tight text-xs group-data-[collapsible=icon]:hidden">{link.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t-2 border-foreground/5 bg-muted/20">
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
