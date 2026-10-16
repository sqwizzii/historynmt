import PageHeader from '../components/PageHeader.jsx'
import ModulesManager from '../components/teacher/ModulesManager.jsx'
import StudentsResults from '../components/teacher/StudentsResults.jsx'
import TestsManager from '../components/teacher/TestsManager.jsx'

export function TeacherTests() {
  return (
    <>
      <PageHeader title="Мої тести" description="Створюйте тести, додавайте питання, призначайте їх учням і дивіться статистику." />
      <TestsManager />
    </>
  )
}

export function TeacherCards() {
  return (
    <>
      <PageHeader title="Картки й модулі" description="Модулі карток для повторення термінів, дат і понять." />
      <ModulesManager />
    </>
  )
}

export function TeacherStudents() {
  return (
    <>
      <PageHeader title="Учні та результати" description="Код запрошення, список учнів, їхні результати й слабкі теми." />
      <StudentsResults />
    </>
  )
}
