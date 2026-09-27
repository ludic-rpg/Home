import { preferredReportCurrency, reportMoney } from '../lib/blog/report-currency.mjs';
import iosUsdChart from '../content/blog/2026/09-27/assets/ios-purchase-tiers-usd.svg?url&no-inline';
import androidUsdChart from '../content/blog/2026/09-27/assets/android-purchase-tiers-usd.svg?url&no-inline';

function initializeReport() {
  if (!document.querySelector('.alien-report-overview')) return;
  let saved = null;
  try { saved = localStorage.getItem('ludic-report-currency'); } catch { /* Storage can be unavailable. */ }

  // Visible EUR text is the author's value. Keep extra reporting precision only
  // while it still rounds to that text, so editing the article changes the site.
  const amounts = Array.from(document.querySelectorAll<HTMLElement>('[data-report-eur]')).map(element => {
    const text = element.textContent?.trim() || '';
    const precision = Number(element.dataset.reportEur);
    const visible = Number(text.replace(/[€,\s]/g, ''));
    const eur = Number.isFinite(precision) && reportMoney(precision) === text ? precision : visible;
    return { element, eur };
  }).filter(({eur}) => Number.isFinite(eur));

  // The source contains ordinary Markdown images, also readable in Obsidian.
  const charts = [
    { name: 'iOS', usd: iosUsdChart },
    { name: 'Android', usd: androidUsdChart },
  ].flatMap(({name, usd}) => {
    const image = document.querySelector<HTMLImageElement>(`article img[alt^="${name} all-time purchase tiers"]`);
    if (!image) return [];
    return [{ image, eur: image.src, usd, alt: image.alt, paragraph: image.closest('p') }];
  });
  if (charts.length === 2 && charts[0].paragraph && charts[1].paragraph && charts[0].paragraph.nextElementSibling === charts[1].paragraph) {
    const group = document.createElement('div');
    group.className = 'report-donuts';
    charts[0].paragraph.before(group);
    charts.forEach(({paragraph}) => {
      if (!paragraph) return;
      paragraph.classList.add('report-donut');
      group.append(paragraph);
    });
  }

  const applyCurrency = (currency: 'EUR' | 'USD') => {
    document.documentElement.dataset.reportCurrency = currency;
    amounts.forEach(({element, eur}) => { element.textContent = reportMoney(eur, currency); });
    charts.forEach(({image, eur, usd, alt}) => {
      image.src = currency === 'USD' ? usd : eur;
      image.alt = alt.replace('Gross sales in EUR.', `Gross sales in ${currency}.`);
      const link = image.closest<HTMLAnchorElement>('a.prose-image-link');
      if (link) {
        link.href = image.src;
        link.setAttribute('aria-label', `${image.alt}. Enlarge image`);
      }
    });
    document.querySelectorAll('button[data-report-currency]').forEach(button => button.setAttribute('aria-pressed', String(button.getAttribute('data-report-currency') === currency)));
  };
  applyCurrency(preferredReportCurrency(navigator.languages, saved));
  document.querySelector('[data-report-currency-controls]')?.removeAttribute('hidden');
  document.querySelectorAll<HTMLButtonElement>('button[data-report-currency]').forEach(button => button.addEventListener('click', () => {
    const currency = button.dataset.reportCurrency as 'EUR' | 'USD';
    applyCurrency(currency);
    try { localStorage.setItem('ludic-report-currency', currency); } catch { /* Keep the current choice for this page. */ }
  }));
}

initializeReport();
