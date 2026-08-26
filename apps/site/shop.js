// ===== VAISSEAU MÈRE 237 — Shop Script =====

document.addEventListener('DOMContentLoaded', () => {
  // --- Données des produits pour la modale et la commande ---
  const productsData = {
    'manga-deku': {
      id: 'manga-deku',
      title: 'Tableau Remix — Deku & Les Enfants du 237',
      category: 'manga',
      categoryLabel: 'Manga · Tableau Remix',
      priceEur: '15 €',
      priceCfa: '10 000 FCFA',
      image: 'images/shop/manga-deku-237.jpg',
      badge: 'Bestseller',
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
      badge: 'Édition Spéciale',
      description: "Quand le 7e Hokage savoure la gastronomie camerounaise : une illustration inédite mêlant le héros de Konoha et un plat traditionnel de plantains frits (alloco/dodo).",
      specs: [
        'Impression d’art haute définition sur papier texturé 300g',
        'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
        'Couleurs vives résistantes aux UV',
        'Emballage tube rigide renforcé pour expédition protégée'
      ],
      linkManga: 'https://vaisseaumanga237.vercel.app'
    },
    'musique-codepin': {
      id: 'musique-codepin',
      title: 'NU9VE — Code Pin Vol. 1 & 2',
      category: 'musique',
      categoryLabel: 'Musique · Album Physique',
      priceEur: '10 €',
      priceCfa: '6 500 FCFA',
      image: 'images/code pin volume 1.png',
      badge: 'CD Collector',
      description: "L'intégrale du double projet légendaire de NU9VE & ICE en version physique boîtier collector avec livret de 16 pages incluant paroles et photos de studio inédites.",
      specs: [
        'CD Audio Haute Définition (Masterisé)',
        'Digipack 3 volets avec vernis sélectif',
        'Livret 16 pages exclusif',
        'Autocollant DYDYNASTIE offert'
      ]
    },
    'musique-magicroom': {
      id: 'musique-magicroom',
      title: 'Mr Kof — Magic Room (EP)',
      category: 'musique',
      categoryLabel: 'Musique · EP Physique',
      priceEur: '10 €',
      priceCfa: '6 500 FCFA',
      image: 'images/magic room.png',
      badge: 'Sorcellerie',
      description: "Le projet iconique de Mr Kof in D Houz avec Cabaraiz. Un R&B afro-urbain sensuel et brut pressé sur CD édition limitée pour les membres du Magic Bloc.",
      specs: [
        'CD Audio pressage limité',
        'Pochette designée par Le Martien 237',
        'Poster A4 exclusif inclus',
        'Accès bonus aux coulisses'
      ]
    },
    'merch-tshirt': {
      id: 'merch-tshirt',
      title: 'T-Shirt Officiel Vaisseau Mère 237',
      category: 'merch',
      categoryLabel: 'Merch · Textile',
      priceEur: '20 €',
      priceCfa: '13 000 FCFA',
      image: 'images/logo-vm237.jpeg',
      badge: 'Coton 240g',
      description: "Le t-shirt signature du collectif. Coupe streetwear moderne oversize, broderie haute précision du logo VM237 sur le cœur et sérigraphie dos grand format.",
      specs: [
        '100% Coton biologique peigné lourd (240 g/m²)',
        'Coupe oversize moderne unisexe (S, M, L, XL, XXL)',
        'Broderie logo vert & violet 237',
        'Conçu et confectionné avec soin'
      ]
    },
    'editions-artbook': {
      id: 'editions-artbook',
      title: 'Artbook Collectif VM237 — Vol. 1',
      category: 'editions',
      categoryLabel: 'Éditions limitées · Tirage d’art',
      priceEur: '30 €',
      priceCfa: '20 000 FCFA',
      image: 'images/titre-vaisseau-mere.jpeg',
      badge: 'Numéroté 1/100',
      description: "Un condensé visuel de 120 pages réunissant la direction artistique du Martien 237, les shootings photos exclusifs, les coulisses de tournage et les concepts manga du collectif.",
      specs: [
        'Format relié rigide 24 × 30 cm, 120 pages',
        'Papier d’art glacé 170g haute brillance',
        'Tirage strictement limité à 100 exemplaires numérotés à la main',
        'Dédicacé par les artistes du collectif'
      ]
    }
  };

  // --- Sélecteurs du DOM ---
  const filterBtns = document.querySelectorAll('.shop-filter-btn');
  const productCards = document.querySelectorAll('.product-card');
  const carousel = document.getElementById('shop-carousel');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
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
  let currentCategory = 'all';

  function filterCategory(cat) {
    currentCategory = cat;
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
      'all': 'Tous les articles',
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
        card.classList.remove('hidden');
        card.style.display = 'flex';
        visibleCount++;
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }, 30);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.classList.add('hidden');
          card.style.display = 'none';
        }, 150);
      }
    });

    if (countBadge) {
      countBadge.textContent = `${visibleCount} article${visibleCount > 1 ? 's' : ''}`;
    }

    // Réinitialiser le défilement du carrousel au début
    if (carousel) {
      carousel.scrollTo({ left: 0, behavior: 'smooth' });
    }
    updateCarouselButtons();
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterCategory(btn.dataset.category);
    });
  });

  // --- Gestion du Carrousel (Flèches, Défilement, Drag à la souris) ---
  function updateCarouselButtons() {
    if (!carousel) return;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    if (prevBtn) {
      prevBtn.disabled = carousel.scrollLeft <= 5;
    }
    if (nextBtn) {
      nextBtn.disabled = carousel.scrollLeft >= maxScroll - 5;
    }
  }

  if (prevBtn && nextBtn && carousel) {
    prevBtn.addEventListener('click', () => {
      const cardWidth = carousel.querySelector('.product-card:not(.hidden)')?.offsetWidth || 320;
      carousel.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      const cardWidth = carousel.querySelector('.product-card:not(.hidden)')?.offsetWidth || 320;
      carousel.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
    });

    carousel.addEventListener('scroll', () => {
      updateCarouselButtons();
    });

    // Support Drag à la souris
    let isDown = false;
    let startX;
    let scrollLeft;

    carousel.addEventListener('mousedown', (e) => {
      // Ne pas bloquer si on clique sur un bouton ou lien
      if (e.target.closest('button, a')) return;
      isDown = true;
      carousel.classList.add('is-dragging');
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
    });

    carousel.addEventListener('mouseleave', () => {
      isDown = false;
      carousel.classList.remove('is-dragging');
    });

    carousel.addEventListener('mouseup', () => {
      isDown = false;
      carousel.classList.remove('is-dragging');
    });

    carousel.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - carousel.offsetLeft;
      const walk = (x - startX) * 1.5;
      carousel.scrollLeft = scrollLeft - walk;
    });
  }

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

    // Liens WhatsApp et Email pré-remplis
    const msg = encodeURIComponent(`Bonjour Vaisseau Mère 237, je souhaite commander l'article suivant :\n- ${data.title}\n- Prix : ${data.priceEur} / ${data.priceCfa}\nPouvez-vous m'indiquer les modalités de livraison et de paiement ?`);
    
    if (modalWhatsapp) {
      modalWhatsapp.href = `https://wa.me/?text=${msg}`;
      modalWhatsapp.target = '_blank';
    }

    if (modalEmail) {
      const subject = encodeURIComponent(`Commande Shop VM237 : ${data.title}`);
      modalEmail.href = `mailto:contact@vaisseaumere237.com?subject=${subject}&body=${msg}`;
    }

    // Affichage bouton manga si catégorie manga
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
