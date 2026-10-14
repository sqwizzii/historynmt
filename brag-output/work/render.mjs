import puppeteer from 'puppeteer-core'
import fs from 'fs'
const W='/workspace/brag-output/work'
const only=process.argv[2]
const browser=await puppeteer.launch({executablePath:'/usr/local/bin/google-chrome',headless:'new',userDataDir:'/tmp/chr-brag2',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files']})
const page=await browser.newPage()
await page.setViewport({width:1920,height:1080})
await page.goto('file://'+W+'/index.html')
await page.evaluate(()=>window.ready)
if(only){ // stills
  for(const t of only.split(',').map(Number)){await page.evaluate(t=>seek(t),t);await page.screenshot({path:`${W}/still-${t}.jpg`,type:'jpeg',quality:85})}
}else{
  fs.mkdirSync(W+'/frames',{recursive:true})
  const N=Math.round(21.5*30)
  for(let i=0;i<N;i++){await page.evaluate(t=>seek(t),i/30);await page.screenshot({path:`${W}/frames/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92})}
}
await browser.close()
