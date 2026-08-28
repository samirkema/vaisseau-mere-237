// ===== VAISSEAU MÈRE 237 — Fiche article =====
// Lit ?id=<product-id> dans l'URL, remplit la fiche depuis window.VM_PRODUCTS
// (shop-data.js). Carrousel de photos avec flèches ← → si plusieurs images.

document.addEventListener('DOMContentLoaded', () => {
  const products = window.VM_PRODUCTS || {};
  const contact  = window.VM_CONTACT || {};

  const id = new URLSearchParams(window.location.search).get('id');
  const data = id ? products[id] : null;

  const grid     = document.getElementById('pd-grid');
  const notfound = document.getElementById('pd-notfound');

  if (!data) {
    if (grid) grid.hidden = true;
    if (notfound) notfound.hidden = false;
    document.title = 'Article introuvable — Boutique Vaisseau Mère 237';
    return;
  }

  document.title = `${data.title} — Boutique Vaisseau Mère 237`;

  // --- Textes ---
  const setText = (elId, value) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = value;
  };
  setText('pd-cat', data.categoryLabel || '');
  setText('pd-title', data.title || '');

  const badge = document.getElementById('pd-badge');
  if (badge && data.badge) { badge.textContent = data.badge; badge.hidden = false; }

  const price = document.getElementById('pd-price');
  if (price) {
    price.innerHTML = '';
    const eur = document.createElement('span');
    eur.className = 'pd-price-eur';
    eur.textContent = data.priceEur || '';
    price.appendChild(eur);
    if (data.priceCfa) {
      const cfa = document.createElement('span');
      cfa.className = 'pd-price-cfa';
      cfa.textContent = `(${data.priceCfa})`;
      price.appendChild(cfa);
    }
  }

  // Description — masquée tant qu'aucun texte n'est fourni
  const desc = document.getElementById('pd-description');
  if (desc && data.description && data.description.trim() !== '') {
    desc.textContent = data.description;
    desc.hidden = false;
  }

  // Caractéristiques
  const specsBlock = document.getElementById('pd-specs-block');
  const specs = document.getElementById('pd-specs');
  if (specsBlock && specs && Array.isArray(data.specs) && data.specs.length > 0) {
    specs.innerHTML = '';
    data.specs.forEach(s => {
      const li = document.createElement('li');
      const check = document.createElement('span');
      check.className = 'spec-check';
      check.textContent = '✓';
      li.appendChild(check);
      li.appendChild(document.createTextNode(' ' + s));
      specs.appendChild(li);
    });
    specsBlock.hidden = false;
  }

  // --- Commande : WhatsApp + email pré-remplis ---
  const orderMsg = `Bonjour Vaisseau Mère 237, je souhaite commander :\n- ${data.title}\n- Prix : ${data.priceEur}${data.priceCfa ? ' / ' + data.priceCfa : ''}\nPouvez-vous m'indiquer les modalités de livraison et de paiement ?`;

  const wa = document.getElementById('pd-whatsapp');
  if (wa && contact.whatsapp) {
    wa.href = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(orderMsg)}`;
  }
  const em = document.getElementById('pd-email');
  if (em && contact.email) {
    const subject = encodeURIComponent(`Commande boutique VM237 : ${data.title}`);
    em.href = `mailto:${contact.email}?subject=${subject}&body=${encodeURIComponent(orderMsg)}`;
  }

  // --- Carrousel ---
  const images = Array.isArray(data.images) && data.images.length > 0
    ? data.images
    : ['images/logo-vm237.jpeg'];

  const photo = document.getElementById('pd-photo');
  const prev  = document.getElementById('pd-prev');
  const next  = document.getElementById('pd-next');
  const dots  = document.getElementById('pd-dots');
  let index = 0;

  function render() {
    if (photo) {
      photo.src = images[index];
      photo.alt = `${data.title} — photo ${index + 1} sur ${images.length}`;
    }
    if (dots) {
      [...dots.children].forEach((d, i) => {
        d.classList.toggle('active', i === index);
        d.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }
  }

  function go(delta) {
    index = (index + delta + images.length) % images.length;
    render();
  }

  if (images.length > 1) {
    if (prev) { prev.hidden = false; prev.addEventListener('click', () => go(-1)); }
    if (next) { next.hidden = false; next.addEventListener('click', () => go(1)); }

    if (dots) {
      dots.hidden = false;
      images.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pd-dot';
        b.setAttribute('aria-label', `Aller à la photo ${i + 1}`);
        b.addEventListener('click', () => { index = i; render(); });
        dots.appendChild(b);
      });
    }

    // Clavier
    const carousel = document.getElementById('pd-carousel');
    if (carousel) {
      carousel.tabIndex = 0;
      carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      });

      // Glissement tactile
      let startX = null;
      carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
      carousel.addEventListener('touchend', (e) => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        startX = null;
      });
    }
  }

  render();
});
