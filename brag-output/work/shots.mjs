import puppeteer from 'puppeteer-core'
const OUT = '/workspace/brag-output/work/shots'
const BASE = 'http://localhost:45173'
const now = new Date().toISOString()
const tests = [
  { id: 1, title: 'Київська Русь: від Рюриковичів до монгольської навали', description: 'IX-XIII ст.: князі, реформи, культура.', timeLimitMinutes: 30, createdAt: now, questionCount: 20 },
  { id: 2, title: 'Козацька доба', description: 'Від Запорозької Січі до Гетьманщини.', timeLimitMinutes: 40, createdAt: now, questionCount: 25 },
  { id: 3, title: 'Українська революція 1917-1921', description: 'УНР, Гетьманат, Директорія.', timeLimitMinutes: 45, createdAt: now, questionCount: 30 },
  { id: 4, title: 'Друга світова війна', description: 'Україна 1939-1945.', timeLimitMinutes: 40, createdAt: now, questionCount: 25 },
  { id: 5, title: 'Незалежна Україна', description: '1991 - донині.', timeLimitMinutes: 30, createdAt: now, questionCount: 20 },
  { id: 6, title: 'Стародавня історія України', description: 'Трипілля, скіфи, античні міста.', timeLimitMinutes: 30, createdAt: now, questionCount: 20 },
]
const testDetail = {
  id: 2, title: 'Козацька доба', description: '', timeLimitMinutes: 40, createdAt: now,
  questions: [
    { id: 11, questionType: 'SINGLE_CHOICE', imageUrl: null, matchChoices: null, questionText: 'Хто з гетьманів уклав у 1654 році договір із Московським царством?',
      options: [{ id: 1, optionText: 'Іван Мазепа' }, { id: 2, optionText: 'Богдан Хмельницький' }, { id: 3, optionText: 'Петро Дорошенко' }, { id: 4, optionText: 'Іван Виговський' }] },
    { id: 12, questionType: 'SINGLE_CHOICE', imageUrl: null, matchChoices: null, questionText: 'Коли відбулася Пилявецька битва?',
      options: [{ id: 5, optionText: '1648' }, { id: 6, optionText: '1649' }] },
  ],
}
const modules = [{ id: 1, title: 'Дати і події', description: 'Ключові дати козацької доби', flashcards: [
  { id: 1, termOrQuestion: 'Берестейська битва', answerOrDate: '1651 р.', imageUrl: null },
  { id: 2, termOrQuestion: 'Переяславська рада', answerOrDate: '1654 р.', imageUrl: null }] }]
const json = (body) => ({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: JSON.stringify(body) })

const browser = await puppeteer.launch({ executablePath: '/usr/local/bin/google-chrome', headless: 'new', userDataDir: '/tmp/chr-brag', args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'] })
async function shot(name, path, { auth = false, act } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.evaluateOnNewDocument((auth) => {
    localStorage.clear()
    if (auth) { localStorage.setItem('token', 'x'); localStorage.setItem('user', JSON.stringify({ username: 'olena', role: 'STUDENT' })) }
  }, auth)
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const u = new URL(req.url())
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
    if (!u.pathname.startsWith('/api') && u.port !== '48096') return req.continue()
    const p = u.pathname.replace(/^\/api/, '')
    if (p === '/tests') return req.respond(json(tests))
    if (/^\/tests\/\d+$/.test(p)) return req.respond(json(testDetail))
    if (/^\/tests\/\d+\/start$/.test(p)) return req.respond(json({ remainingSeconds: 2290, leaveCount: 0 }))
    if (p === '/quizlet') return req.respond(json(modules))
    if (/^\/quizlet\/\d+$/.test(p)) return req.respond(json(modules[0]))
    return req.continue()
  })
  await page.goto(BASE + path, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1200))
  if (act) await act(page)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  await page.close()
}
await shot('question0', '/tests/2', { auth: true })
await shot('home', '/')
await shot('tests', '/tests', { auth: true })
await shot('question', '/tests/2', { auth: true, act: async (p) => { await p.evaluate(() => { [...document.querySelectorAll('label')].find((l) => l.textContent.includes('Богдан')).click() }); await new Promise((r) => setTimeout(r, 400)) } })
await shot('card-front', '/quizlet/1', { auth: true })
await shot('card-back', '/quizlet/1', { auth: true, act: async (p) => { await p.click('button[aria-pressed]'); await new Promise((r) => setTimeout(r, 1000)) } })
await browser.close()
