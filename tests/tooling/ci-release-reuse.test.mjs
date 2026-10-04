import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { findVerifiedArtifact, verifyArtifact } from '../../scripts/ci-release-reuse.mjs';
const repo = 'DanilaH/squishy-squishes', sha = 'a'.repeat(40), head = 'b'.repeat(40), tree = 'c'.repeat(40), source = 'd'.repeat(40);
const pr = { merged_at: '2026-10-04', merge_commit_sha: sha, base: { ref: 'main', repo: { full_name: repo } }, head: { sha: head, repo: { full_name: repo } } };
const run = { id: 123, run_attempt: 2, event: 'pull_request', head_sha: head, status: 'completed', conclusion: 'success', repository: { full_name: repo } };
const jobs = ['release-check', 'browser-qa', 'pages-preview'].map(name => ({ name, status: 'completed', conclusion: 'success' }));
const artifact = { id: 456, name: 'release-build-2', expired: false };
const fake = (changes = {}) => async path => {
  if (path.endsWith('/pulls')) return changes.pulls ?? [pr];
  if (path.includes('/workflows/')) return { workflow_runs: changes.runs ?? [run] };
  if (path.includes('/jobs?')) return { jobs: changes.jobs ?? jobs };
  if (path.includes('/artifacts?')) return { artifacts: changes.artifacts ?? [artifact] };
  throw Error(path);
};
test('only the latest-attempt artifact of a successful matching merged PR is eligible', async () => {
  assert.deepEqual(await findVerifiedArtifact(fake(), repo, sha), { runId: 123, artifactId: 456, headSha: head });
  for (const changes of [
    { pulls: [] }, { pulls: [{ ...pr, merged_at: null }] }, { pulls: [{ ...pr, merge_commit_sha: source }] },
    { pulls: [{ ...pr, head: { ...pr.head, repo: { full_name: 'fork/repo' } } }] },
    { runs: [{ ...run, head_sha: source }] }, { runs: [{ ...run, conclusion: 'failure' }] },
    { runs: [{ ...run, event: 'workflow_dispatch' }] },
    { jobs: jobs.map(j => j.name === 'browser-qa' ? { ...j, conclusion: 'skipped' } : j) },
    { jobs: jobs.filter(j => j.name !== 'pages-preview') },
    { artifacts: [{ ...artifact, expired: true }] }, { artifacts: [{ ...artifact, name: 'release-build-1' }] },
  ]) assert.equal(await findVerifiedArtifact(fake(changes), repo, sha), null);
});
test('reusing QA requires exact whole-source tree, source provenance and unmodified archive', () => {
  const archive = Buffer.from('the exact tested build');
  const evidence = { tree, sourceTree: tree, sourceSha: source,
    sourceCommit: { sha: source, tree: { sha: tree }, parents: [{ sha: head }] }, candidate: { headSha: head },
    archive, checksum: `${createHash('sha256').update(archive).digest('hex')}  release-build.tar.gz\n` };
  assert.equal(verifyArtifact(evidence), true);
  for (const changes of [
    { sourceTree: sha }, { sourceTree: '' }, { sourceSha: 'invalid' },
    { sourceCommit: { ...evidence.sourceCommit, tree: { sha } } },
    { sourceCommit: { ...evidence.sourceCommit, parents: [{ sha }] } },
    { sourceCommit: { ...evidence.sourceCommit, sha } },
    { archive: Buffer.from('changed bytes') }, { checksum: 'missing checksum' },
  ]) assert.equal(verifyArtifact({ ...evidence, ...changes }), false);
});
