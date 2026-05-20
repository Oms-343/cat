import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { HomeRedirect } from './auth/HomeRedirect'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { GeographicDashboardPage } from './pages/GeographicDashboardPage'
import { MastersListPage } from './pages/MastersListPage'
import { MasterDetailPage } from './pages/MasterDetailPage'
import { CompaniesListPage } from './pages/CompaniesListPage'
import { CompanyProfilePage } from './pages/CompanyProfilePage'
import { CompanyAddPage } from './pages/CompanyAddPage'
import { UsersPage } from './pages/UsersPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { ReportsListPage } from './pages/ReportsListPage'
import { ReportRunPage } from './pages/ReportRunPage'
import { ReportHistoryPage } from './pages/ReportHistoryPage'
import { MsmeProfileRedirectPage } from './pages/MsmeProfileRedirectPage'
import { OnboardingDrivesPage } from './pages/OnboardingDrivesPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <GeographicDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/companies"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <CompaniesListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-profile"
              element={
                <ProtectedRoute roles={['msme']}>
                  <MsmeProfileRedirectPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies/new"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <CompanyAddPage />
                </ProtectedRoute>
              }
            />
            <Route path="/companies/:id" element={<CompanyProfilePage />} />

            <Route
              path="/masters"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <MastersListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/masters/:key"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <MasterDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-log"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <AuditLogPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <ReportsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/history"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <ReportHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:slug"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <ReportRunPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/onboarding-drives"
              element={
                <ProtectedRoute roles={['super', 'admin']}>
                  <OnboardingDrivesPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
