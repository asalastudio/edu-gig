import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { loadTarget, expectedCommit } from './target.mjs';
import { verifyBuildIdentity } from './build-identity.mjs';

const { resources, automated, privateDirectory } = loadTarget();
const action = process.argv[2] ?? 'check';
const allowed = ['check', 'seed', 'reset', 'status', 'configure-backend', 'emails', 'capture-smoke', 'release-seed', 'release-reset', 'release-status', 'delivery-fixtures'];
if (!allowed.includes(action)) throw Error('Unknown staging command');
// Live Clerk identity proof is required on every operation; a label is insufficient.
const response = await fetch('https://api.clerk.com/v1/instance', { headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` } });
if (!response.ok) throw Error(`Clerk resource verification failed (${response.status})`);
const instance = await response.json();
if (instance.id !== resources.clerkInstanceId || instance.environment_type !== 'development') throw Error('Clerk isolation verification failed');
if (action === 'configure-backend') {
  const keys = ['APP_ENV','QA_CONVEX_DEPLOYMENT','QA_CLERK_INSTANCE_ID','CLERK_JWT_ISSUER_DOMAIN','NEXT_PUBLIC_APP_URL','QA_ALLOWED_CLERK_IDS','QA_EMAIL_MODE','CONVEX_WEBHOOK_SHARED_SECRET'];
  for (const key of keys) execFileSync('npx', ['convex','env','set',key], { input: process.env[key], stdio: ['pipe','pipe','pipe'] });
  console.log('Configured exact staging backend; credentials omitted.');
  process.exit(0);
}
const client = new ConvexHttpClient(resources.convexUrl);
client.setAdminAuth(process.env.CONVEX_DEPLOY_KEY);
const proof = await client.query(anyApi.qa.environment, {});
if (proof.convexUrl !== resources.convexUrl || proof.clerkIssuer !== resources.clerkIssuer || proof.appUrl !== resources.appUrl) throw Error('Backend isolation proof mismatch');
const mutating = ['seed','reset','release-seed','release-reset','delivery-fixtures','capture-smoke'].includes(action);
const commit = mutating ? expectedCommit() : undefined;
if (mutating) verifyBuildIdentity(commit, proof);
if (['reset','release-reset','delivery-fixtures','capture-smoke'].includes(action) && !automated) throw Error('Mutable automation requires --automation');
if (action === 'check') { console.log(JSON.stringify(proof, null, 2)); process.exit(0); }
if (action === 'capture-smoke') {
  const messageId = await client.query(anyApi.qa.messageFixtureId, {});
  if (!messageId) throw Error('Seed fixtures first');
  await client.action(anyApi.emails.sendNewMessageAlert, { messageId });
  console.log('Staging dispatcher exercised against a synthetic existing message; delivery captured.');
  process.exit(0);
}
if (action === 'emails') {
  const captures = await client.query(anyApi.qa.emailCaptures, {});
  fs.mkdirSync(privateDirectory, { recursive: true, mode: 0o700 });
  fs.writeFileSync(`${privateDirectory}/emails.json`, JSON.stringify(captures, null, 2), { mode: 0o600 });
  console.log(`${captures.length} captures saved privately to ${privateDirectory}/emails.json`);
  process.exit(0);
}
const namespace = action.startsWith('release-') || action === 'delivery-fixtures' ? 'release-candidate-v1' : 'human-review-v1';
if (action === 'delivery-fixtures') {
 if (!process.argv.includes('--confirm=SIMULATE_CAPTURE_ONLY_DELIVERY')) throw Error('Require --confirm=SIMULATE_CAPTURE_ONLY_DELIVERY');
 console.log(await client.mutation(anyApi.qa.deliveryFixtures, {namespace,expectedCommit:commit,confirmation:'SIMULATE_CAPTURE_ONLY_DELIVERY'}));
}

if (['status','release-status'].includes(action)) console.log(await client.query(anyApi.qa.status, { namespace }));
if (['reset','release-reset'].includes(action)) {
  if (!process.argv.includes('--confirm=RESET_IDENTIFIED_QA_FIXTURES')) throw Error('Reset requires --confirm=RESET_IDENTIFIED_QA_FIXTURES');
  console.log(await client.mutation(anyApi.qa.reset, { expectedCommit: commit, namespace, confirmation: 'RESET_IDENTIFIED_QA_FIXTURES' }));
}
if (['seed','release-seed'].includes(action)) {
  const roster = JSON.parse(fs.readFileSync('.qa-private/accounts.json', 'utf8'));
  if (roster.instanceId !== resources.clerkInstanceId) throw Error('Private roster belongs to another Clerk instance');
  const accounts = roster.accounts.map(({ alias, email, clerkId }) => ({ alias, email, clerkId }));
  // Verify real identities instead of accepting invented user IDs in the fixture file.
  for (const account of accounts) {
    const r = await fetch(`https://api.clerk.com/v1/users/${account.clerkId}`, { headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` } });
    if (!r.ok) throw Error('QA identity lookup failed');
    const user = await r.json();
    if (!user.email_addresses?.some(e => e.email_address === account.email) || user.private_metadata?.qaEnvironment !== 'k12gig-staging') throw Error('QA identity ownership mismatch');
  }
  const existing = await client.query(anyApi.qa.status, {namespace});
  if (existing) { console.log({seeded:false,count:existing.count}); process.exit(0); }
  fs.mkdirSync(`${privateDirectory}/documents`, {recursive:true,mode:0o700});
  const documentDirectory=fs.mkdtempSync(`${privateDirectory}/documents/${namespace}-`);
  const files = [];
  const names=namespace==='release-candidate-v1' ? ['agreement-original','agreement-signed-copy','agreement-revision','amendment-private','synthetic-extra-a','synthetic-extra-b'] : ['resume-a','resume-b','draft-v1','shared-v2','returned-copy-v3','superseded-scenario'];
  for (const name of names) {
    const pdf = await PDFDocument.create(); const page = pdf.addPage(); const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText('SYNTHETIC QA - NOT A REAL AGREEMENT', { x: 35, y: 780, size: 17, font });
    page.drawText(name, { x: 35, y: 745, size: 14, font });
    page.drawText('Fictional test content. No real services, personal documents, or signatures.', { x: 35, y: 710, size: 11, font });
    const bytes = await pdf.save();
    fs.writeFileSync(`${documentDirectory}/${name}.pdf`, bytes, { mode: 0o600, flag: 'wx' });
    files.push({ name: `${name}.pdf`, base64: Buffer.from(bytes).toString('base64') });
  }
  console.log(await client.action(anyApi.qa.seed, { expectedCommit: commit, namespace, accounts, files }));
}
