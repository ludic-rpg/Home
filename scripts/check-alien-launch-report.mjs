import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { preferredReportCurrency, reportMoney, USD_PER_EUR } from '../src/lib/blog/report-currency.mjs';
import { tierSvg } from '../src/lib/blog/alien-tier-svg.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/blog/alien-launch-data.json'), 'utf8'));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

// Keep the original observations available while checking the published all-time scope.
for (const platform of Object.values(data.platforms)) for (const scope of ['public', 'all']) {
  assert.equal(platform[scope].tiers.reduce((sum, tier) => sum + tier.count, 0), platform[scope].count);
  close(platform[scope].tiers.reduce((sum, tier) => sum + tier.grossEUR, 0), platform[scope].grossEUR);
}
assert.deepEqual(data.platforms.ios.all.tiers.map((tier) => tier.count), [43, 13, 4]);
assert.deepEqual(data.platforms.android.all.tiers.map((tier) => tier.count), [96, 17, 11]);
assert.equal(data.platforms.ios.all.count, 60);
assert.equal(data.platforms.android.all.count, 124);
assert.equal(data.platforms.ios.all.count + data.platforms.android.all.count, 184);
assert.equal(data.defaultDonutScope, 'all');
assert.equal(data.platforms.ios.acquisitionsIncludingBeta + data.platforms.android.acquisitionsIncludingBeta, 1755);

const countries = JSON.parse(fs.readFileSync(path.join(root, 'src/components/blog/alien-launch-countries.json'), 'utf8'));
assert.equal(countries.rows.length, 77);
assert.equal(countries.rows.filter((row) => row.grossEUR > 0).length, 22);
assert.equal(countries.rows.reduce((sum, row) => sum + row.total, 0) + countries.other.total, 1755);
close(countries.rows.reduce((sum, row) => sum + row.grossEUR, 0), data.combined.all.grossEUR);
close(data.net.iosEUR + data.net.androidAfterKnownAdjustmentEUR, data.totalNetEUR);
assert.equal(data.platforms.android.all.count - data.platforms.android.public.count, 40);
close(data.platforms.android.all.grossEUR - data.platforms.android.public.grossEUR, 369.48);
close(data.platforms.ios.all.grossEUR * data.fxUsdPerEur, 593.727685);
close(data.fxUsdPerEur, USD_PER_EUR);
assert.equal(reportMoney(data.platforms.ios.all.grossEUR, 'USD'), '$593.73');
assert.equal(reportMoney(data.platforms.android.all.grossEUR, 'USD'), '$1,246.76');
assert.equal(reportMoney(data.combined.all.grossEUR, 'EUR'), '€1,601.81');
assert.equal(reportMoney(data.combined.all.grossEUR, 'USD'), '$1,840.48');

for (const [languages, expected] of [[['fr-FR'], 'EUR'], [['en-US'], 'USD'], [['en-IE'], 'EUR'], [['de-DE'], 'EUR'], [['fr'], 'EUR'], [['en'], 'USD'], [[], 'EUR'], [['invalid tag'], 'EUR']]) {
  assert.equal(preferredReportCurrency(languages), expected);
}
assert.equal(preferredReportCurrency(['fr-FR'], 'USD'), 'USD');
assert.equal(preferredReportCurrency(['en-US'], 'EUR'), 'EUR');

// Ordinary image elements swap between these static variants. Regenerate all four together.
const written = process.argv.includes('--write');
for (const platform of ['ios', 'android']) {
  const snapshot = data.platforms[platform].all;
  const amounts = [...snapshot.tiers.map((tier) => tier.grossEUR), snapshot.grossEUR];
  for (const currency of ['EUR', 'USD']) {
    const svg = tierSvg(platform, snapshot, 'all', currency);
    const suffix = currency === 'USD' ? '-usd' : '';
    const filename = path.join(root, `src/content/blog/2026/09-27/assets/${platform}-purchase-tiers${suffix}.svg`);
    assert.ok(svg.includes(platform === 'android' ? 'all-time including Android beta' : 'iOS purchase tiers, all-time</title>'), `${platform}: wrong reporting scope`);
    assert.ok(svg.includes(`${snapshot.count} purchases`), `${platform}: wrong purchase total`);
    for (const tier of snapshot.tiers) {
      const description = `${tier.name}: ${tier.count} purchases (${(tier.count / snapshot.count * 100).toFixed(1)} percent)`;
      assert.ok(svg.includes(description), `${platform}: incorrect ${tier.name} description`);
    }
    const labels = [...svg.matchAll(/<text\b[^>]*data-report-eur="([^"]+)"[^>]*>([^<]+)<\/text>/g)];
    assert.equal(labels.length, amounts.length, `${platform} ${currency}: missing monetary labels`);
    labels.forEach((label, index) => {
      close(Number(label[1]), amounts[index]);
      assert.equal(label[2], reportMoney(amounts[index], currency), `${platform} ${currency}: incorrect amount`);
    });
    assert.ok(!svg.includes(String.fromCodePoint(0x2014)), 'Forbidden punctuation in SVG');
    if (written) fs.writeFileSync(filename, svg);
    else assert.equal(fs.readFileSync(filename, 'utf8'), svg, `Regenerate ${filename} with --write`);
  }
}
console.log(`Report counts, sales, source reconciliation, FX, locale preferences and four EUR/USD SVG assets ${written ? 'generated and' : 'source-matched and'} verified.`);
