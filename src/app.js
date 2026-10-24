const root = document.getElementById("root");
let site;
let validLanguages = new Set();
const SUPPORTED_LANGUAGES = ["pl", "uk", "ru", "en", "de", "fr", "es"];
const DEFAULT_DESCRIPTION = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
const ARTICLE_UI = {
  pl: {
    back: "Wróć do analiz",
    read: "Czytaj artykuł",
    details: "Szczegóły",
    sources: "Źródła",
    labels: "Etykiety",
    unavailableTitle: "Ten artykuł nie jest dostępny w wybranym języku",
    unavailableBody: "Wybierz inny język lub wróć do listy analiz.",
  },
  uk: {
    back: "Повернутися до оглядів",
    read: "Читати статтю",
    details: "Деталі",
    sources: "Джерела",
    labels: "Мітки",
    unavailableTitle: "Ця стаття недоступна обраною мовою",
    unavailableBody: "Виберіть іншу мову або поверніться до списку оглядів.",
  },
  ru: {
    back: "Вернуться к обзорам",
    read: "Читать статью",
    details: "Детали",
    sources: "Источники",
    labels: "Метки",
    unavailableTitle: "Эта статья недоступна на выбранном языке",
    unavailableBody: "Выберите другой язык или вернитесь к списку обзоров.",
  },
  en: {
    back: "Back to insights",
    read: "Read article",
    details: "Details",
    sources: "Sources",
    labels: "Labels",
    unavailableTitle: "This article is not available in the selected language",
    unavailableBody: "Choose another language or return to the insights index.",
  },
  de: {
    back: "Zurück zu den Analysen",
    read: "Artikel lesen",
    details: "Details",
    sources: "Quellen",
    labels: "Labels",
    unavailableTitle: "Dieser Artikel ist in der gewählten Sprache nicht verfügbar",
    unavailableBody: "Wählen Sie eine andere Sprache oder kehren Sie zur Übersicht zurück.",
  },
  fr: {
    back: "Retour aux analyses",
    read: "Lire l’article",
    details: "Détails",
    sources: "Sources",
    labels: "Libellés",
    unavailableTitle: "Cet article n’est pas disponible dans la langue sélectionnée",
    unavailableBody: "Choisissez une autre langue ou revenez à l’index des analyses.",
  },
  es: {
    back: "Volver a los análisis",
    read: "Leer el artículo",
    details: "Detalles",
    sources: "Fuentes",
    labels: "Etiquetas",
    unavailableTitle: "Este artículo no está disponible en el idioma seleccionado",
    unavailableBody: "Elija otro idioma o vuelva al índice de análisis.",
  },
};

const DANGEROUS_TAGS = new Set([
  "script", "style", "form", "iframe", "frame", "frameset", "object", "embed",
  "applet", "svg", "math", "template", "img", "picture", "source", "video",
  "audio", "track", "canvas", "map", "area", "input", "button", "select",
  "option", "optgroup", "textarea", "link", "meta", "base", "title", "head",
  "noscript", "portal", "param",
]);

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "s", "sub", "sup", "a", "blockquote",
  "code", "pre", "span", "figure", "figcaption", "dl", "dt", "dd",
]);

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

function currentRoute() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const langParam = params.get("lang");
  const lang = validLanguages.has(langParam) ? langParam : currentLanguage();
  return {
    articleId: params.get("article"),
    lang: lang || "en",
  };
}

function articleHash(contentId, lang) {
  return `#article=${encodeURIComponent(contentId)}&lang=${encodeURIComponent(lang)}`;
}

function canonicalUrl(contentId, lang) {
  return `${location.origin}${location.pathname}${articleHash(contentId, lang)}`;
}

function articleUi(lang) {
  return ARTICLE_UI[lang] || ARTICLE_UI.en;
}

function setLanguage(language) {
  if (!validLanguages.has(language)) return;
  localStorage.setItem("erdetek.lang", language);
  document.documentElement.lang = language;
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const articleId = params.get("article");
  if (articleId) {
    const target = articleHash(articleId, language);
    if (location.hash === target) {
      renderRoute();
    } else {
      location.hash = target;
    }
    return;
  }
  render(language);
}

