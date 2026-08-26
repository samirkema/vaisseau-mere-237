// ===== VAISSEAU MÈRE 237 — Shop Script =====

document.addEventListener('DOMContentLoaded', () => {
  // --- Données des tableaux manga actuellement en vente ---
  const productsData = {
    'manga-deku': {
      id: 'manga-deku',
      title: 'Tableau Remix — Deku & Les Enfants du 237',
      category: 'manga',
      categoryLabel: 'Manga · Tableau Remix',
      priceEur: '15 €',
      priceCfa: '10 000 FCFA',
      image: 'images/shop/manga-deku-237.jpg',
      badge: 'Disponible',
      description: "Tirage d'art exclusif fusionnant l'univers My Hero Academia (Izuku Midoriya) et l'authenticité de la vie urbaine à Yaoundé. Une création originale symbole de persévérance et de connexion culturelle.",
      specs: [
        'Impression Premium sur papier couché satiné 300g/m²',
        'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
        'Finitions anti-reflet haute fidélité des couleurs',
        'Numéroté & certifié par le collectif Vaisseau Mère 237'
      ],
      linkManga: 'https://vaisseaumanga237.vercel.app'
    },
    'manga-naruto': {
      id: 'manga-naruto',
      title: 'Tableau Remix — Naruto Hokage & Alloco 237',
      category: 'manga',
      categoryLabel: 'Manga · Tableau Remix',
      priceEur: '15 €',
      priceCfa: '10 000 FCFA',
      image: 'images/shop/manga-naruto-alloco-237.jpg',
      badge: 'Disponible',
      description: "Quand le 7e Hokage savoure la gastronomie camerounaise : une illustration inédite mêlant le héros de Konoha et un plat traditionnel de plantains frits (alloco/dodo).",
      specs: [
        'Impression d’art haute définition sur papier texturé 300g',
        'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
        'Couleurs vives résistantes aux UV',
        'Emballage tube rigide renforcé pour expédition protégée'
      ],
      linkManga: 'https://vaisseaumanga237.vercel.app'
    }
  };

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

  // Modale
  const modal = document.getElementById('product-modal');
  const modalOverlay = modal?.querySelector('.modal-overlay');
  const modalClose = modal?.querySelector('.modal-close');
  const modalImg = document.getElementById('modal-product-img');
  const modalCategory = document.getElementById('modal-product-category');
  const modalTitle = document.getElementById('modal-product-title');
  const modalPrice = document.getElementById('modal-product-price');
  const modalBadge = document.getElementById('modal-product-badge');
  const modalDesc = document.getElementById('modal-product-desc');
  const modalSpecs = document.getElementById('modal-product-specs');
  const modalWhatsapp = document.getElementById('modal-btn-whatsapp');
  const modalEmail = document.getElementById('modal-btn-email');
  const modalMangaLink = document.getElementById('modal-btn-manga');

  // --- Filtrage par catégorie ---
  function filterCategory(cat) {
    let visibleCount = 0;

    // Mise à jour des boutons de filtre
    filterBtns.forEach(btn => {
      if (btn.dataset.category === cat) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // Mise à jour du titre de la section
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

    // Affichage/Masquage des cartes avec animation
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

    // Gestion de l'état "Bientôt disponible"
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
      if (countBadge) {
        countBadge.textContent = 'Bientôt disponible';
      }
    } else {
      if (shopGrid) shopGrid.style.display = 'grid';
      if (emptyState) emptyState.style.display = 'none';
      if (countBadge) {
        countBadge.textContent = `${visibleCount} article${visibleCount > 1 ? 's' : ''} disponible${visibleCount > 1 ? 's' : ''}`;
      }
    }
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterCategory(btn.dataset.category);
    });
  });

  btnShowManga?.addEventListener('click', () => {
    filterCategory('manga');
  });

  // --- Gestion de la Modale Produit ---
  function openProductModal(productId) {
    const data = productsData[productId];
    if (!data || !modal) return;

    if (modalImg) modalImg.src = data.image;
    if (modalImg) modalImg.alt = data.title;
    if (modalCategory) modalCategory.textContent = data.categoryLabel;
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalPrice) modalPrice.innerHTML = `<span class="price-eur">${data.priceEur}</span> <span class="price-cfa">(${data.priceCfa})</span>`;
    if (modalBadge) {
      modalBadge.textContent = data.badge;
      modalBadge.style.display = data.badge ? 'inline-block' : 'none';
    }
    if (modalDesc) modalDesc.textContent = data.description;

    if (modalSpecs) {
      modalSpecs.innerHTML = data.specs.map(spec => `<li><span class="spec-check">✓</span> ${spec}</li>`).join('');
    }

    // Liens WhatsApp et Email pré-remplis avec le numéro et l'email officiels
    const whatsappNumber = '237695341413';
    const contactEmail = 'tfasseu@gmail.com';
    const msg = encodeURIComponent(`Bonjour Vaisseau Mère 237, je souhaite commander le tableau suivant :\n- ${data.title}\n- Prix : ${data.priceEur} / ${data.priceCfa}\nPouvez-vous m'indiquer les modalités de livraison et de paiement ?`);
    
    if (modalWhatsapp) {
      modalWhatsapp.href = `https://wa.me/${whatsappNumber}?text=${msg}`;
      modalWhatsapp.target = '_blank';
    }

    if (modalEmail) {
      const subject = encodeURIComponent(`Commande Tableau VM237 : ${data.title}`);
      modalEmail.href = `mailto:${contactEmail}?subject=${subject}&body=${msg}`;
    }

    if (modalMangaLink) {
      if (data.linkManga) {
        modalMangaLink.href = data.linkManga;
        modalMangaLink.style.display = 'inline-flex';
      } else {
        modalMangaLink.style.display = 'none';
      }
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Écouteurs pour ouvrir la modale
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.view-product-btn, .product-card-img-wrap, .order-product-btn');
    if (trigger) {
      const card = trigger.closest('.product-card');
      const productId = card?.dataset.productId;
      if (productId) {
        e.preventDefault();
        openProductModal(productId);
      }
    }
  });

  modalOverlay?.addEventListener('click', closeProductModal);
  modalClose?.addEventListener('click', closeProductModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
  });

  // URL Hash check : si l'utilisateur arrive avec #manga, filtrer directement
  const hash = window.location.hash.replace('#', '');
  if (['manga', 'musique', 'merch', 'editions'].includes(hash)) {
    filterCategory(hash);
  } else {
    filterCategory('all');
  }
});
