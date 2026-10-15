import { Navigate, Route, Routes } from 'react-router-dom'
import GuestRoute from './components/GuestRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Account from './pages/Account.jsx'
import ComingSoon from './pages/ComingSoon.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Practice from './pages/Practice.jsx'
import QuizletView from './pages/QuizletView.jsx'
import Register from './pages/Register.jsx'
import RegisterTeacher from './pages/RegisterTeacher.jsx'
import ResultReview from './pages/ResultReview.jsx'
import StudentAnalytics from './pages/StudentAnalytics.jsx'
import Subscription from './pages/Subscription.jsx'
import { TeacherCards, TeacherStudents, TeacherTests } from './pages/TeacherPages.jsx'
import TestRunner from './pages/TestRunner.jsx'
import AdminSubjects from './pages/admin/AdminSubjects.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import { AdminModules, AdminTests } from './pages/admin/AdminPages.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/teacher" element={<RegisterTeacher />} />
        </Route>
        <Route path="/tests" element={<TestRunner />} />
        <Route path="/quizlet" element={<QuizletView />} />
        <Route path="/quizlet/:moduleId" element={<QuizletView />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/tests/:testId" element={<TestRunner />} />
          <Route path="/results/:resultId" element={<ResultReview />} />
          <Route path="/account" element={<Account />} />
        </Route>
        <Route element={<ProtectedRoute role="STUDENT" />}>
          <Route path="/results" element={<StudentAnalytics />} />
          <Route path="/practice" element={<Practice />} />
        </Route>
        <Route element={<ProtectedRoute role="TEACHER" />}>
          <Route path="/teacher" element={<Navigate to="/teacher/tests" replace />} />
          <Route path="/teacher/tests" element={<TeacherTests />} />
          <Route path="/teacher/cards" element={<TeacherCards />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
        </Route>
        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route path="/admin" element={<Home />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/subjects" element={<AdminSubjects />} />
          <Route path="/admin/tests" element={<AdminTests />} />
          <Route path="/admin/modules" element={<AdminModules />} />
        </Route>
        <Route path="*" element={<ComingSoon title="Сторінку не знайдено" message="Перевірте адресу або поверніться на головну." />} />
      </Route>
    </Routes>
  )
}
