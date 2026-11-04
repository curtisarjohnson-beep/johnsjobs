import test from 'node:test';
import assert from 'node:assert/strict';
import {renderEnquiry, CATEGORY_LABELS} from '../_email/render-enquiry.js';
const fixture = {fullName:'James Mitchell',email:'james.mitchell@example.com',phone:'07700 900123',location:'LU1, Luton',category:'full-house',description:'Furniture downstairs.\nBoxes in the loft.',attachments:[{originalFilename:'living-room.jpg'},{filename:'loft.jpg'}]};
test('renders required sections, configured envelope and both body formats',()=>{
  const r=renderEnquiry(fixture);
  assert.equal(r.fromName,'JohnsJobs Enquiries');assert.equal(r.fromAddress,'enquiries@johnsjobs.uk');assert.equal(r.to,'john@johnsjobs.uk');assert.equal(r.replyTo,fixture.email);
  assert.equal(r.subject,'New JohnsJobs Enquiry — Full house clearance — LU1, Luton');
  for(const s of ['New clearance enquiry','Job details','Customer details','Photos','living-room.jpg','Sent via the JohnsJobs website enquiry form.'])assert.ok(r.html.includes(s));
  assert.ok(r.html.includes('Furniture downstairs.<br>Boxes in the loft.'));
  assert.ok(r.text.includes(fixture.description));assert.ok(r.text.includes('2 photos supplied'));
  assert.ok(r.html.includes('href="mailto:james.mitchell@example.com"'));assert.ok(r.html.includes('href="tel:07700900123"'));
});
test('escapes HTML and attribute payloads in all free text and filenames',()=>{
  const malicious='<img src=x onerror="alert(1)"> & \'quoted\'';
  const r=renderEnquiry({...fixture,fullName:malicious,location:malicious,description:malicious+'\nNext line',attachments:[{originalFilename:malicious}]});
  assert.ok(!r.html.includes('<img'));assert.ok(!r.html.includes('<script'));assert.ok(r.html.includes('&lt;img'));assert.ok(r.html.includes('&quot;'));assert.ok(r.html.includes('&#39;'));assert.ok(r.html.includes('&amp;'));
  assert.ok(r.text.includes(malicious));assert.ok(r.html.includes('<br>Next line'));
});
test('rejects header injection, malformed email/phone, unknown category and oversized fields',()=>{
  for(const field of ['email','location','fullName'])assert.throws(()=>renderEnquiry({...fixture,[field]:'value\r\nBcc: bad@example.com'}));
  for(const updates of [{email:'javascript:alert(1)'},{phone:'javascript:alert(1)'},{category:'toString'},{category:['trade']},{category:'<script>'},{description:' '},{location:'x'.repeat(121)}])assert.throws(()=>renderEnquiry({...fixture,...updates}));
  assert.throws(()=>renderEnquiry(fixture,{subjectPrefix:'Subject\nBcc: bad@example.com'}));
  assert.throws(()=>renderEnquiry(fixture,{fromAddress:'sender@example.com\nBcc: x@y.com'}));
});
test('supports no photos, optional metadata, fallback names and up to five attachments',()=>{
  const r=renderEnquiry({...fixture,attachments:[]});assert.ok(r.html.includes('No photos attached.'));assert.ok(r.text.includes('No photos attached.'));
  assert.ok(renderEnquiry({...fixture,attachments:undefined}).text.includes('No photos attached.'));
  assert.ok(renderEnquiry({...fixture,attachments:[{}]}).text.includes('Photo 1'));
  assert.ok(renderEnquiry({...fixture,attachments:Array.from({length:5},()=>({filename:'photo.jpg'}))}).text.includes('5 photos'));
  assert.throws(()=>renderEnquiry({...fixture,attachments:Array.from({length:6},()=>({filename:'photo.jpg'}))}));
  assert.throws(()=>renderEnquiry({...fixture,attachments:[{filename:'x\ny.jpg'}]}));
});
test('configuration is overrideable, isolated between calls and does not mutate input',()=>{
  const before=JSON.stringify(fixture);const r=renderEnquiry(fixture,{fromName:'Preview',fromAddress:'sender@example.com',to:'recipient@example.com',subjectPrefix:'Test enquiry'});
  assert.equal(r.to,'recipient@example.com');assert.equal(r.fromName,'Preview');assert.ok(r.subject.startsWith('Test enquiry —'));assert.equal(renderEnquiry(fixture).to,'john@johnsjobs.uk');assert.equal(JSON.stringify(fixture),before);
});
test('category labels match all form options',async()=>{
  const {readFile}=await import('node:fs/promises');const source=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const select=source.match(/<select id="category"[\s\S]*?<\/select>/)[0];const options=[...select.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(m=>[m[1],m[2].replace(/&amp;/g,'&')]);assert.deepEqual(options,Object.entries(CATEGORY_LABELS));
});
test('output has no active content, image embedding, external dependencies or tracking',()=>{
  const r=renderEnquiry(fixture);assert.doesNotMatch(r.html,/<script|<iframe|<img|<link|<style|javascript:|data:image|https?:\/\//i);assert.match(r.html,/role="presentation"/);assert.match(r.html,/max-width:600px/);assert.match(r.html,/\[if mso\]/);
});