function bindLanguageButtons() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
}

function textWithEm(parts) {
  return `${html(parts[0])}<em>${html(parts[1])}</em>${parts[2] !== undefined ? html(parts[2]) : ''}`;
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

function getLocalePack(lang) {
  if (!site || !site.i18n || !Object.prototype.hasOwnProperty.call(site.i18n, lang)) return null;
  const pack = parseLanguagePack(site.i18n[lang]);
  return pack && typeof pack === "object" && !Array.isArray(pack) ? pack : null;
}

function isArticleObject(value) {
  return Boolean(value)
    && typeof value === "object"
    && !Array.isArray(value)
    && typeof value.content_id === "string"
    && value.content_id.length > 0
    && typeof value.title === "string"
    && value.title.length > 0;
}

function getArticles(lang) {
  const pack = getLocalePack(lang);
  if (!pack || !Array.isArray(pack.articles)) return [];
  const seen = new Set();
  const articles = [];
  for (const item of pack.articles) {
    if (!isArticleObject(item) || seen.has(item.content_id)) continue;
    seen.add(item.content_id);
    articles.push(item);
  }
  return articles;
}

function findArticle(lang, contentId) {
  return getArticles(lang).find((article) => article.content_id === contentId);
}

function plainTextFrom(value) {
  if (typeof value !== "string") return "";
  const template = document.createElement("template");
  template.innerHTML = value;
  template.content.querySelectorAll("script, style, template, noscript, iframe, object, embed, svg, math").forEach((node) => node.remove());
  return (template.content.textContent || "").replace(/\s+/g, " ").trim();
}

function scalarText(value) {
  return ["string", "number", "boolean"].includes(typeof value) ? String(value).trim() : "";
}

function displayTitle(article) {
  return plainTextFrom(article.title) || article.content_id;
}

function safeHref(raw) {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("#")) return value;
  try {
    const url = new URL(value, location.href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function appendSanitizedChildren(source, target, depth) {
  if (depth > 100) return;
  source.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(node.nodeValue));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName.toLowerCase();
    if (DANGEROUS_TAGS.has(tag)) return;
    if (!ALLOWED_TAGS.has(tag)) {
      appendSanitizedChildren(node, target, depth + 1);
      return;
    }
    if (tag === "br" || tag === "hr") {
      target.appendChild(document.createElement(tag));
      return;
    }
    if (tag === "a") {
      const href = safeHref(node.getAttribute("href"));
      if (!href) {
        appendSanitizedChildren(node, target, depth + 1);
        return;
      }
      const link = document.createElement("a");
      link.setAttribute("href", href);
      link.setAttribute("rel", "noopener noreferrer");
      const title = node.getAttribute("title");
      if (title) link.setAttribute("title", title);
      appendSanitizedChildren(node, link, depth + 1);
      target.appendChild(link);
      return;
    }
    const element = document.createElement(tag);
    appendSanitizedChildren(node, element, depth + 1);
    target.appendChild(element);
  });
}

function appendPlainText(container, text) {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  const paragraphs = normalized.split(/\n{2,}/);
  paragraphs.forEach((block) => {
    const paragraph = document.createElement("p");
    block.split("\n").forEach((line, index) => {
      if (index > 0) paragraph.appendChild(document.createElement("br"));
      paragraph.appendChild(document.createTextNode(line));
    });
    if (!paragraph.childNodes.length) paragraph.appendChild(document.createElement("br"));
    container.appendChild(paragraph);
  });
}

function appendSafeBody(container, body) {
  if (typeof body !== "string" || !body.trim()) return;
  const template = document.createElement("template");
  template.innerHTML = body;
  if (!template.content.querySelector("*")) {
    appendPlainText(container, template.content.textContent || "");
    return;
  }
  appendSanitizedChildren(template.content, container, 0);
}

function textElement(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined && value !== null) element.textContent = String(value);
  return element;
}

