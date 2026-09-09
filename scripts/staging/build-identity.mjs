const commitPattern = /^[a-f0-9]{40}$/;
export function buildIdentitySource(env) {
  const commit = env.QA_BUILD_COMMIT || env.VERCEL_GIT_COMMIT_SHA;
  if (!commitPattern.test(commit ?? '')) throw Error('Exact build commit required');
  if (env.QA_BUILD_COMMIT && env.VERCEL_GIT_COMMIT_SHA && env.QA_BUILD_COMMIT !== env.VERCEL_GIT_COMMIT_SHA) throw Error('Build commit mismatch');
  return `// Generated inside the hosting build before Convex and Next compilation.\nexport const BUILD_COMMIT: string = ${JSON.stringify(commit)};\n`;
}
export function verifyBuildIdentity(expected, proof) {
  if (!commitPattern.test(expected ?? '') || proof.buildCommit !== expected) throw Error('Deployed backend commit proof mismatch');
}
