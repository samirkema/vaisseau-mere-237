// ===== VAISSEAU MÈRE 237 — Données produits =====
// Partagé entre shop.html (grille filtrable) et produit.html (fiche détaillée).
//
// Pour chaque article :
//   thumb        : image de la carte dans la grille boutique (vignette recadrée
//                  uniquement — jamais utilisée ailleurs).
//   images       : tableau de chemins vers les photos complètes. La fiche
//                  produit (clic sur la carte) affiche un carrousel de ces
//                  images (flèches ← → uniquement s'il y en a plus d'une).
//   description  : texte libre. Laisser "" tant que le texte n'est pas fourni ;
//                  le bloc reste masqué sur la fiche.
//   specs        : liste de caractéristiques. Laisser [] pour masquer le bloc.

window.VM_PRODUCTS = {
  'manga-miroir-eau': {
    id: 'manga-miroir-eau',
    thumb: 'images/shop/manga-miroir-eau-vignette.jpg',
    title: 'Tableau Remix — Miroir d’Eau & Ciel Manga',
    category: 'manga',
    categoryLabel: 'Manga · Tableau Remix',
    priceEur: '15 €',
    priceCfa: '10 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/manga-miroir-eau-237.jpg',
    ],
    description: '',
    specs: [
      'Impression d’art haute définition sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
      'Finitions anti-reflet haute fidélité des couleurs',
      'Numéroté & certifié par le collectif Vaisseau Mère 237',
    ],
  },
  'photo-rue-crepuscule': {
    id: 'photo-rue-crepuscule',
    thumb: 'images/shop/rue-crepuscule-vignette.jpg',
    title: 'New-Bell au Crépuscule',
    category: 'photos',
    categoryLabel: 'Photographie',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/rue-crepuscule-237.jpg',
    ],
    description: '',
    specs: [
      'Tirage photo original, collectif Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
  'photo-rue-coucher-soleil': {
    id: 'photo-rue-coucher-soleil',
    thumb: 'images/shop/rue-coucher-soleil-vignette.jpg',
    title: 'Rue au Coucher de Soleil',
    category: 'photos',
    categoryLabel: 'Photographie',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/rue-coucher-soleil-237.jpg',
    ],
    description: '',
    specs: [
      'Tirage photo original, collectif Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
  'photo-facade-bicec': {
    id: 'photo-facade-bicec',
    thumb: 'images/shop/facade-bicec-vignette.jpg',
    title: 'Façade BICEC',
    category: 'photos',
    categoryLabel: 'Photographie',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/facade-bicec-237.jpg',
    ],
    description: '',
    specs: [
      'Tirage photo original, collectif Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
  'photo-carrefour-nocturne': {
    id: 'photo-carrefour-nocturne',
    thumb: 'images/shop/carrefour-nocturne-vignette.jpg',
    title: 'Carrefour Nocturne',
    category: 'photos',
    categoryLabel: 'Photographie',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/carrefour-nocturne-237.jpg',
    ],
    description: '',
    specs: [
      'Tirage photo original, collectif Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
  'photo-rue-mouvement': {
    id: 'photo-rue-mouvement',
    thumb: 'images/shop/rue-mouvement-vignette.jpg',
    title: 'Rue en Mouvement',
    category: 'photos',
    categoryLabel: 'Photographie',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/rue-mouvement-237.jpg',
    ],
    description: '',
    specs: [
      'Tirage photo original, effet anaglyphe, collectif Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
  'photo-societe-generale': {
    id: 'photo-societe-generale',
    thumb: 'images/shop/societe-generale-vignette.jpg',
    title: 'Société Générale de Nuit',
    category: 'photos',
    categoryLabel: 'Photographie',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/societe-generale-237.jpg',
    ],
    description: '',
    specs: [
      'Tirage photo original, collectif Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
  'photo-averse': {
    id: 'photo-averse',
    thumb: 'images/shop/averse-vignette.jpg',
    title: 'Averse en Ville',
    category: 'photos',
    categoryLabel: 'Photographie',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/averse-237.jpg',
    ],
    description: '',
    specs: [
      'Tirage photo original, collectif Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
  'art-etude-42': {
    id: 'art-etude-42',
    thumb: 'images/shop/art-etude-42.jpg',
    title: 'Étude n°42',
    category: 'manga',
    categoryLabel: 'Manga · Illustration',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/art-etude-42.jpg',
    ],
    description: '',
    specs: [
      'Illustration originale par Crispyart, artiste partenaire du Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
  'art-indulged': {
    id: 'art-indulged',
    thumb: 'images/shop/art-indulged.jpg',
    title: 'Indulged',
    category: 'manga',
    categoryLabel: 'Manga · Illustration',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/art-indulged.jpg',
    ],
    description: '',
    specs: [
      'Illustration originale par Crispyart, artiste partenaire du Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
  'art-leila': {
    id: 'art-leila',
    thumb: 'images/shop/art-leila.jpg',
    title: 'Leila',
    category: 'manga',
    categoryLabel: 'Manga · Illustration',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/art-leila.jpg',
    ],
    description: '',
    specs: [
      'Illustration originale par Crispyart, artiste partenaire du Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
  'art-lone-wolf': {
    id: 'art-lone-wolf',
    thumb: 'images/shop/art-lone-wolf.jpg',
    title: 'Lone Wolf',
    category: 'manga',
    categoryLabel: 'Manga · Illustration',
    priceEur: '30 €',
    priceCfa: '20 000 FCFA',
    badge: 'Disponible',
    images: [
      'images/shop/art-lone-wolf.jpg',
    ],
    description: '',
    specs: [
      'Illustration originale par Crispyart, artiste partenaire du Vaisseau Mère 237',
      'Impression fine art sur papier couché satiné 300g/m²',
      'Format standard A3 (29,7 × 42 cm) — A2 disponible sur demande',
    ],
  },
};

// Contacts commande (utilisés par produit.js pour pré-remplir WhatsApp / Email).
window.VM_CONTACT = {
  whatsapp: '237695341413',
  email: 'tfasseu@gmail.com',
};