function labelTexts(labels) {
  const out = [];
  if (Array.isArray(labels)) {
    labels.forEach((value) => {
      const text = scalarText(value);
      if (text) out.push(text);
    });
    return out;
  }
  if (!labels || typeof labels !== "object") return out;
  Object.entries(labels).forEach(([key, value]) => {
    const text = scalarText(value);
    if (text) {
      out.push(`${key}: ${text}`);
      return;
    }
    if (Array.isArray(value)) {
      const parts = value.map((item) => scalarText(item)).filter(Boolean);
      if (parts.length) out.push(`${key}: ${parts.join(", ")}`);
    }
  });
  return out;
}

function appendMetaValue(parent, value) {
  if (value === null || value === undefined) return false;
  if (["string", "number", "boolean"].includes(typeof value)) {
    const text = String(value).trim();
    if (!text) return false;
    if (/^https?:\/\//i.test(text)) {
      const href = safeHref(text);
      if (href) {
        const link = document.createElement("a");
        link.setAttribute("href", href);
        link.setAttribute("rel", "noopener noreferrer");
        link.textContent = text;
        parent.appendChild(link);
        return true;
      }
    }
    parent.appendChild(document.createTextNode(text));
    return true;
  }
  if (Array.isArray(value)) {
    let appended = false;
    value.forEach((item, index) => {
      if (!appended) {
        appended = appendMetaValue(parent, item);
        return;
      }
      const probe = document.createElement("span");
      if (appendMetaValue(probe, item)) {
        parent.appendChild(document.createTextNode(", "));
        parent.appendChild(probe);
        appended = true;
      }
    });
    return appended;
  }
  if (typeof value !== "object") return false;
  const label = [value.title, value.name, value.label, value.text]
    .find((item) => typeof item === "string" && item.trim());
  const href = safeHref(value.url ?? value.href);
  if (href && label) {
    const link = document.createElement("a");
    link.setAttribute("href", href);
    link.setAttribute("rel", "noopener noreferrer");
    link.textContent = label;
    parent.appendChild(link);
    return true;
  }
  let appended = false;
  Object.entries(value).forEach(([key, item]) => {
    if (item === null || item === undefined || typeof item === "object") return;
    const text = scalarText(item);
    if (!text) return;
    if (appended) parent.appendChild(document.createTextNode(" · "));
    const part = document.createElement("span");
    part.textContent = `${key}: ${text}`;
    parent.appendChild(part);
    appended = true;
  });
  return appended;
}

function buildCta(cta, ui) {
  const container = document.createElement("div");
  container.className = "article-detail__cta";
  if (typeof cta === "string" && cta.trim()) {
    container.appendChild(textElement("p", "", plainTextFrom(cta) || cta));
    return container;
  }
  if (!cta || typeof cta !== "object" || Array.isArray(cta)) {
    if (appendMetaValue(container, cta)) return container;
    return null;
  }
  const label = [cta.label, cta.title, cta.text, cta.name]
    .find((item) => typeof item === "string" && item.trim());
  const href = safeHref(cta.url ?? cta.href);
  if (label && href) {
    const link = document.createElement("a");
    link.className = "btn btn--solid";
    link.setAttribute("href", href);
    link.setAttribute("rel", "noopener noreferrer");
    link.textContent = label;
    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = "→";
    link.appendChild(document.createTextNode(" "));
    link.appendChild(arrow);
    container.appendChild(link);
    return container;
  }
  if (label) {
    container.appendChild(textElement("p", "", label));
    return container;
  }
  if (appendMetaValue(container, cta)) return container;
  return null;
}

