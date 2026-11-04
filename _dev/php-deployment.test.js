import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
test('PHP bundle separates public endpoint from private code/config and opts in only in production',async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'johnsjobs-php-test-'));
 try{
  execFileSync(process.execPath,[new URL('_dev/prepare-php-deployment.js',root).pathname,'https://johnsjobs.uk',temp]);
  const publicFiles=await readdir(path.join(temp,'public_html'));
  assert.ok(publicFiles.includes('api'));assert.ok(!publicFiles.includes('resend-config.php'));assert.ok(!publicFiles.includes('johnsjobs-backend'));
  const html=await readFile(path.join(temp,'public_html/index.html'),'utf8');assert.match(html,/data-endpoint="\.\/api\/enquiry.php"/);assert.match(html,/type="submit" disabled/);assert.match(html,/method="dialog"/);
  const endpoint=await readFile(path.join(temp,'public_html/api/enquiry.php'),'utf8');assert.match(endpoint,/dirname\(__DIR__,2\)/);assert.match(endpoint,/resend-config\.php/);
  assert.match(await readFile(path.join(temp,'resend-config.example.php'),'utf8'),/'enabled' => false/);
  assert.doesNotMatch(await readFile(new URL('index.html',root),'utf8'),/data-endpoint=/);
  assert.ok((await readdir(path.join(temp,'johnsjobs-backend'))).includes('renderer.php'));
 }finally{await rm(temp,{recursive:true,force:true});}
});

test('PHP clearance labels match the approved frontend/email contract',async()=>{
 const {CATEGORY_LABELS}=await import('../_email/render-enquiry.js');
 const php=await readFile(new URL('_php/private/renderer.php',root),'utf8');
 const section=php.match(/const CATEGORIES = \[([\s\S]*?)\];/)[1];
 const labels=Object.fromEntries([...section.matchAll(/'([^']+)'=>'([^']+)'/g)].map(match=>[match[1],match[2]]));
 assert.deepEqual(labels,CATEGORY_LABELS);
 const frontend=await readFile(new URL('app.js',root),'utf8');
 assert.doesNotMatch(frontend,/api\.resend\.com|Authorization: Bearer/);
});
