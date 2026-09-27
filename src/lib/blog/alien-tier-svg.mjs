import { reportMoney } from './report-currency.mjs';

const colors = ['#5ed4bf', '#f3bd69', '#bc9cf5'];
const icons = {
  ios: '<path d="M25.4 7.8c2-2.4 1.8-5.1 1.8-5.8-2.9.2-6 2-7.8 4.1-1.7 1.8-3 4.2-2.7 7 3.1.2 6.2-1.6 8.7-5.3Zm6.4 17.7c.1-5.3 4.4-7.9 4.6-8-2.5-3.7-6.5-4.2-7.9-4.3-3.4-.4-6.6 2-8.3 2-1.7 0-4.3-2-7-2-3.6.1-6.9 2.1-8.7 5.2-3.7 6.3-.9 15.6 2.7 20.7 1.7 2.5 3.8 5.3 6.5 5.2 2.7-.1 3.6-1.7 6.9-1.7 3.2 0 4.1 1.7 7 1.6 2.9 0 4.7-2.6 6.5-5.1 2-2.9 2.8-5.7 2.9-5.9-.1 0-5.2-2-5.2-7.7Z"/>',
  android: '<path d="m10 10-3-5M30 10l3-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M3 24a17 17 0 0 1 34 0v3H3Z"/><circle cx="12" cy="19" r="2" fill="#101923"/><circle cx="28" cy="19" r="2" fill="#101923"/><path d="M4 30h32v8a4 4 0 0 1-4 4h-3v5h-5v-5h-8v5h-5v-5H8a4 4 0 0 1-4-4Z"/>',
};

export function tierSvg(platform, data, scope, currency = 'EUR', id = `${platform}-${scope}`) {
  const label = platform === 'ios' ? 'iOS' : 'Android';
  const cx = 210, cy = 171, radius = 98, circumference = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = data.tiers.map((tier, index) => {
    const length = tier.count / data.count * circumference;
    const arc = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${colors[index]}" stroke-width="33" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += length;
    return arc;
  }).join('');
  const legend = data.tiers.map((tier, index) => {
    const y = 344 + index * 80;
    const share = (tier.count / data.count * 100).toFixed(1);
    return `<circle cx="34" cy="${y-5}" r="6" fill="${colors[index]}"/><text x="51" y="${y}" font-size="20" font-weight="650">${tier.name}</text><text x="386" y="${y}" text-anchor="end" font-size="20" font-weight="650">${tier.count} · ${share}%</text><text x="51" y="${y+28}" fill="#b5c3d0" font-size="17">Gross sales</text><text x="386" y="${y+28}" text-anchor="end" fill="#dfe7ee" font-size="19" data-report-eur="${tier.grossEUR}">${reportMoney(tier.grossEUR,currency)}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 610" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${label} purchase tiers, ${scope === 'all' ? (platform === 'android' ? 'all-time including Android beta' : 'all-time') : 'launch reporting window'}</title><desc id="${id}-desc">Slices show purchase counts. ${data.tiers.map(t=>`${t.name}: ${t.count} purchases (${(t.count/data.count*100).toFixed(1)} percent)`).join('; ')}. Monetary labels show gross sales before store commission.</desc><rect x="1" y="1" width="418" height="608" rx="20" fill="#101923" stroke="#344452"/><g font-family="system-ui, -apple-system, sans-serif" fill="#f4f6f8"><text x="210" y="42" text-anchor="middle" font-size="25" font-weight="700">${label}</text>${arcs}<g transform="translate(${platform==='ios' ? 190 : 190},137)" fill="#edf3f8" color="#edf3f8">${icons[platform]}</g><text x="210" y="207" text-anchor="middle" fill="#c4d0d9" font-size="17">${data.count} purchases</text>${legend}<path d="M28 549H392" stroke="#344452"/><text x="28" y="580" font-size="18" fill="#b5c3d0">Total gross sales</text><text x="392" y="580" text-anchor="end" font-size="22" font-weight="700" data-report-eur="${data.grossEUR}">${reportMoney(data.grossEUR,currency)}</text></g></svg>`;
}
