const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('/home/adminai/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core');
const BASE=process.env.P3_BASE_URL,SITE=process.env.P3_SITE,OUT=process.env.P3_OUT;
const EXP=JSON.parse(fs.readFileSync(process.env.P3_EXPECTED,'utf8'));
const CHROME='/home/adminai/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const LOCALES=['pl','uk','ru','en','de','fr','es'];
const ARTICLE='vegetable_oil_coa_specification_buyer_guide';
const site=JSON.parse(fs.readFileSync(path.join(SITE,'content/site.json'),'utf8'));
const EMAIL=(site.company&&site.company.email||'').trim();
const hashes={};
for(const f of ['index.html','src/app.js','src/open.css','content/site.json']){
  try{hashes[f]=crypto.createHash('sha256').update(fs.readFileSync(path.join(SITE,f))).digest('hex').slice(0,16);}catch(e){hashes[f]='missing';}
}
const checks=[],errors=[];
const ok=(name,passed,observed)=>checks.push({name,passed:!!passed,observed:String(observed)});
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const W=parseInt(process.env.P3_WIDTH,10)||1280;
    const H=parseInt(process.env.P3_HEIGHT,10)||800;
    const page=await browser.newPage({viewport:{width:W,height:H}});
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(String(e)));
    for(const loc of LOCALES){
      const exp=EXP[loc]||{};
      await page.goto(BASE+'/#lang='+loc,{waitUntil:'domcontentloaded'});
      await page.waitForSelector('.hero__title',{timeout:5000});
      const dl=await page.evaluate(()=>document.documentElement.lang);
      ok(loc+' lang',dl===loc,dl);
      const hero=await page.$('.hero .btn--solid');
      const heroTxt=hero?(await hero.textContent()).trim():'';
      const heroHref=hero?await hero.getAttribute('href'):'';
      ok(loc+' heroCta',heroTxt.includes(exp.heroCta||'')&&heroHref==='#contact',heroTxt.slice(0,40)+' '+heroHref);
      const caps=await page.$eval('.caps .section-head__desc',e=>e.textContent.trim()).catch(()=>'');
      ok(loc+' capsDesc',caps===(exp.capsDesc||''),caps.slice(0,40));
      const pull=await page.$eval('.pull__text',e=>e.textContent.trim()).catch(()=>'');
      ok(loc+' pull',pull===(exp.pull||''),pull.slice(0,40));
      const sw=await page.evaluate(()=>document.documentElement.scrollWidth);
      ok(loc+' noHOverflow',sw<=W,'scrollWidth '+sw);
      await page.locator('.hero').screenshot({path:path.join(OUT,'home_'+loc+'.png')});
      await page.goto(BASE+'/#article='+ARTICLE+'&lang='+loc,{waitUntil:'domcontentloaded'});
      await page.waitForSelector('.article-detail__body',{timeout:5000});
      const cta=await page.$('.article-detail__cta a');
      const ctaTxt=cta?(await cta.textContent()).trim():'';
      const ctaHref=cta?await cta.getAttribute('href'):'';
      ok(loc+' articleCta',!!cta&&ctaHref==='mailto:'+EMAIL&&ctaTxt.length>0&&!/undefined/i.test(ctaTxt),ctaHref+' '+ctaTxt.slice(0,40));
      await page.locator('.article-detail__cta').scrollIntoViewIfNeeded();
      await page.locator('.article-detail__cta').screenshot({path:path.join(OUT,'article_'+loc+'.png')});
    }
    ok('noPageErrors',pageErrors.length===0,pageErrors.join(' | ').slice(0,200));
  }catch(e){errors.push(String(e&&e.message||e));}
  finally{
    const passed=checks.filter(c=>c.passed).length;
    fs.writeFileSync(path.join(OUT,'RESULT.json'),JSON.stringify({passed,failures:checks.filter(c=>!c.passed),errors,locales:LOCALES,sourceHashes:hashes},null,2));
    await browser.close();
  }
})().then(()=>{process.exit(errors.length||checks.some(c=>!c.passed)?1:0);})
  .catch(e=>{try{fs.writeFileSync(path.join(OUT,'RESULT.json'),JSON.stringify({errors:[String(e)]},null,2));}catch(_){}process.exit(1);});