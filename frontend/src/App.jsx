import { Route, Routes } from 'react-router-dom'
import GuestRoute from './components/GuestRoute.jsx'
import Header from './components/Header.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ComingSoon from './pages/ComingSoon.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import QuizletView from './pages/QuizletView.jsx'
import Register from './pages/Register.jsx'
import StudentAnalytics from './pages/StudentAnalytics.jsx'
import TeacherPanel from './pages/TeacherPanel.jsx'
import TestRunner from './pages/TestRunner.jsx'

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route path="/tests" element={<TestRunner />} />
          <Route path="/quizlet" element={<QuizletView />} />
          <Route path="/quizlet/:moduleId" element={<QuizletView />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/tests/:testId" element={<TestRunner />} />
          </Route>
          <Route element={<ProtectedRoute role="STUDENT" />}>
            <Route path="/results" element={<StudentAnalytics />} />
          </Route>
          <Route element={<ProtectedRoute role="TEACHER" />}>
            <Route path="/teacher" element={<TeacherPanel />} />
          </Route>
          <Route path="*" element={<ComingSoon title="Сторінку не знайдено" message="Перевірте адресу або поверніться на головну." />} />
        </Routes>
      </main>
    </>
  )
}
