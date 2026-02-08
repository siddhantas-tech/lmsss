import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CoursesPage from './pages/Courses';
import CoursePlayer from './pages/CoursePlayer';
import DashboardPage from './pages/Dashboard';
import CategoriesPage from './pages/Categories';
import CategoryDetailPage from './pages/CategoryDetail';
import AdminDashboard from './pages/admin/Dashboard';
import NewCoursePage from './pages/admin/NewCourse';
import LabsPage from './pages/admin/Labs';
import AdminCategoriesPage from './pages/admin/Categories';
import UsersPage from './pages/admin/Users';
import AdminCoursesList from './pages/admin/CoursesList';
import EditCoursePage from './pages/admin/EditCourse';
import LoginPage from './pages/Login';
import AdminLayout from './components/layout/AdminLayout';
import { AdminRoute } from './components/layout/AdminRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './components/user-provider';
import { ThemeProvider } from './components/ui/themeProvider';
import MainLayout from './components/layout/MainLayout';
import './styles/index.css';

const PagePlaceholder = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-12 text-center">
    <div className="h-20 w-20 rounded-3xl bg-primary/5 border-4 border-foreground/10 flex items-center justify-center mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
      <div className="h-10 w-10 rounded-xl bg-primary animate-pulse" />
    </div>
    <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">{title}</h1>
    <p className="text-xl font-bold text-muted-foreground uppercase tracking-widest italic tracking-tight">Accessing Secure Module... Connection Pending.</p>
  </div>
);

function AppContent() {
  const { user } = useAuth();

  const userData = user ? {
    username: user.username || user.name,
    labId: user.labId,
    role: user.role
  } : null;

  return (
    <ThemeProvider defaultTheme="light" storageKey="riidl-theme">
      <UserProvider user={userData}>
        <Router>
          <Routes>
            {/* Standard User Layout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/courses" replace />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:slug" element={<CategoryDetailPage />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin Layout & Routes - Notice 'admin' is lowercase */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="courses" element={<AdminCoursesList />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="labs" element={<LabsPage />} />
              <Route path="courses/new" element={<NewCoursePage />} />
              <Route path="courses/edit/:id" element={<EditCoursePage />} />
            </Route>

            {/* Focus Mode Routes */}
            <Route path="/courses/:id" element={<CoursePlayer />} />
            <Route path="/exams/:id" element={<PagePlaceholder title="Exam Simulation" />} />

            {/* 404 Redirect: If no route matches, send them to /courses */}
            <Route path="*" element={<Navigate to="/courses" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;