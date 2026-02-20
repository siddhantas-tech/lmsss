import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CoursesPage from './pages/Courses';
import CoursePlayer from './pages/CoursePlayer';
import CourseExamPage from './pages/CourseExam';
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
            <Route path="/courses/:id/exam" element={<CourseExamPage />} />

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