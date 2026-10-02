// ============================================================================
// src/pages/exam/ProtectedRoute.tsx
//
// Route wrapper that requires authentication. Any route you place inside
// <ProtectedRoute> will automatically redirect unauthenticated visitors to
// /exam/auth, remembering where they were trying to go.
//
// Usage in App.tsx:
//
//   <Route
//     path="/exam/dashboard"
//     element={
//       <ProtectedRoute>
//         <ExamDashboard />
//       </ProtectedRoute>
//     }
//   />
//
// You can also restrict by role:
//
//   <Route
//     path="/exam/admin"
//     element={
//       <ProtectedRoute requiredRoles={['admin', 'instructor']}>
//         <AdminPage />
//       </ProtectedRoute>
//     }
//   />
//
// 🔌 AWS: No backend changes needed. This is pure client-side gating.
//         Real enforcement happens on the server (Lambda authorizer).
//         This wrapper is UX only — it stops honest users from hitting
//         a blank page. Never rely on it for security.
// ============================================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/authHooks';
import type { UserRole } from '../../types/exam.types';

interface ProtectedRouteProps {
  children: React.ReactNode;

  /**
   * Optional list of roles allowed to view this route.
   * If omitted, any authenticated user passes.
   * If provided, the user must have at least ONE of these roles.
   */
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const { state, user, isBootstrapping } = useAuth();
  const location = useLocation();

  // ---------------------------------------------------------------------------
  // 1. Still checking if a stored session is valid — show nothing.
  //    (Showing "redirect to login" here would be wrong; the user might
  //    already be logged in and we just haven't verified their token yet.)
  // ---------------------------------------------------------------------------
  if (isBootstrapping) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: '#94a3b8',
          fontSize: '0.9rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 24,
              height: 24,
              border: '3px solid #e2e8f0',
              borderTopColor: '#d95300',
              borderRadius: '50%',
              animation: 'fxProtectedSpin 0.7s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <style>{`@keyframes fxProtectedSpin { to { transform: rotate(360deg); } }`}</style>
          Checking your session…
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Not logged in — redirect to the auth page.
  //    We pass `state.from` so the login page can send them back here
  //    after a successful sign-in.
  // ---------------------------------------------------------------------------
  if (state !== 'authenticated' || !user) {
    return (
      <Navigate
        to="/exam/auth"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Logged in, but wrong role — show a "no access" page.
  //    We don't redirect here; we tell the user plainly what's wrong.
  // ---------------------------------------------------------------------------
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      return <NoAccessPage requiredRoles={requiredRoles} />;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. All good — render the protected children.
  // ---------------------------------------------------------------------------
  return <>{children}</>;
};

// ---------------------------------------------------------------------------
// 403-style "no access" page
// ---------------------------------------------------------------------------

const NoAccessPage: React.FC<{ requiredRoles: UserRole[] }> = ({
  requiredRoles,
}) => {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        fontFamily: 'sans-serif',
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          maxWidth: 460,
          textAlign: 'center',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '40px 32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            margin: '0 auto 20px',
          }}
          aria-hidden="true"
        >
          🔒
        </div>
        <h1
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 10px',
          }}
        >
          Access restricted
        </h1>
        <p
          style={{
            fontSize: '0.95rem',
            color: '#64748b',
            lineHeight: 1.6,
            margin: '0 0 20px',
          }}
        >
          You don't have permission to view this page. This area is limited to{' '}
          <strong style={{ color: '#334155' }}>
            {requiredRoles.join(' or ')}
          </strong>{' '}
          accounts.
        </p>
        <p
          style={{
            fontSize: '0.82rem',
            color: '#94a3b8',
            lineHeight: 1.5,
            margin: '0 0 24px',
          }}
        >
          If you believe this is a mistake, please contact your training
          coordinator.
        </p>
        <a
          href="/exam/dashboard"
          style={{
            display: 'inline-block',
            padding: '11px 22px',
            background: '#d95300',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: 10,
            fontSize: '0.92rem',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(217, 83, 0, 0.25)',
          }}
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
};