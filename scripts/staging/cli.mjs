import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { checkStaging } from './guard.mjs';

process.loadEnvFile('.env.local');
const resources = checkStaging(process.env);
const action = process.argv[2] ?? 'check';
const allowed = ['check', 'seed', 'reset', 'status', 'configure-backend', 'emails', 'capture-smoke'];
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
  fs.mkdirSync('.qa-private', { recursive: true, mode: 0o700 });
  fs.writeFileSync('.qa-private/emails.json', JSON.stringify(captures, null, 2), { mode: 0o600 });
  console.log(`${captures.length} captures saved privately to .qa-private/emails.json`);
  process.exit(0);
}
const namespace = 'human-review-v1';
if (action === 'status') console.log(await client.query(anyApi.qa.status, { namespace }));
if (action === 'reset') {
  if (!process.argv.includes('--confirm=RESET_IDENTIFIED_QA_FIXTURES')) throw Error('Reset requires --confirm=RESET_IDENTIFIED_QA_FIXTURES');
  console.log(await client.mutation(anyApi.qa.reset, { namespace, confirmation: 'RESET_IDENTIFIED_QA_FIXTURES' }));
}
if (action === 'seed') {
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
  const files = [];
  for (const name of ['resume-a','resume-b','draft-v1','shared-v2','returned-copy-v3','superseded-scenario']) {
    const pdf = await PDFDocument.create(); const page = pdf.addPage(); const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText('SYNTHETIC QA — NOT A REAL AGREEMENT', { x: 35, y: 780, size: 17, font });
    page.drawText(name, { x: 35, y: 745, size: 14, font });
    page.drawText('Fictional test content. No real services, personal documents, or signatures.', { x: 35, y: 710, size: 11, font });
    const bytes = await pdf.save();
    fs.mkdirSync('.qa-private/documents', { recursive: true, mode: 0o700 });
    fs.writeFileSync(`.qa-private/documents/${name}.pdf`, bytes, { mode: 0o600 });
    files.push({ name: `${name}.pdf`, base64: Buffer.from(bytes).toString('base64') });
  }
  console.log(await client.action(anyApi.qa.seed, { namespace, accounts, files }));
}
