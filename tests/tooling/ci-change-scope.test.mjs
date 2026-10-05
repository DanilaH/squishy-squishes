import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyChanges, isDocumentationOnly } from '../../scripts/ci-change-scope.mjs';

test('only nonempty allowlisted Markdown changes take the documentation path', () => {
  assert.equal(isDocumentationOnly(['README.md', 'AGENTS.md', 'docs/PROJECT_DECISIONS.md', 'docs/nested/review.md']), true);
  for (const path of ['src/main.ts', 'public/assets/bow.webp', 'tests/release/foo.spec.ts',
    'package.json', 'package-lock.json', '.github/workflows/release-check.yml',
    'scripts/ci-change-scope.mjs', 'vite.config.ts', 'docs/art.png', 'docs/input.json',
    'some-new-file.md', 'docs/.md', 'docs/review.md.js']) {
    assert.equal(isDocumentationOnly(['docs/README.md', path]), false, path);
  }
  assert.equal(isDocumentationOnly([]), false);
});

test('manual, new branch, missing history and failed comparison all require full QA', () => {
  const base = 'a'.repeat(40);
  assert.equal(classifyChanges(base, value => { assert.equal(value, base); return ['docs/README.md']; }), true);
  assert.equal(classifyChanges(base, () => ['src/main.ts']), false);
  assert.equal(classifyChanges(base, () => []), false);
  assert.equal(classifyChanges(base, () => { throw Error('missing shallow ancestor'); }), false);
  for (const invalid of [undefined, '', 'main', '0'.repeat(40), 'a'.repeat(39)]) {
    assert.equal(classifyChanges(invalid, () => { throw Error('must not call'); }), false);
  }
});


test('real Git comparisons include runtime deletion when a source file is renamed into docs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'squishy-ci-scope-'));
  const script = resolve('scripts/ci-change-scope.mjs');
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
  const classify = base => {
    const output = join(directory, 'scope-output');
    writeFileSync(output, '');
    execFileSync(process.execPath, [script], { cwd: directory,
      env: { ...process.env, BASE_SHA: base, GITHUB_OUTPUT: output } });
    return readFileSync(output, 'utf8').trim();
  };
  try {
    git('init', '-q'); git('config', 'user.email', 'scope-test@example.test'); git('config', 'user.name', 'Scope test');
    mkdirSync(join(directory, 'src')); mkdirSync(join(directory, 'docs'));
    writeFileSync(join(directory, 'src/main.ts'), 'runtime input');
    writeFileSync(join(directory, 'docs/README.md'), 'documentation');
    git('add', '.'); git('commit', '-qm', 'base');
    const base = git('rev-parse', 'HEAD');
    writeFileSync(join(directory, 'docs/README.md'), 'updated documentation');
    git('add', '.'); git('commit', '-qm', 'docs');
    assert.equal(classify(base), 'docs-only=true');
    renameSync(join(directory, 'src/main.ts'), join(directory, 'docs/source.md'));
    git('add', '-A'); git('commit', '-qm', 'runtime rename');
    assert.equal(classify(base), 'docs-only=false');
    assert.equal(classify('f'.repeat(40)), 'docs-only=false');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
