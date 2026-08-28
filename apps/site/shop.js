// ===== VAISSEAU MÈRE 237 — Shop Script =====
// Grille filtrable. Un clic sur un article ouvre sa fiche : produit.html?id=<id>
// (données dans shop-data.js, rendu dans produit.js).

document.addEventListener('DOMContentLoaded', () => {

  const emptyCategoryMessages = {
    'musique': {
      title: 'Musique & Albums physiques — Bientôt disponible',
      desc: 'Les CD, vinyles et éditions collector de NU9VE, Mr Kof et IZIS 27 sont actuellement en cours de pressage et de fabrication. Ils seront mis en vente très prochainement.'
    },
    'merch': {
      title: 'Textile & Merch officiel — En confection',
      desc: 'Les t-shirts oversize brodés, hoodies et casquettes du Vaisseau Mère 237 arrivent bientôt dans la boutique.'
    },
    'editions': {
      title: 'Éditions limitées & Artbooks — En préparation',
      desc: 'Les tirages d’art numérotés et l’Artbook Vol. 1 du collectif sont en cours d’impression d’art.'
    }
  };

  // --- Sélecteurs du DOM ---
  const filterBtns = document.querySelectorAll('.shop-filter-btn');
  const productCards = document.querySelectorAll('.product-card');
  const shopGrid = document.getElementById('shop-grid');
  const emptyState = document.getElementById('shop-empty-state');
  const emptyTitle = document.getElementById('empty-state-title');
  const emptyDesc = document.getElementById('empty-state-desc');
  const btnShowManga = document.getElementById('btn-show-manga');
  const countBadge = document.getElementById('visible-count');
  const categoryTitle = document.getElementById('active-category-title');

  // --- Filtrage par catégorie ---
  function filterCategory(cat) {
    let visibleCount = 0;

    filterBtns.forEach(btn => {
      const on = btn.dataset.category === cat;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    const categoryLabels = {
      'all': 'Tous les articles disponibles',
      'manga': 'Manga & Tableaux Remix',
      'musique': 'Musique & Albums Physiques',
      'merch': 'Merch & Textile',
      'editions': 'Éditions Limitées'
    };
    if (categoryTitle) {
      categoryTitle.textContent = categoryLabels[cat] || 'Articles';
    }

    productCards.forEach(card => {
      const cardCat = card.dataset.category;
      if (cat === 'all' || cardCat === cat) {
        card.style.display = 'flex';
        visibleCount++;
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 30);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 150);
      }
    });

    if (visibleCount === 0) {
      if (shopGrid) shopGrid.style.display = 'none';
      if (emptyState) {
        const msg = emptyCategoryMessages[cat] || {
          title: 'Articles à venir',
          desc: 'Cette catégorie sera disponible très prochainement.'
        };
        if (emptyTitle) emptyTitle.textContent = msg.title;
        if (emptyDesc) emptyDesc.textContent = msg.desc;
        emptyState.style.display = 'block';
      }
      if (countBadge) countBadge.textContent = 'Bientôt disponible';
    } else {
      if (shopGrid) shopGrid.style.display = 'grid';
      if (emptyState) emptyState.style.display = 'none';
      if (countBadge) {
        countBadge.textContent = `${visibleCount} article${visibleCount > 1 ? 's' : ''} disponible${visibleCount > 1 ? 's' : ''}`;
      }
    }
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => filterCategory(btn.dataset.category));
  });
  btnShowManga?.addEventListener('click', () => filterCategory('manga'));

  // --- Clic sur un article → fiche produit ---
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.view-product-btn, .product-card-img-wrap, .order-product-btn');
    if (!trigger) return;
    const card = trigger.closest('.product-card');
    const productId = card?.dataset.productId;
    if (productId) {
      e.preventDefault();
      window.location.href = `produit.html?id=${encodeURIComponent(productId)}`;
    }
  });

  // --- Hash d'arrivée (#manga, #merch…) ---
  const hash = window.location.hash.replace('#', '');
  if (['manga', 'musique', 'merch', 'editions'].includes(hash)) {
    filterCategory(hash);
  } else {
    filterCategory('all');
  }
});
