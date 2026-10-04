import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export async function findVerifiedArtifact(get, repository, sha) {
  const root = `/repos/${repository}`;
  const pulls = await get(`${root}/commits/${sha}/pulls`);
  const pr = pulls.find(p => p.merged_at && p.merge_commit_sha === sha && p.base.ref === 'main'
    && p.base.repo.full_name === repository && p.head.repo?.full_name === repository);
  if (!pr) return null;
  const runs = await get(`${root}/actions/workflows/release-check.yml/runs?event=pull_request&head_sha=${pr.head.sha}&status=success&per_page=30`);
  for (const run of runs.workflow_runs) {
    if (run.event !== 'pull_request' || run.head_sha !== pr.head.sha || run.status !== 'completed'
      || run.conclusion !== 'success' || run.repository.full_name !== repository) continue;
    const jobs = await get(`${root}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`);
    if (!['release-check', 'browser-qa', 'pages-preview'].every(name => jobs.jobs.some(j =>
      j.name === name && j.status === 'completed' && j.conclusion === 'success'))) continue;
    const artifacts = await get(`${root}/actions/runs/${run.id}/artifacts?per_page=100`);
    const artifact = artifacts.artifacts.find(a => a.name === `release-build-${run.run_attempt}` && !a.expired);
    if (artifact) return { runId: run.id, artifactId: artifact.id, headSha: pr.head.sha };
  }
  return null;
}

export function verifyArtifact({ tree, sourceTree, sourceSha, sourceCommit, candidate, archive, checksum }) {
  const validSha = /^[a-f0-9]{40}$/;
  if (!validSha.test(sourceSha) || !validSha.test(sourceTree) || sourceTree !== tree
    || sourceCommit.sha !== sourceSha || sourceCommit.tree.sha !== tree
    || !(sourceSha === candidate.headSha || sourceCommit.parents.some(p => p.sha === candidate.headSha))) return false;
  return checksum.trim() === `${createHash('sha256').update(archive).digest('hex')}  release-build.tar.gz`;
}

async function cli(mode) {
  const { GITHUB_REPOSITORY: repository, GITHUB_SHA: sha, GITHUB_TOKEN: token, GITHUB_OUTPUT: output } = process.env;
  const emit = (key, value) => appendFileSync(output, `${key}=${value}\n`);
  const get = async path => {
    const response = await fetch(`${process.env.GITHUB_API_URL ?? 'https://api.github.com'}${path}`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    });
    if (!response.ok) throw new Error(`GitHub evidence HTTP ${response.status}`);
    return response.json();
  };
  if (mode === 'find') {
    try {
      const candidate = await findVerifiedArtifact(get, repository, sha);
      if (candidate) {
        writeFileSync('.ci-reuse-candidate.json', JSON.stringify(candidate));
        emit('run-id', candidate.runId); emit('artifact-id', candidate.artifactId);
        console.log(`Candidate: successful PR run ${candidate.runId}, artifact ${candidate.artifactId}`);
      } else console.log('No successful merged PR artifact; full verification required.');
    } catch { console.log('PR evidence unavailable; full verification required.'); }
    return;
  }
  let proof = null;
  try {
    const candidate = JSON.parse(readFileSync('.ci-reuse-candidate.json', 'utf8'));
    const sourceSha = readFileSync('ci-build/source-sha', 'utf8').trim();
    const sourceTree = readFileSync('ci-build/source-tree', 'utf8').trim();
    if (!/^[a-f0-9]{40}$/.test(sourceSha)) throw new Error('Invalid source');
    const tree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim();
    const sourceCommit = await get(`/repos/${repository}/git/commits/${sourceSha}`);
    if (verifyArtifact({ tree, sourceTree, sourceSha, sourceCommit, candidate,
      archive: readFileSync('ci-build/release-build.tar.gz'), checksum: readFileSync('ci-build/SHA256SUMS', 'utf8') })) {
      proof = { ...candidate, sourceSha, sourceTree };
    }
  } catch { /* Missing/old/expired/mismatched evidence must use the full path. */ }
  emit('qa-reused', String(proof !== null));
  if (proof) {
    writeFileSync('ci-build/verified-pr.json', JSON.stringify(proof, null, 2));
    writeFileSync('ci-build/source-sha', `${sha}\n`);
    console.log(`Reusing exact checked bytes from PR run ${proof.runId}; source tree ${proof.sourceTree}`);
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Full QA reused from PR run ${proof.runId}; exact source tree and archive checksum verified.\n`);
  } else {
    rmSync('ci-build', { recursive: true, force: true });
    console.log('No exact verified artifact; build and run full QA.');
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await cli(process.argv[2]);
