export const metadata = { title: 'Conditions Générales de Vente — Otaku Shop' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f97316', letterSpacing: '1px', marginBottom: '12px' }}>
        {title}
      </h2>
      <div style={{ color: '#999', fontSize: '0.88rem', lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  );
}

function Todo({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      marginTop: '10px', padding: '10px 14px', borderRadius: '8px',
      background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)',
      color: '#f97316', fontSize: '0.8rem', fontWeight: 600,
    }}>
      À COMPLÉTER : {children}
    </p>
  );
}

export default function CgvPage() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Segoe UI', sans-serif", padding: '60px 20px 80px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, letterSpacing: '2px', marginBottom: '8px' }}>
          CONDITIONS GÉNÉRALES DE VENTE
        </h1>
        <div style={{ width: '40px', height: '1px', background: '#f97316', margin: '0 0 40px', opacity: 0.6 }} />

        <Section title="1. Identification du vendeur">
          <p>
            Samir Tamboura, entrepreneur individuel — SIREN 843 840 380<br />
            14 rue de la Blanchisserie, 31500 Toulouse, France<br />
            Contact : <a href="mailto:kilimangarocontact@gmail.com" style={{ color: '#f97316' }}>kilimangarocontact@gmail.com</a>
          </p>
        </Section>

        <Section title="2. Objet">
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent les ventes réalisées sur le site
            Otaku Shop (otakushop.fr), à savoir : (a) l&apos;abonnement d&apos;accès à du contenu numérique
            (mangas, webtoons, BD), et (b) la vente d&apos;œuvres physiques (tableaux, photomontages) présentées
            dans la galerie. Toute commande passée sur le site implique l&apos;acceptation sans réserve des
            présentes CGV.
          </p>
        </Section>

        <Section title="3. Produits proposés">
          <p>
            <strong style={{ color: '#ccc' }}>Abonnement contenu numérique</strong> — donne accès, pour une
            durée de 1 an à compter de l&apos;activation, à l&apos;intégralité du catalogue manga/webtoon/BD ainsi
            qu&apos;aux fonctionnalités réservées aux abonnés (zone Immersion, jeux, My Remix). L&apos;activation
            se fait par code fourni après paiement, ou par vérification de possession d&apos;un NFT de la
            collection Otaku Shop (accès permanent, revalidé périodiquement).
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong style={{ color: '#ccc' }}>Tableaux et photomontages</strong> — œuvres physiques vendues à
            l&apos;unité, dans les formats et aux prix affichés sur chaque fiche produit de la galerie. Les
            commandes sur mesure (réservées aux détenteurs de NFT) sont réalisées selon les spécifications
            propres à chaque client après devis et accord préalable sur le prix.
          </p>
        </Section>

        <Section title="4. Prix">
          <p>
            Les prix sont indiqués en euros, toutes taxes comprises le cas échéant. Otaku Shop se réserve le
            droit de modifier ses prix à tout moment ; les commandes déjà validées ne sont pas affectées par
            un changement de tarif ultérieur.
          </p>
        </Section>

        <Section title="5. Commande et paiement">
          <p>
            Le paiement s&apos;effectue en ligne, par carte bancaire (Stripe) ou en cryptomonnaie (NowPayments).
            Otaku Shop ne stocke aucune donnée bancaire : les paiements sont traités exclusivement par ces
            prestataires. La commande est confirmée après validation du paiement par le prestataire concerné.
          </p>
        </Section>

        <Section title="6. Droit de rétractation">
          <p>
            <strong style={{ color: '#ccc' }}>Contenu numérique (abonnement)</strong> — conformément à
            l&apos;article L.221-28 13° du Code de la consommation, le droit de rétractation ne s&apos;applique
            pas dès lors que l&apos;exécution a commencé avec l&apos;accord exprès du consommateur, qui reconnaît
            renoncer à son droit de rétractation dès l&apos;activation de son accès.
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong style={{ color: '#ccc' }}>Tableaux (biens physiques standards)</strong> — le client dispose
            d&apos;un délai de 14 jours à compter de la réception du bien pour exercer son droit de rétractation,
            sans avoir à justifier de motif, en écrivant à{' '}
            <a href="mailto:kilimangarocontact@gmail.com" style={{ color: '#f97316' }}>kilimangarocontact@gmail.com</a>.
            Les frais de retour sont à la charge du client, le bien devant être retourné en bon état.
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong style={{ color: '#ccc' }}>Commandes sur mesure</strong> — conformément à l&apos;article
            L.221-28 3° du Code de la consommation, les œuvres réalisées selon les spécifications du client
            ou nettement personnalisées ne bénéficient pas du droit de rétractation.
          </p>
        </Section>

        <Section title="7. Livraison">
          <p>
            Chaque tableau étant réalisé à la commande, le délai d&apos;expédition est d&apos;environ 1 mois à
            compter de la confirmation du paiement. Les frais de livraison varient selon le pays de
            destination et sont communiqués au client par email avant expédition, une fois l&apos;adresse de
            livraison connue.
          </p>
          <p style={{ marginTop: '10px' }}>
            Otaku Shop contacte le client par email dès la commande confirmée pour recueillir l&apos;adresse de
            livraison et l&apos;informer du transporteur retenu et du montant définitif des frais de port.
          </p>
        </Section>

        <Section title="8. Garantie légale">
          <p>
            Les tableaux vendus bénéficient de la garantie légale de conformité (articles L.217-3 et suivants
            du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 et suivants
            du Code civil).
          </p>
        </Section>

        <Section title="9. Médiation à la consommation">
          <p>
            Conformément à l&apos;article L.616-1 du Code de la consommation, tout consommateur a le droit de
            recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable d&apos;un
            litige.
          </p>
          <Todo>
            s&apos;inscrire auprès d&apos;un médiateur de la consommation agréé (ex. CM2C, Médiation e-commerce
            de la FEVAD) et indiquer ici son nom et son site web — obligatoire pour toute vente en ligne
            à des particuliers.
          </Todo>
        </Section>

        <Section title="10. Droit applicable et litiges">
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige et à défaut de résolution
            amiable, les tribunaux français compétents seront seuls saisis.
          </p>
        </Section>
      </div>
    </div>
  );
}
