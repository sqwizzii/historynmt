import { Route, Routes } from 'react-router-dom'
import GuestRoute from './components/GuestRoute.jsx'
import Header from './components/Header.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ComingSoon from './pages/ComingSoon.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

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
          <Route path="/tests" element={<ComingSoon title="Тести" />} />
          <Route path="/quizlet" element={<ComingSoon title="Картки" />} />
          <Route element={<ProtectedRoute role="TEACHER" />}>
            <Route path="/teacher" element={<ComingSoon title="Панель вчителя" />} />
          </Route>
          <Route path="*" element={<ComingSoon title="Сторінку не знайдено" message="Перевірте адресу або поверніться на головну." />} />
        </Routes>
      </main>
    </>
  )
}