function buildArticleDetail(article, lang, ui) {
  const wrapper = document.createElement("article");
  wrapper.className = "article-detail__content";

  const back = document.createElement("a");
  back.className = "btn btn--ghost article-detail__back";
  back.setAttribute("href", "#insights");
  back.textContent = ui.back;
  wrapper.appendChild(back);

  const kicker = plainTextFrom(article.kicker);
  if (kicker) wrapper.appendChild(textElement("span", "kicker", kicker));

  wrapper.appendChild(textElement("h1", "article-detail__title", plainTextFrom(article.title) || article.title));

  const summary = plainTextFrom(article.summary);
  if (summary) wrapper.appendChild(textElement("p", "article-detail__summary", summary));

  const labels = labelTexts(article.labels);
  if (labels.length) {
    const labelSection = document.createElement("div");
    labelSection.className = "article-detail__labels";
    const labelHead = textElement("span", "article-detail__label-head", ui.labels);
    labelSection.appendChild(labelHead);
    labels.forEach((label) => labelSection.appendChild(textElement("span", "article-detail__label", label)));
    wrapper.appendChild(labelSection);
  }

  const body = document.createElement("div");
  body.className = "article-detail__body";
  if (typeof article.body === "string" && article.body.trim()) {
    appendSafeBody(body, article.body);
  }
  if (body.childNodes.length) wrapper.appendChild(body);

  const altText = plainTextFrom(article.alt_text);
  if (altText) wrapper.appendChild(textElement("p", "article-detail__alt", altText));

  const cta = buildCta(article.cta, ui);
  if (cta) wrapper.appendChild(cta);

  if (Array.isArray(article.evidence_ids) && article.evidence_ids.length) {
    const sources = document.createElement("section");
    sources.className = "article-detail__sources";
    sources.appendChild(textElement("h2", "article-detail__section-title", ui.sources));
    const list = document.createElement("ul");
    article.evidence_ids.forEach((evidence) => {
      const item = document.createElement("li");
      if (appendMetaValue(item, evidence)) list.appendChild(item);
    });
    if (list.childNodes.length) {
      sources.appendChild(list);
      wrapper.appendChild(sources);
    }
  }

  return wrapper;
}

function buildUnavailable(ui) {
  const wrapper = document.createElement("article");
  wrapper.className = "article-detail__content article-detail__unavailable";
  const back = document.createElement("a");
  back.className = "btn btn--ghost article-detail__back";
  back.setAttribute("href", "#insights");
  back.textContent = ui.back;
  wrapper.appendChild(back);
  wrapper.appendChild(textElement("h1", "article-detail__title", ui.unavailableTitle));
  wrapper.appendChild(textElement("p", "article-detail__summary", ui.unavailableBody));
  return wrapper;
}

function ensureDescriptionMeta() {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  return meta;
}

