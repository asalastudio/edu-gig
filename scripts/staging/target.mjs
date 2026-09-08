import stable from './resources.json' with { type: 'json' };
import automation from './automation-resources.json' with { type: 'json' };
import { checkStaging } from './guard.mjs';
/** Explicit target selection never changes .env.local or .vercel/project.json. */
export function selectedTarget(argv = process.argv.slice(2)) {
 const automated = argv.includes('--automation');
 return { resources: automated ? automation : stable, envPath: automated ? '.qa-private/automation-infra/app.env' : '.env.local', privateDirectory: automated ? '.qa-private/automation-infra' : '.qa-private', automated };
}
export function loadTarget(argv = process.argv.slice(2)) {
 const selected = selectedTarget(argv);
 process.loadEnvFile(selected.envPath);
 const actual = checkStaging(process.env);
 if (actual.convexDeployment !== selected.resources.convexDeployment) throw Error('Explicit staging target mismatch');
 return selected;
}
export function expectedCommit(argv = process.argv.slice(2)) {
 const commit = argv.find(a=>a.startsWith('--expected-commit='))?.slice('--expected-commit='.length);
 if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw Error('Require --expected-commit=<reviewed full SHA>');
 return commit;
}
