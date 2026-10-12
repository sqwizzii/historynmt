import { useParams } from 'react-router-dom'
import TestList from '../components/tests/TestList.jsx'
import TestSession from '../components/tests/TestSession.jsx'

export default function TestRunner() {
  const { testId } = useParams()
  return testId ? <TestSession key={testId} testId={testId} /> : <TestList />
}
