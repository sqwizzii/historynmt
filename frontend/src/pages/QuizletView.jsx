import { useParams } from 'react-router-dom'
import ModuleList from '../components/quizlet/ModuleList.jsx'
import StudySession from '../components/quizlet/StudySession.jsx'

export default function QuizletView() {
  const { moduleId } = useParams()
  return moduleId ? <StudySession key={moduleId} moduleId={moduleId} /> : <ModuleList />
}
