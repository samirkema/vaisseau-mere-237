// ===== VAISSEAU MÈRE 237 — Données produits =====
// Partagé entre shop.html (grille filtrable) et produit.html (fiche détaillée).
//
// Pour chaque article :
//   images       : tableau de chemins. La fiche produit affiche un carrousel
//                  (flèches ← → uniquement s'il y a plus d'une image).
//   description  : texte libre. Laisser "" tant que le texte n'est pas fourni ;
//                  le bloc reste masqué sur la fiche.
//   specs        : liste de caractéristiques. Laisser [] pour masquer le bloc.

window.VM_PRODUCTS = {
  'manga-deku': {
    id: 'manga-deku',
    title: 'Tableau Remix — Deku & Les Enfants du 237',
    category: 'manga',
    categoryLabel: 'Manga · Tableau Remix',
    priceEur: '15 €',
    priceCfa: '10 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/manga-deku-237.jpg',
    ],
    description: '',
    specs: [
      'Impression Premium sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
      'Finitions anti-reflet haute fidélité des couleurs',
      'Numéroté & certifié par le collectif Vaisseau Mère 237',
    ],
  },
  'manga-naruto': {
    id: 'manga-naruto',
    title: 'Tableau Remix — Naruto Hokage & Alloco 237',
    category: 'manga',
    categoryLabel: 'Manga · Tableau Remix',
    priceEur: '15 €',
    priceCfa: '10 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/manga-naruto-alloco-237.jpg',
    ],
    description: '',
    specs: [
      'Impression d’art haute définition sur papier texturé 300g',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
      'Couleurs vives résistantes aux UV',
      'Emballage tube rigide renforcé pour expédition protégée',
    ],
  },
};

// Contacts commande (utilisés par produit.js pour pré-remplir WhatsApp / Email).
window.VM_CONTACT = {
  whatsapp: '237695341413',
  email: 'tfasseu@gmail.com',
};
