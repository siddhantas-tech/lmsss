import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function AdminLayout() {
    return (
        <SidebarProvider>
            <div className="min-h-screen bg-background text-foreground flex w-full">
                <AdminSidebar />
                <SidebarInset className="flex flex-col flex-1 overflow-hidden">
                    <Outlet />
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