function setCanonical(href) {
  let link = document.querySelector('link[data-atelier-canonical]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("data-atelier-canonical", "");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function setJsonLd(value) {
  let script = document.querySelector('script[data-atelier-jsonld]');
  if (!script) {
    script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.setAttribute("data-atelier-jsonld", "");
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(value);
}

function clearArticleMeta() {
  document.querySelector('link[data-atelier-canonical]')?.remove();
  document.querySelector('script[data-atelier-jsonld]')?.remove();
}

function suppliedJsonLd(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function articleDescription(article) {
  return plainTextFrom(article.summary).slice(0, 300)
    || plainTextFrom(article.body).slice(0, 300);
}

function articleMetadataText(article, key) {
  const metadata = article && article.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  return plainTextFrom(metadata[key]);
}

function buildJsonLd(article, canonical, lang) {
  const supplied = suppliedJsonLd(article.jsonld);
  if (supplied) return supplied;
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: plainTextFrom(article.title) || article.title,
    identifier: article.content_id,
    inLanguage: lang,
    url: canonical,
  };
  const description = articleDescription(article);
  if (description) data.description = description;
  if (typeof article.date === "string" && article.date.trim()) data.datePublished = article.date;
  if (typeof article.content_type === "string" && article.content_type.trim()) data.articleSection = article.content_type;
  const labels = labelTexts(article.labels);
  if (labels.length) data.keywords = labels.join(", ");
  return data;
}

function updateArticleMeta(article, contentId, lang) {
  const canonical = canonicalUrl(contentId, lang);
  const legacyTitle = `${plainTextFrom(article.title) || article.title} - ${site.company.shortName}`;
  const title = articleMetadataText(article, "meta_title") || legacyTitle;
  const description = articleMetadataText(article, "meta_description") || articleDescription(article);
  document.title = title;
  ensureDescriptionMeta().setAttribute("content", description || DEFAULT_DESCRIPTION);
  setCanonical(canonical);
  setJsonLd(buildJsonLd(article, canonical, lang));
}

function updateUnavailableMeta(lang) {
  const ui = articleUi(lang);
  document.title = `${ui.unavailableTitle} - ${site.company.shortName}`;
  ensureDescriptionMeta().setAttribute("content", ui.unavailableBody || DEFAULT_DESCRIPTION);
  clearArticleMeta();
}

function resetPageMeta(t) {
  document.title = `${site.company.shortName} - ${t.nav[0]}`;
  ensureDescriptionMeta().setAttribute("content", DEFAULT_DESCRIPTION);
  clearArticleMeta();
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
            ${site.languages.filter((language) => validLanguages.has(language.code)).map((language) => `<button type="button" data-lang="${language.code}" aria-pressed="${language.code === lang}" title="${html(language.name)}">${language.label}</button>`).join("")}
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

function renderArticleCard(article, lang, ui) {
  const href = html(articleHash(article.content_id, lang));
  const title = plainTextFrom(article.title) || article.title;
  const summary = plainTextFrom(article.summary);
  const kicker = plainTextFrom(article.kicker) || scalarText(article.content_type);
  const date = scalarText(article.date);
  const labels = labelTexts(article.labels).slice(0, 3);
  const metaParts = [kicker, date, ...labels].filter(Boolean)
    .map((value) => `<span>${html(value)}</span>`).join("");
  return `
    <article class="article article--generated">
      ${metaParts ? `<div class="article__meta">${metaParts}</div>` : ""}
      <h3 class="article__title"><a class="article__title-link" href="${href}">${html(title)}</a></h3>
      ${summary ? `<p class="article__body">${html(summary)}</p>` : ""}
      <a class="article__more" href="${href}">${html(ui.read)} <span class="arrow">→</span></a>
    </article>
  `;
}

function renderInsights(t, lang) {
  const ui = articleUi(lang);
  const generated = getArticles(lang).map((article) => renderArticleCard(article, lang, ui)).join("");
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
          ${generated}
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

function scrollToSectionFromHash() {
  const raw = location.hash.replace(/^#/, "");
  if (!raw || raw.includes("=")) return;
  const target = document.getElementById(raw);
  if (target) requestAnimationFrame(() => target.scrollIntoView());
}

function render(lang = currentLanguage()) {
  const t = getContent(lang);
  resetPageMeta(t);
  root.innerHTML = [
    renderTopbar(t, lang),
    renderTicker(),
    renderHero(t),
    renderStats(t),
    renderTrust(t),
    renderCapabilities(t),
    renderCoverage(t),
    renderMethod(t),
    renderInsights(t, lang),
    renderAbout(t),
    renderContact(t),
    renderFooter(t),
  ].join("");
  bindLanguageButtons();
  scrollToSectionFromHash();
}

function renderArticlePage(articleId, lang) {
  const t = getContent(lang);
  const ui = articleUi(lang);
  const article = findArticle(lang, articleId);
  if (article) {
    updateArticleMeta(article, articleId, lang);
  } else {
    updateUnavailableMeta(lang);
  }
  root.innerHTML = [
    renderTopbar(t, lang),
    `<main id="article" class="article-detail container"></main>`,
    renderFooter(t),
  ].join("");
  const main = root.querySelector("#article");
  main.appendChild(article ? buildArticleDetail(article, lang, ui) : buildUnavailable(ui));
  bindLanguageButtons();
}

function renderRoute() {
  const route = currentRoute();
  document.documentElement.lang = route.lang;
  if (validLanguages.has(route.lang)) localStorage.setItem("erdetek.lang", route.lang);
  if (route.articleId) {
    renderArticlePage(route.articleId, route.lang);
  } else {
    render(route.lang);
  }
}

window.addEventListener("hashchange", () => {
  renderRoute();
});

async function boot() {
  const response = await fetch("/content/site.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`Unable to load content: ${response.status}`);
  site = await response.json();
  const siteLanguages = new Set(site.languages.map((language) => language.code));
  validLanguages = new Set(SUPPORTED_LANGUAGES.filter((code) => siteLanguages.has(code)));
  renderRoute();
}

boot().catch((error) => {
  root.innerHTML = `<main class="container" style="padding: 80px 32px"><h1>Content unavailable</h1><p>${html(error.message)}</p></main>`;
});
