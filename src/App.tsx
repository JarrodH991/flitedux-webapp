import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './layouts/Navbar';
import { Footer } from './layouts/Footer';

// ==================== PUBLIC PAGES ====================
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetails';
import { Gallery } from './pages/Gallery';
import { About } from './pages/About';
import { FAQ } from './pages/FAQ';
import { ContactUs } from './pages/ContactUs';

// ==================== COURSE LEARNING ====================
import { CourseLearning } from './pages/courses/CourseLearning';

// ==================== E-COMMERCE ====================
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';

// ==================== AUTH ====================
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { SocialCallback } from './pages/auth/SocialCallback';
import { ProtectedRoute } from './pages/auth/ProtectedRoute';

// ==================== USER DASHBOARD ====================
import { Dashboard } from './pages/dashboard/Dashboard';
import { CalendarPage } from './pages/dashboard/CalendarPage';
import { TodoPage } from './pages/dashboard/TodoPage';
import { CertificatesList } from './pages/dashboard/CertificatesList';
import { CertificateDetail } from './pages/dashboard/CertificateDetail';

// ==================== EXAM SYSTEM ====================
import { ExamDashboard } from './pages/exam/ExamDashboard';
import { ExamStart } from './pages/exam/ExamStart';
import { ExamRoom } from './pages/exam/ExamRoom';
import { ExamResults } from './pages/exam/ExamResults';

// ==================== EXAM ADMIN ====================
import { SubjectManager } from './pages/exam/admin/SubjectManager';
import { QuestionBank } from './pages/exam/admin/QuestionBank';
import { ExamBuilder } from './pages/exam/admin/ExamBuilder';
import { Analytics } from './pages/exam/admin/Analytics';
import { AuditLog } from './pages/exam/admin/AuditLog';

import ScrollToTop from './context/ScrollToTop';

function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              width: '100vw',
              maxWidth: '100%',
              margin: 0,
              padding: 0,
              paddingTop: '60px',
              fontFamily: 'sans-serif',
              backgroundColor: '#f8fafc',
            }}
          >
            <Navbar />

            <div style={{ flex: 1, width: '100%' }}>
              <Routes>
                {/* ==================== PUBLIC ==================== */}
                <Route path="/" element={<Home />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:slug" element={<CourseDetail />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact" element={<ContactUs />} />

                {/* ==================== COURSE LEARNING ==================== */}
                <Route
                  path="/courses/:slug/learn"
                  element={
                    <ProtectedRoute>
                      <CourseLearning />
                    </ProtectedRoute>
                  }
                />

                {/* ==================== E-COMMERCE ==================== */}
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout-success" element={<CheckoutSuccess />} />

                {/* ==================== AUTH ==================== */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<SocialCallback />} />

                {/* ==================== DASHBOARD ==================== */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/calendar"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />
                <Route
  path="/dashboard/certificates"
  element={
    <ProtectedRoute>
      <CertificatesList />
    </ProtectedRoute>
  }
/>
<Route
  path="/dashboard/certificates/:id"
  element={
    <ProtectedRoute>
      <CertificateDetail />
    </ProtectedRoute>
  }
/>
                <Route
                  path="/dashboard/todo"
                  element={
                    <ProtectedRoute>
                      <TodoPage />
                    </ProtectedRoute>
                  }
                />

                {/* ==================== EXAM SYSTEM ==================== */}
                <Route
                  path="/exam/dashboard"
                  element={
                    <ProtectedRoute>
                      <ExamDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/exam/:examId"
                  element={
                    <ProtectedRoute>
                      <ExamStart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/attempt/:attemptId"
                  element={
                    <ProtectedRoute>
                      <ExamRoom />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/results/:attemptId"
                  element={
                    <ProtectedRoute>
                      <ExamResults />
                    </ProtectedRoute>
                  }
                />

                {/* ==================== EXAM ADMIN ==================== */}
                <Route
                  path="/exam/admin/subjects"
                  element={
                    <ProtectedRoute requiredRoles={['admin']}>
                      <SubjectManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/admin/questions"
                  element={
                    <ProtectedRoute requiredRoles={['admin', 'instructor']}>
                      <QuestionBank />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/admin/exams"
                  element={
                    <ProtectedRoute requiredRoles={['admin']}>
                      <ExamBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/admin/analytics"
                  element={
                    <ProtectedRoute requiredRoles={['admin', 'auditor']}>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/admin/audit"
                  element={
                    <ProtectedRoute requiredRoles={['admin', 'auditor']}>
                      <AuditLog />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>

            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </CartProvider>
  );
}

export default App;