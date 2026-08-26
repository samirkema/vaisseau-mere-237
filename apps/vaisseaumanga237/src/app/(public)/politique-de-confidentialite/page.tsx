export const metadata = { title: 'Politique de confidentialité — Vaisseau Manga 237' };

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

const SUBPROCESSORS = [
  { name: 'Supabase Inc.', role: 'Hébergement base de données, authentification, stockage des fichiers (images, mangas, avatars).' },
  { name: 'Vercel Inc.', role: 'Hébergement de l’application web.' },
  { name: 'Stripe', role: 'Traitement des paiements par carte bancaire. Vaisseau Manga 237 ne reçoit ni ne stocke aucune donnée bancaire.' },
  { name: 'NowPayments', role: 'Traitement des paiements en cryptomonnaie.' },
  { name: 'Resend', role: 'Envoi des emails transactionnels (vérification de compte, réinitialisation de mot de passe, reçus de commande).' },
  { name: 'Alchemy', role: 'Interrogation de la blockchain pour vérifier la possession d’un NFT lors de la connexion d’un wallet.' },
];

export default function PolitiqueConfidentialitePage() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Segoe UI', sans-serif", padding: '60px 20px 80px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, letterSpacing: '2px', marginBottom: '8px' }}>
          POLITIQUE DE CONFIDENTIALITÉ
        </h1>
        <div style={{ width: '40px', height: '1px', background: '#f97316', margin: '0 0 40px', opacity: 0.6 }} />

        <Section title="1. Responsable de traitement">
          <p>
            Samir Tamboura, entrepreneur individuel — SIREN 843 840 380<br />
            14 rue de la Blanchisserie, 31500 Toulouse, France<br />
            Contact : <a href="mailto:kilimangarocontact@gmail.com" style={{ color: '#f97316' }}>kilimangarocontact@gmail.com</a>
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>
            Selon votre usage du site, nous collectons : votre email et mot de passe (authentification, géré
            par Supabase Auth), votre pseudo et avatar, votre statut d&apos;abonnement, l&apos;adresse de wallet
            crypto que vous connectez volontairement pour la vérification NFT, votre progression de lecture
            manga, les créations que vous publiez (My Remix), et pour les achats de tableaux : votre email et
            nom transmis lors du paiement, l&apos;adresse de livraison échangée par email.
          </p>
        </Section>

        <Section title="3. Finalités">
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Création et gestion de votre compte</li>
            <li>Gestion de votre abonnement et de vos accès</li>
            <li>Traitement des commandes de tableaux et suivi de livraison</li>
            <li>Envoi d&apos;emails transactionnels (vérification, réinitialisation, reçus)</li>
            <li>Vérification de la possession d&apos;un NFT associé à votre wallet</li>
            <li>Statistiques internes d&apos;usage (œuvres populaires, fréquentation) — à des fins de gestion du catalogue, sans profilage publicitaire</li>
          </ul>
        </Section>

        <Section title="4. Base légale">
          <p>
            Le traitement de vos données repose sur l&apos;exécution du contrat qui nous lie (création de compte,
            abonnement, vente), sur le respect d&apos;obligations légales (comptabilité, facturation), et le cas
            échéant sur votre consentement (connexion d&apos;un wallet crypto).
          </p>
        </Section>

        <Section title="5. Destinataires de vos données">
          <p>Vos données sont partagées uniquement avec les prestataires techniques nécessaires au fonctionnement du service :</p>
          <ul style={{ paddingLeft: '20px', margin: '10px 0 0' }}>
            {SUBPROCESSORS.map((s) => (
              <li key={s.name} style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#ccc' }}>{s.name}</strong> — {s.role}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: '10px' }}>
            Vaisseau Manga 237 ne vend ni ne loue vos données personnelles à des tiers à des fins commerciales.
          </p>
        </Section>

        <Section title="6. Durée de conservation">
          <p>
            Les données de compte sont conservées tant que votre compte est actif, puis supprimées ou
            anonymisées après 3 ans d&apos;inactivité. Les données liées aux paiements et factures sont
            conservées 10 ans conformément aux obligations comptables légales (article L.123-22 du Code de
            commerce).
          </p>
        </Section>

        <Section title="7. Cookies et stockage local">
          <p>
            Le site utilise uniquement des cookies strictement nécessaires à son fonctionnement : le cookie
            de session déposé par Supabase Auth (httpOnly, non accessible en JavaScript) qui permet de vous
            garder connecté. Ces cookies ne nécessitent pas de consentement préalable au sens de la
            réglementation CNIL, car ils sont indispensables au service.
          </p>
          <p style={{ marginTop: '10px' }}>
            Votre préférence d&apos;affichage (thème clair/sombre) est stockée localement dans votre navigateur
            (localStorage), pas sur nos serveurs.
          </p>
          <p style={{ marginTop: '10px' }}>
            Le site n&apos;utilise aucun cookie publicitaire ni traceur d&apos;analyse tiers à ce jour. Si cela
            venait à changer, un bandeau de consentement vous serait présenté avant tout dépôt de cookie non
            essentiel.
          </p>
        </Section>

        <Section title="8. Vos droits">
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique
            et Libertés, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation,
            d&apos;opposition et de portabilité sur vos données personnelles. Vous pouvez exercer ces droits en
            écrivant à{' '}
            <a href="mailto:kilimangarocontact@gmail.com" style={{ color: '#f97316' }}>kilimangarocontact@gmail.com</a>.
          </p>
          <p style={{ marginTop: '10px' }}>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation
            auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>www.cnil.fr</a>).
          </p>
        </Section>

        <Section title="9. Sécurité">
          <p>
            L&apos;accès aux contenus réservés et aux données de votre compte est protégé à plusieurs niveaux
            (middleware serveur, politiques d&apos;accès en base de données, URLs signées à durée limitée pour
            les contenus manga). Aucune donnée bancaire ne transite ni n&apos;est stockée par nos serveurs.
          </p>
        </Section>
      </div>
    </div>
  );
}
