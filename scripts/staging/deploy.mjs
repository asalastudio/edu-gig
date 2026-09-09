import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { loadTarget } from './target.mjs';
import { checkStaging } from './guard.mjs';
const {resources:r,automated}=loadTarget();
if (!automated) {
 const project=JSON.parse(fs.readFileSync('.vercel/project.json'));
 if (project.projectId!==r.vercelProjectId || project.orgId!==r.vercelTeamId) throw Error('Refusing deploy: wrong Vercel project');
}
const status=execFileSync('git',['status','--porcelain'],{encoding:'utf8'});
if (status.trim()) throw Error('Commit reviewed staging changes first so deployment revision is reproducible');
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const env={...process.env,VERCEL_PROJECT_ID:r.vercelProjectId,VERCEL_ORG_ID:r.vercelTeamId};
checkStaging(env);
const result=spawnSync('vercel',['deploy','--prod','--yes','--scope','asala','--meta',`qaCommit=${sha}`,'--build-env',`QA_BUILD_COMMIT=${sha}`],{stdio:'inherit',env});
process.exit(result.status??1);
