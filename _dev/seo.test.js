import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const read=f=>readFile(new URL(f,root),'utf8');
test('demo remains noindex without a canonical or production sitemap declaration',async()=>{
 for(const filename of ['index.html','privacy.html']){
  const html=await read(filename);assert.match(html,/<meta name="robots" content="noindex,follow">/);assert.doesNotMatch(html,/rel="canonical"|property="og:url"/);
 }
 const robots=await read('robots.txt');assert.match(robots,/Disallow:\s*$/);assert.doesNotMatch(robots,/Disallow:\s*\/|^Sitemap:/m);
});
test('structured data uses only confirmed details and omits rating/address claims',async()=>{
 const html=await read('index.html');const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
 assert.equal(data.name,'JOHNSJOBS LTD');assert.equal(data.legalName,'JOHNSJOBS LTD');assert.equal(data.alternateName,'JohnsJobs');assert.deepEqual(data.sameAs,['https://www.facebook.com/JohnsJobsWasteClearances/','https://www.instagram.com/johnsjobswasteclearances/']);assert.equal(data.telephone,'+447772591409');assert.equal(data.areaServed.length,5);
 for(const field of ['aggregateRating','review','address','openingHours','url','@id'])assert.equal(data[field],undefined);
});
test('font families stay identical and responsive assets retain dimensions/lazy loading',async()=>{
 const html=await read('index.html');assert.match(html,/family=DM\+Sans:wght@400;500;600;700&amp;family=Manrope:wght@400;500;600;700;800&amp;display=swap/);
 assert.match(html,/assets\/team-768.webp/);assert.match(html,/width="1536" height="1024" loading="lazy" decoding="async"/);
 assert.doesNotMatch(await read('styles.css'),/@import/);
});
test('production artifacts are separate, canonicalised and safe to publish without developer files',async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'johnsjobs-seo-test-'));
 try{
  execFileSync(process.execPath,[new URL('_dev/prepare-production.js',root).pathname,'https://johnsjobs.uk',temp]);
  const html=await readFile(path.join(temp,'index.html'),'utf8');
  assert.match(html,/<meta name="robots" content="index,follow">/);assert.match(html,/<link rel="canonical" href="https:\/\/johnsjobs.uk\/">/);
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(data.url,'https://johnsjobs.uk/');
  assert.match(await readFile(path.join(temp,'privacy.html'),'utf8'),/<meta name="robots" content="index,follow">/);
  assert.match(await readFile(path.join(temp,'privacy.html'),'utf8'),/<link rel="canonical" href="https:\/\/johnsjobs.uk\/privacy.html">/);
  assert.equal((await readFile(path.join(temp,'sitemap.xml'),'utf8')).includes('privacy.html'),true);
  assert.match(await readFile(path.join(temp,'robots.txt'),'utf8'),/Sitemap: https:\/\/johnsjobs.uk\/sitemap.xml/);
  assert.throws(()=>execFileSync(process.execPath,[new URL('_dev/prepare-production.js',root).pathname,'https://example.com',temp],{stdio:'pipe'}));
  assert.throws(()=>execFileSync(process.execPath,[new URL('_dev/prepare-production.js',root).pathname,'https://johnsjobs.uk',new URL('.',root).pathname],{stdio:'pipe'}));
  assert.match(await read('index.html'),/noindex,follow/);
 }finally{await rm(temp,{recursive:true,force:true})}
});
