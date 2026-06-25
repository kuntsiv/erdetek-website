const root = document.getElementById("root");
let site;
let validLanguages = new Set();

function html(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function currentLanguage() {
  const fromHash = location.hash.match(/lang=([a-z]{2})/);
  const stored = localStorage.getItem("erdetek.lang");
  const browser = navigator.language?.slice(0, 2);
  return [fromHash?.[1], stored, browser, "en"].find((code) => validLanguages.has(code));
}

function setLanguage(language) {
  localStorage.setItem("erdetek.lang", language);
  document.documentElement.lang = language;
  render(language);
}

function textWithEm(parts) {
  return `${html(parts[0])}<em>${html(parts[1])}</em>${html(parts[2])}`;
}

function parseLanguagePack(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value || {};
}

function getContent(lang) {
  return parseLanguagePack(site.i18n[lang] || site.i18n.en);
}

function renderTopbar(t, lang) {
  const navIds = ["capabilities", "coverage", "methodology", "insights", "about", "contact"];
  return `
    <header class="topbar">
      <div class="container topbar__inner">
        <a href="#" class="brand" aria-label="Erdetek home">
          <span class="brand__mark" aria-hidden="true"></span>
          <span>${site.company.shortName}</span>
          <span class="brand__co">${site.company.legalSuffix}</span>
        </a>
        <nav class="nav" aria-label="Primary">
          ${t.nav.map((label, index) => `<a href="#${navIds[index]}" class="${index === 5 ? "pill" : ""}">${html(label)}</a>`).join("")}
          <span class="lang-switch" aria-label="Language">
            ${site.languages.map((language) => `<button type="button" data-lang="${language.code}" aria-pressed="${language.code === lang}" title="${html(language.name)}">${language.label}</button>`).join("")}
          </span>
        </nav>
      </div>
    </header>
  `;
}

function renderTicker() {
  const items = [...site.market, ...site.market].map(({ sym, px, chg, pct, up, tag }) => `
    <div class="ticker__item">
      <span class="ticker__sym">${html(sym)}</span>
      <span class="ticker__px">${html(px)}</span>
      <span class="ticker__chg ${up ? "up" : "down"}">${html(chg)} ${html(pct)}</span>
      <span class="ticker__tag">${html(tag)}</span>
    </div>
  `).join("");
  return `<div class="ticker" aria-label="Indicative market levels"><div class="ticker__rail">${items}</div></div>`;
}

function renderHero(t) {
  return `
    <section class="hero">
      <div class="container hero__grid">
        <div>
          <span class="kicker">${html(t.heroKicker)}</span>
          <h1 class="hero__title">${textWithEm(t.heroTitle)}</h1>
          <div class="btn-row">
            <a href="#contact" class="btn btn--solid">${html(t.heroCta[0])} <span class="arrow">→</span></a>
            <a href="#capabilities" class="btn btn--ghost">${html(t.heroCta[1])} <span class="arrow">→</span></a>
          </div>
        </div>
        <div>
          <p class="hero__lede">${html(t.heroLede)}</p>
          <div class="hero__meta">
            ${t.meta.map(([label, value]) => `<div class="hero__meta-row"><span>${html(label)}</span><strong>${html(value)}</strong></div>`).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderStats(t) {
  return `
    <section class="stats">
      <div class="container stats__grid">
        ${t.stats.map(([n, supOrLabel, maybeLabel]) => {
          const sup = maybeLabel === undefined ? "+" : supOrLabel;
          const label = maybeLabel === undefined ? supOrLabel : maybeLabel;
          return `<div class="stat"><div class="stat__n">${html(n)}${sup ? `<sup>${html(sup)}</sup>` : ""}</div><div class="stat__label">${html(label)}</div></div>`;
        }).join("")}
      </div>
    </section>
  `;
}

function renderTrust(t) {
  return `
    <section class="trust">
      <div class="container trust__inner">
        <div class="trust__label">${html(t.trust)}</div>
        <div class="trust__marks">${t.trustMarks.map((mark) => `<div class="trust__mark">${html(mark)}</div>`).join("")}</div>
      </div>
    </section>
  `;
}

function renderCapabilities(t) {
  return `
    <section id="capabilities" class="caps">
      <div class="container">
        <div class="section-head">
          <div><span class="kicker">${html(t.nav[0])}</span><h2 class="section-head__title">${textWithEm(t.capsTitle)}</h2></div>
          <p class="section-head__desc">${html(t.capsDesc)}</p>
        </div>
        <div class="caps__list">
          ${site.shared.capabilities.map(({ n, title, body, tag }) => `
            <article class="cap">
              <div class="cap__n">${n}</div>
              <h3 class="cap__title">${html(title)}</h3>
              <p class="cap__body">${html(body)}</p>
              <div class="cap__tag">${html(tag)}</div>
            </article>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderCoverage(t) {
  return `
    <section id="coverage" class="coverage">
      <div class="container">
        <div class="section-head">
          <div><span class="kicker">${html(t.nav[1])}</span><h2 class="section-head__title">${textWithEm(t.coverageTitle || [t.trust, "", ""])}</h2></div>
          <p class="section-head__desc">${html(t.coverageDesc || t.methodDesc)}</p>
        </div>
        <div class="coverage__grid">
          ${site.shared.desks.map(({ city, tz, focus }) => `<article class="desk"><h3 class="desk__city">${html(city)}</h3><div class="desk__tz">${html(tz)}</div><p class="desk__focus">${html(focus)}</p></article>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderMethod(t) {
  return `
    <section id="methodology" class="method">
      <div class="container">
        <div class="section-head">
          <div><span class="kicker">${html(t.nav[2])}</span><h2 class="section-head__title">${textWithEm(t.methodTitle)}</h2></div>
          <p class="section-head__desc">${html(t.methodDesc)}</p>
        </div>
        <div class="method__grid">
          ${site.shared.steps.map(({ n, title, tag, body }) => `<article class="step"><div class="step__tag">${html(tag)}</div><div class="step__n">${html(n)}</div><h3 class="step__title">${html(title)}</h3><p class="step__body">${html(body)}</p></article>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderInsights(t) {
  return `
    <section class="pull"><div class="container pull__inner"><div class="pull__mark">"</div><p class="pull__text">${html(t.pull)}</p><div class="pull__attr">${html(t.pullAttr || site.company.name)}</div></div></section>
    <section id="insights" class="insights">
      <div class="container">
        <div class="section-head">
          <div><span class="kicker">${html(t.nav[3])}</span><h2 class="section-head__title">${textWithEm(t.insightsTitle)}</h2></div>
          <p class="section-head__desc">${html(t.insightsDesc || t.capsDesc)}</p>
        </div>
        <div class="insights__grid">
          ${site.shared.insights.map((article) => `<article class="article"><div class="article__fig ${html(article.img)}"><span class="article__fig-label">${html(article.label)}</span></div><div class="article__meta"><span>${html(article.kicker)}</span><span>${html(article.date)}</span><span>${html(article.read)}</span></div><h3 class="article__title">${html(article.title)}</h3><p class="article__body">${html(article.body)}</p><span class="article__more">Read note <span class="arrow">→</span></span></article>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderAbout(t) {
  return `
    <section id="about" class="about">
      <div class="container">
        <div class="about__intro">
          <h2 class="about__lede">${Array.isArray(t.aboutLede) ? textWithEm(t.aboutLede) : html(t.aboutTitle[0])}</h2>
          <div class="about__paragraph">${t.aboutBody.map((p) => `<p>${html(p)}</p>`).join("")}</div>
        </div>
        <div class="leaders">
          ${site.company.contacts.map((person) => `<article class="leader"><h3 class="leader__name">${html(person.name)}</h3><div class="leader__role">${html(person.role)}</div><p class="leader__bio">${html(person.bio || person.phone || "")}</p><a class="leader__email" href="mailto:${html(person.email)}">${html(person.email)}</a></article>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderContact(t) {
  return `
    <section id="contact" class="cta">
      <div class="container cta__grid">
        <div><span class="kicker">${html(t.contactKicker || t.nav[5])}</span><h2 class="cta__title">${textWithEm(t.contactTitle)}</h2></div>
        <div>
          <p class="cta__body">${html(t.contactBody)}</p>
          <div class="btn-row">
            <a class="btn btn--solid" href="mailto:${site.company.email}">${html(t.contactCta?.[0] || site.company.email)} <span class="arrow">→</span></a>
            <a class="btn btn--ghost" href="#about">${html(t.contactCta?.[1] || "README")} <span class="arrow">→</span></a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderFooter(t) {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            <a href="#" class="brand"><span class="brand__mark" aria-hidden="true"></span><span>${site.company.shortName}</span><span class="brand__co">${site.company.legalSuffix}</span></a>
            <address class="footer__addr">
              ${site.company.address.join("<br>")}<br>
              EU VAT: ${site.company.vat}<br>
              KRS: ${site.company.krs}<br>
              REGON: ${site.company.regon}<br>
              EORI: ${site.company.eori}
            </address>
            <div class="open-source-note">${html(t.footer[4])} · <a href="/LICENSE">MIT</a></div>
          </div>
          <div class="footer__col"><h5>${html(t.footer[0])}</h5><ul><li><a href="#capabilities">${html(t.nav[0])}</a></li><li><a href="#coverage">${html(t.nav[1])}</a></li><li><a href="mailto:${site.company.email}">Trade desk</a></li></ul></div>
          <div class="footer__col"><h5>${html(t.footer[1])}</h5><ul><li><a href="#about">${html(t.nav[4])}</a></li><li><a href="#contact">${html(t.nav[5])}</a></li><li><a href="/README.md">README</a></li></ul></div>
          <div class="footer__col"><h5>${html(t.footer[2])}</h5><ul><li>${site.company.name}</li><li>EU VAT: ${site.company.vat}</li><li>KRS: ${site.company.krs}</li><li>REGON: ${site.company.regon}</li></ul></div>
        </div>
        <div class="footer__legal"><span>© 2026 ${site.company.name}</span><a href="/content/site.json">${html(t.footer[3])}</a><span>${html(t.footerNote || "")}</span></div>
      </div>
    </footer>
  `;
}

function render(lang = currentLanguage()) {
  const t = getContent(lang);
  document.title = `${site.company.shortName} - ${t.nav[0]}`;
  root.innerHTML = [
    renderTopbar(t, lang),
    renderTicker(),
    renderHero(t),
    renderStats(t),
    renderTrust(t),
    renderCapabilities(t),
    renderCoverage(t),
    renderMethod(t),
    renderInsights(t),
    renderAbout(t),
    renderContact(t),
    renderFooter(t),
  ].join("");

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
}

window.addEventListener("hashchange", () => {
  const fromHash = location.hash.match(/lang=([a-z]{2})/);
  if (fromHash?.[1] && validLanguages.has(fromHash[1])) setLanguage(fromHash[1]);
});

async function boot() {
  const response = await fetch("/content/site.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`Unable to load content: ${response.status}`);
  site = await response.json();
  validLanguages = new Set(site.languages.map((language) => language.code));
  setLanguage(currentLanguage());
}

boot().catch((error) => {
  root.innerHTML = `<main class="container" style="padding: 80px 32px"><h1>Content unavailable</h1><p>${html(error.message)}</p></main>`;
});
