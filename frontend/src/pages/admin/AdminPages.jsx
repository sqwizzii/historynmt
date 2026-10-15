import PageHeader from '../../components/PageHeader.jsx'
import ModulesManager from '../../components/teacher/ModulesManager.jsx'
import TestsManager from '../../components/teacher/TestsManager.jsx'

export function AdminTests() {
  return (
    <>
      <PageHeader title="Системні тести" description="Системні тести бачать усі вчителі й учні, але змінювати їх можуть лише адміністратори." />
      <TestsManager />
    </>
  )
}

export function AdminModules() {
  return (
    <>
      <PageHeader title="Системні модулі" description="Системні модулі карток доступні всім користувачам платформи." />
      <ModulesManager />
    </>
  )
}
