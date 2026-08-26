export const metadata = { title: 'Aide & Tutoriel — Vaisseau Manga 237' };

function RichText({ text }: { text: string }) {
  const parts = text.split(/(<strong>.*?<\/strong>)/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = /^<strong>(.*?)<\/strong>$/.exec(part);
        return match
          ? <strong key={i} style={{ color: '#ccc' }}>{match[1]}</strong>
          : <span key={i}>{part}</span>;
      })}
    </>
  );
}

const GUIDE_CARDS = [
  {
    icon: '👤',
    title: 'Créer un compte',
    body: 'Rendez-vous sur la page <strong>Mon Compte</strong> depuis l\'accueil. Choisissez un pseudo, entrez votre adresse email et créez un mot de passe. Votre compte est immédiatement actif. Si vous oubliez votre mot de passe, un lien de réinitialisation vous sera envoyé par email.',
  },
  {
    icon: '🔗',
    title: 'Accès NFT — Débloquer le contenu',
    body: 'L\'accès au manga, à la zone Immersion et au Club VIP est exclusivement réservé aux détenteurs du NFT Vaisseau Manga 237. Connectez votre wallet MetaMask depuis l\'onglet <strong>NFT Holder</strong> de votre compte. La vérification est instantanée et l\'accès est permanent.',
  },
  {
    icon: '🖼️',
    title: 'La Galerie de Tableaux',
    body: 'Accessible à tous sans NFT. Parcourez la collection complète de tableaux et photomontages disponibles à la vente. Chaque pièce est disponible en deux formats (A4 à 25€ et 40×50 cm à 50€). Les détenteurs de NFT peuvent réclamer certaines pièces gratuitement.',
  },
  {
    icon: '📖',
    title: 'Lire le Manga',
    body: 'La section manga est réservée aux détenteurs de NFT Vaisseau Manga 237. Une fois votre wallet vérifié, vous accédez à l\'intégralité du contenu : mangas, webtoons et livres numériques en français, anglais et japonais. L\'accès est permanent tant que vous détenez le NFT.',
  },
  {
    icon: '🎮',
    title: 'La Zone Immersion',
    body: 'Réservée aux détenteurs de NFT, la zone Immersion regroupe des expériences interactives exclusives. Le premier jeu disponible est <strong>My Remix</strong> : choisissez une photo de la galerie, dessinez par-dessus pour créer un photomontage unique, soumettez votre création et votez pour les meilleures œuvres de la communauté.',
  },
  {
    icon: '👑',
    title: 'Club VIP',
    body: 'L\'espace VIP est exclusivement réservé aux détenteurs de NFT. Il donne accès aux commandes sur mesure (tableau, photomontage, illustration personnalisée) et aux événements exclusifs. Vérifiez votre NFT depuis <strong>Mon Compte</strong> pour y accéder.',
  },
  {
    icon: '🎨',
    title: 'Commandes Personnalisées',
    body: 'Ce service est exclusivement réservé aux détenteurs de NFT Vaisseau Manga 237. Il vous permet de commander une œuvre entièrement sur mesure : tableau, photomontage ou illustration personnalisée selon votre vision. Connectez votre wallet pour vérifier votre NFT et accéder à ce service.',
  },
];

export default function AidePage() {
  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '60px 20px', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* HEADER */}
      <div style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto 50px' }}>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          color: '#f97316',
          textShadow: '0 0 15px #f97316',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          margin: '0 0 10px',
        }}>
          Toutes les informations sur VAISSEAU MANGA 237
        </h1>
        <p style={{ color: '#666', marginBottom: '0' }}>
          Découvrez notre concept et apprenez à utiliser la plateforme.
        </p>
      </div>

      {/* MISE À JOUR BANNER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        maxWidth: '1000px',
        margin: '0 auto 40px',
        padding: '14px 24px',
        background: 'rgba(251,146,60,0.08)',
        border: '1px solid rgba(251,146,60,0.3)',
        borderRadius: '12px',
      }}>
        <span style={{
          background: 'rgba(251,146,60,0.2)',
          color: '#fb923c',
          fontWeight: 800,
          fontSize: '0.85rem',
          letterSpacing: '1px',
          padding: '4px 12px',
          borderRadius: '20px',
          border: '1px solid rgba(251,146,60,0.4)',
        }}><span className="emoji">🆕</span> MISE À JOUR</span>
        <span style={{ color: '#666', fontSize: '0.85rem' }}>Juin 2026</span>
      </div>

      {/* GUIDE */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '1.4rem',
            color: '#f97316',
            letterSpacing: '2px',
            marginBottom: '14px',
            textShadow: '0 0 10px rgba(249,115,22,0.3)',
          }}>
            <span className="emoji">🗺️</span> Comment fonctionne Vaisseau Manga 237 ?
          </h2>
          <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '680px', margin: '0 auto' }}>
            Vaisseau Manga 237 est un studio manga et art dédié aux passionnés. La galerie est ouverte à tous. Le contenu exclusif — manga, zone Immersion, Club VIP — est réservé aux détenteurs du NFT Vaisseau Manga 237.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}>
          {GUIDE_CARDS.map((card) => (
            <div key={card.title} style={{
              background: '#0d0d0d',
              border: '1px solid #1e1e1e',
              borderRadius: '14px',
              padding: '24px 20px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              className="guide-card"
            >
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}><span className="emoji">{card.icon}</span></div>
              <h3 style={{ color: '#f97316', fontSize: '1rem', fontWeight: 700, marginBottom: '10px', letterSpacing: '0.5px' }}>
                {card.title}
              </h3>
              <p style={{ color: '#666', fontSize: '0.84rem', lineHeight: 1.65 }}>
                <RichText text={card.body} />
              </p>
            </div>
          ))}
        </div>

      </div>

      {/* FOOTER AIDE */}
      <div style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-block',
          padding: '25px 40px',
          background: 'rgba(17,17,17,0.9)',
          border: '1px solid #1e1e1e',
          borderRadius: '15px',
        }}>
          <h3 style={{ color: '#f97316', marginBottom: '15px' }}><span className="emoji">🔗</span> Liens utiles</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '8px' }}>
            Collection NFT :{' '}
            <a href="https://opensea.io/collection/swap-swap-54096494" target="_blank" rel="noopener noreferrer"
              style={{ color: '#f97316', textDecoration: 'none', fontWeight: 'bold' }}>
              SWAP-SWAP sur OpenSea
            </a>
          </p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Contact :{' '}
            <a href="mailto:kilimangarocontact@gmail.com"
              style={{ color: '#f97316', textDecoration: 'none', fontWeight: 'bold' }}>
              kilimangarocontact@gmail.com
            </a>
          </p>
        </div>
      </div>

      <style>{`
        .guide-card:hover {
          border-color: #f97316 !important;
          box-shadow: 0 4px 20px rgba(249,115,22,0.08);
        }
      `}</style>
    </div>
  );
}
