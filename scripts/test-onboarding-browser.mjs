import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const base = process.env.ONBOARDING_SUPPLIER_URL || 'http://127.0.0.1:3214';
const adminBase = process.env.ONBOARDING_ADMIN_URL || 'http://127.0.0.1:3216';
assert.equal(new URL(base).hostname, '127.0.0.1', 'Hosted acceptance uses its separate captured-mail harness');
assert.equal(process.env.KUINBEE_CI, 'true');
const backend = resolve('../backend');
const backendRequire = createRequire(`${backend}/package.json`);
const {prisma} = backendRequire('./packages/database/dist/src/index.js');
const {mailQueue} = backendRequire('./packages/mail-client/dist/config/redis.js');
const {redisClient} = backendRequire('./apps/backend/dist/config/redis.js');
const evidence = process.env.ONBOARDING_EVIDENCE_DIR || '/tmp/kuinbee-onboarding-browser';mkdirSync(evidence,{recursive:true});
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1440,height:1050}});
const adminContext = await browser.newContext({viewport:{width:1440,height:1050}});
const page = await context.newPage(); const admin = await adminContext.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));admin.on('pageerror',error=>errors.push(error.message));
const email=`synthetic-browser-${randomUUID()}@example.test`;
const password='Synthetic-Onboarding-Password-42!';
async function screenshot(name) {await page.screenshot({path:resolve(evidence,`${name}.png`),fullPage:true,animations:"disabled"});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`No overflow: ${name}`);}
async function mailLink(applicationId,path) {
  const row=await prisma.supplierOnboardingNotification.findFirstOrThrow({where:{applicationId,dedupeKey:{startsWith:'token-'}},orderBy:{createdAt:'desc'}});
  const job=await mailQueue.getJob(createHash('sha256').update(`supplier-onboarding-${row.id}`).digest('hex'));assert.ok(job);
  const url=new URL(job.data.variables.url);assert.ok(url.pathname.endsWith(path));return url.toString();
}
async function saved() {await page.getByRole('status').filter({hasText:'Your changes are saved.'}).waitFor();}
async function decide(label,confirmLabel='Confirm decision') {await admin.getByRole('button',{name:'Pick submission',exact:true}).click();await admin.getByRole('status').filter({hasText:'Submission picked'}).waitFor();await admin.getByRole('button',{name:label.replaceAll("_", " "),exact:true}).click();await admin.getByRole('button',{name:confirmLabel,exact:true}).click();await admin.getByRole('status').filter({hasText:'Decision saved.'}).waitFor();}
try {
  await page.goto(`${base}/?source=supplier&requirementRef=REQ-BROWSER`,{waitUntil:'networkidle'});await page.getByRole('link',{name:'Become a supplier',exact:true}).click();assert.ok(page.url().includes('requirementRef=REQ-BROWSER'));
  await page.getByLabel('Email address').fill(email);await page.getByRole('button',{name:'Email me a secure link'}).click();await page.getByRole('status').filter({hasText:'secure application link'}).waitFor();
  const app=await prisma.supplierApplication.findUniqueOrThrow({where:{email}});assert.equal(app.requirementRef,'REQ-BROWSER');
  await page.goto(await mailLink(app.id,'/application/status'));await page.getByRole('heading',{name:'Your supplier application',exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'');
  await page.getByLabel('Full name *',{exact:true}).fill('Synthetic Global Browser Supplier');await page.getByLabel('Contact person *',{exact:true}).fill('Synthetic Browser Contact');await page.getByLabel('Country *',{exact:true}).fill('Kenya');
  await page.getByRole('button',{name:'Save changes',exact:true}).click();await saved();await page.getByRole('button',{name:'Next',exact:true}).click();console.log("Browser: identity saved");
  await page.getByLabel('Offerings *',{exact:true}).fill('existing datasets, custom collection');await page.getByLabel('Domains *',{exact:true}).fill('speech, language');await page.getByLabel('Description *',{exact:false}).fill('Synthetic multilingual speech capabilities for isolated browser qualification only.');await page.getByLabel('Rights *',{exact:false}).fill('Authorized to provide this synthetic data.');await page.getByLabel('Notes',{exact:true}).fill('Original synthetic free text retained.');
  await page.getByRole('button',{name:'Save changes',exact:true}).click();await saved();console.log("Browser: capabilities saved");await page.reload();await page.getByRole('button',{name:'3. Review & submit'}).click();await screenshot('application-review-desktop');
  await page.getByRole('button',{name:'Submit application',exact:true}).click();await page.getByRole('status').filter({hasText:'Submitted for admin review'}).waitFor();
  await admin.goto(`${adminBase}/login`,{waitUntil:'networkidle'});
  const loginResult=await adminContext.request.post('http://127.0.0.1:3224/api/v1/auth/login',{headers:{origin:adminBase},data:{email:'synthetic-onboarding-admin@example.test',password}});assert.equal(loginResult.status(),200);
  await admin.goto(`${adminBase}/dashboard/supplier-applications/${app.id}`,{waitUntil:'networkidle'});await admin.getByRole('heading',{name:'Application qualification'}).waitFor();await decide('INVITE');
  await page.goto(await mailLink(app.id,'/invitation'));await page.getByLabel('Set a password').fill(password);await page.getByLabel('Confirm password').fill(password);await page.getByRole('button',{name:'Activate account'}).click();
  await page.getByRole('heading',{name:'Complete your verification',exact:true}).waitFor();await page.getByRole('button',{name:'2. Private documents'}).click();
  await screenshot('verification-documents-desktop');await page.setViewportSize({width:390,height:844});await screenshot('verification-documents-mobile-light');await page.getByRole('button',{name:'Switch to dark mode'}).click();await screenshot('verification-documents-mobile-dark');
  for (const label of ['Identity Verification','Address Verification','Data Ownership & Licensing Declaration']) {
    await page.getByLabel(`Upload ${label}`,{exact:true}).setInputFiles({name:'synthetic-proof.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7\nSynthetic fixture only.\n%%EOF')});
    await page.getByRole('status').filter({hasText:'Document saved.'}).waitFor();
  }
  await page.getByRole('button',{name:'4. Review & submit'}).click();await page.getByRole('button',{name:'Submit verification',exact:true}).click();await page.getByRole('status').filter({hasText:'Submitted for admin review'}).waitFor();
  await admin.reload();await admin.getByRole('heading',{name:'Final verification review'}).waitFor();await admin.getByLabel('Supplier-facing reason / requested corrections').fill('Confirm your capacity before final approval.');await decide('REQUEST_CHANGES');
  await page.reload();await page.getByText('Confirm your capacity before final approval.').first().waitFor();await page.getByRole('button',{name:'3. Capabilities'}).click();await page.getByLabel('Capacity',{exact:true}).fill('100 hours per month');await page.getByRole('button',{name:'Save changes',exact:true}).click();await saved();await page.getByRole('button',{name:'4. Review & submit'}).click();await page.getByRole('button',{name:'Submit verification',exact:true}).click();await page.getByRole('status').filter({hasText:'Submitted for admin review'}).waitFor();
  await admin.reload();await admin.getByRole('heading',{name:'Final verification review'}).waitFor();await decide('APPROVE');
  await page.reload();await page.getByRole('link',{name:'Open supplier dashboard'}).waitFor();await page.getByRole('link',{name:'Open supplier dashboard'}).click();await page.waitForURL('**/dashboard');
  await page.goto(`${base}/dashboard/profile`);await page.getByRole('heading',{name:'Your supplier profile',exact:true}).waitFor();await page.setViewportSize({width:1440,height:1050});await screenshot('approved-own-profile-desktop-dark');
  await page.getByRole('button',{name:'3. Capabilities'}).click();await page.getByLabel('Languages',{exact:true}).fill('Swahili, English');await page.getByRole('button',{name:'Save changes',exact:true}).click();await saved();
  const final=await prisma.supplierApplication.findUniqueOrThrow({where:{id:app.id}});assert.equal(final.verificationStatus,'APPROVED');assert.deepEqual(final.capabilities.languages,['Swahili','English']);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL(base+'/');assert.deepEqual(errors,[]);
  console.log(JSON.stringify({journey:'PASS',applicationId:app.id,screenshots:5,states:['application','invitation','activation','documents','corrections','approval','own-profile','capability-maintenance','server-logout'],provider:'synthetic object storage; real local Postgres/Redis/session/queue and Next UIs'}));
} finally {await browser.close();await mailQueue.close();await redisClient.quit();await prisma.$disconnect();}
