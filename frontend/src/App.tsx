import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AppShell } from '@/layout/AppShell'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { BoardPage } from '@/pages/board/BoardPage'
import { ListPage } from '@/pages/list/ListPage'
import { CalendarPage } from '@/pages/calendar/CalendarPage'
import { AiAssistantPage } from '@/pages/ai/AiAssistantPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'

export function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/app/board" element={<BoardPage />} />
            <Route path="/app/list" element={<ListPage />} />
            <Route path="/app/calendar" element={<CalendarPage />} />
            <Route path="/app/ai-assistant" element={<AiAssistantPage />} />
            <Route path="/app/profile" element={<ProfilePage />} />
            <Route path="/app/home" element={<Navigate to="/app/board" replace />} />
            <Route path="/app/tasks" element={<Navigate to="/app/list" replace />} />
            <Route path="/app" element={<Navigate to="/app/board" replace />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/app/board" replace />} />
        <Route path="*" element={<Navigate to="/app/board" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}
