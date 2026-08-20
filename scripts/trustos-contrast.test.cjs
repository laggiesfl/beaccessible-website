const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

function contrast(first, second) {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

test('brand text pairs used by TrustOS meet WCAG AA normal-text contrast', () => {
  const pairs = [
    ['#0F1F35', '#FFFFFF'],
    ['#0F1F35', '#F0F5FB'],
    ['#174A82', '#FFFFFF'],
    ['#FFFFFF', '#1F3F6B'],
    ['#E6EEF8', '#0D1F36']
  ];

  pairs.forEach(([foreground, background]) => {
    assert.ok(
      contrast(foreground, background) >= 4.5,
      `${foreground} on ${background} must meet 4.5:1`
    );
  });
});

test('dual focus-ring colours provide a three-to-one boundary on light and dark surfaces', () => {
  assert.ok(contrast('#0F1F35', '#FFFFFF') >= 3);
  assert.ok(contrast('#FFFFFF', '#0F1F35') >= 3);

  for (const fileName of [
    'trustos.html', 'trustos-privacy.html', 'trustos-accessibility.html',
    'trustops.html', 'grantflow.html'
  ]) {
    const source = fs.readFileSync(path.join(root, fileName), 'utf8');
    assert.match(source, /outline:\s*(?:3px|4px) solid (?:var\(--focus-inner\)|#FFFFFF)/);
    assert.match(source, /box-shadow:\s*0 0 0 8px (?:var\(--focus-outer\)|#0F1F35)/);
  }
});

test('the active TrustOS module retains both its selected state and outer focus ring', () => {
  const source = fs.readFileSync(path.join(root, 'trustos.html'), 'utf8');
  const rule = source.match(/\.module-button\.is-active:focus-visible\s*\{([^}]+)\}/)?.[1] || '';
  assert.match(rule, /inset 0 0 0 2px var\(--white\)/);
  assert.match(rule, /0 0 0 8px var\(--focus-outer\)/);
});
