const MAP = {
  '${d.logo}': 'src/assets/images/logo.svg',
  '${emp.image}': 'src/assets/images/avatar.svg',
  '${doc.img}': 'src/assets/images/doc-placeholder.svg',
  '${r.logo}': 'src/assets/images/report-logo.svg',
  '${d.url}': '#',
  '${r.url}': '#'
};

function replacePlaceholders() {
  document.querySelectorAll('img, a, link, script, source').forEach(el => {
    ['src', 'href', 'srcset', 'data-src'].forEach(attr => {
      if (!el.hasAttribute(attr)) return;
      let v = el.getAttribute(attr);
      if (!v) return;
      Object.keys(MAP).forEach(k => { if (v.includes(k)) v = v.split(k).join(MAP[k]); });
      el.setAttribute(attr, v);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', replacePlaceholders);
} else {
  replacePlaceholders();
}

// run again after a short delay for dynamically injected content
setTimeout(replacePlaceholders, 800);
