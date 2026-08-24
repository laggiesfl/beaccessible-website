const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const trustOps = fs.readFileSync(path.join(root, 'trustops.html'), 'utf8');
const grantFlow = fs.readFileSync(path.join(root, 'grantflow.html'), 'utf8');

test('Phase 1 preserves the TrustOps login, modules, and keyboard tab behavior', () => {
  for (const marker of [
    'id="login-form"',
    'id="tab-dashboard"',
    'id="tab-projects"',
    'id="tab-finance"',
    'id="tab-approvals"',
    'id="tab-impact"',
    'id="tab-documents"',
    "if (e.key === 'ArrowRight')",
    "if (e.key === 'Home')",
    "document.getElementById('main-content').focus()"
  ]) {
    assert.ok(trustOps.includes(marker), 'Missing TrustOps invariant: ' + marker);
  }
});

test('Phase 1 preserves the complete GrantFlow workflow and budget behavior', () => {
  for (const functionName of [
    'renderApplications', 'submitScore', 'approve', 'decline',
    'generateAgreement', 'signAgreement', 'releasePayment',
    'submitReport', 'flagRisk', 'updateBudgetCalculator',
    'validateBudget', 'simulateSubmission', 'resetDemo'
  ]) {
    assert.ok(
      grantFlow.includes('function ' + functionName + '('),
      'Missing GrantFlow invariant: ' + functionName
    );
  }
});

test('each legacy module clearly identifies its simulated or manual-only behavior', () => {
  assert.match(trustOps, /demo sign-in/i);
  assert.match(grantFlow, /no live AI decision engine/i);
});

test('legacy module footers do not claim unverified WCAG AAA conformance', () => {
  assert.doesNotMatch(trustOps, /WCAG 2\.2 Level AAA/);
  assert.doesNotMatch(grantFlow, /Built to WCAG 2\.0\/2\.1\/2\.2 Level AAA/);
});

test('GrantFlow escapes applicant-provided organisation names before HTML rendering', () => {
  assert.ok(grantFlow.includes('function escapeHtml('));
  assert.ok(grantFlow.includes('${escapeHtml(app.organisation)}'));
});
