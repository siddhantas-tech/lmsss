import { useEffect, useState } from "react";
import {
  Search,
  Download,
  Shield,
  ShieldAlert,
  User as UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/Card";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "instructor" | "student";
  joined: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  /* ---------------- simulate empty data ---------------- */
  useEffect(() => {
    // backend not connected yet → zero users
    setUsers([]);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest gap-1">
            <ShieldAlert className="w-3 h-3" /> Admin
          </Badge>
        );
      case "instructor":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest gap-1">
            <Shield className="w-3 h-3" /> Instructor
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground border-foreground/10 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest gap-1"
          >
            <UserIcon className="w-3 h-3" /> Student
          </Badge>
        );
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-2xl font-black uppercase">Users</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-70">
          Personnel Registry
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex items-center gap-4 w-full">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <Button disabled>
            <Download className="mr-2 h-3.5 w-3.5" /> EXPORT CSV
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading users…
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No personnel found.
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
