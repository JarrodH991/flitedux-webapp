import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext'; // <-- NEW
import { Navbar } from './layouts/Navbar';
import { Footer } from './layouts/Footer';
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetails';
import { Gallery } from './pages/Gallery';
import MyFlitedux from './pages/MyFlitedux';
import { About } from './pages/About';
import { FAQ } from './pages/FAQ';
import { ContactUs } from './pages/ContactUs';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';

// --- EXAM SYSTEM ---
import { ExamAuth } from './pages/exam/ExamAuth';
import { ExamDashboard } from './pages/exam/ExamDashboard';
import { ExamStart } from './pages/exam/ExamStart';
import { ExamRoom } from './pages/exam/ExamRoom';
import { ExamResults } from './pages/exam/ExamResults';
import { ProtectedRoute } from './pages/exam/ProtectedRoute';

// --- EXAM ADMIN ---
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
          <div style={{
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
          }}>
            <Navbar />

            <div style={{ flex: 1, width: '100%' }}>
              <Routes>
                {/* ================= PUBLIC ROUTES ================= */}
                <Route path="/" element={<Home />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:slug" element={<CourseDetail />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/myflitedux" element={<MyFlitedux />} />
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact" element={<ContactUs />} />

                {/* ================= E-COMMERCE ================= */}
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout-success" element={<CheckoutSuccess />} />

                {/* ================= EXAM SYSTEM ================= */}
                {/* Auth is public — you have to be able to log in */}
                <Route path="/exam/auth" element={<ExamAuth />} />

                {/* Learner routes — require any authenticated user */}
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

                {/* ================= EXAM ADMIN ================= */}
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