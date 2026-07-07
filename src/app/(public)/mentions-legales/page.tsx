export const metadata = { title: 'Mentions légales — Otaku Shop' };

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

export default function MentionsLegalesPage() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Segoe UI', sans-serif", padding: '60px 20px 80px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, letterSpacing: '2px', marginBottom: '8px' }}>
          MENTIONS LÉGALES
        </h1>
        <div style={{ width: '40px', height: '1px', background: '#f97316', margin: '0 0 40px', opacity: 0.6 }} />

        <Section title="Éditeur du site">
          <p>
            Le site Otaku Shop (otakushop.fr) est édité par :<br />
            Samir Tamboura, entrepreneur individuel<br />
            SIREN : 843 840 380<br />
            Adresse : 14 rue de la Blanchisserie, 31500 Toulouse, France<br />
            Contact : <a href="mailto:kilimangarocontact@gmail.com" style={{ color: '#f97316' }}>kilimangarocontact@gmail.com</a>
          </p>
          <p style={{ marginTop: '10px' }}>
            TVA non applicable, article 293 B du Code général des impôts (régime de la micro-entreprise —
            à confirmer selon le chiffre d&apos;affaires réalisé).
          </p>
        </Section>

        <Section title="Directeur de la publication">
          <p>Samir Tamboura</p>
        </Section>

        <Section title="Hébergement">
          <p>
            Le site est hébergé par :<br />
            Vercel Inc.<br />
            440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis<br />
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>vercel.com</a>
          </p>
          <p style={{ marginTop: '10px' }}>
            Les données (comptes, contenus, commandes) sont stockées par le prestataire Supabase Inc.
            Plus de détails dans notre <a href="/politique-de-confidentialite" style={{ color: '#f97316' }}>politique de confidentialité</a>.
          </p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            L&apos;ensemble des contenus présents sur le site Otaku Shop (textes, images, illustrations, mangas,
            webtoons, tableaux, logos, éléments graphiques) est protégé par le droit d&apos;auteur et reste la
            propriété exclusive de leurs auteurs respectifs ou de Otaku Shop, sauf mention contraire.
            Toute reproduction, représentation, modification ou diffusion, totale ou partielle, sans
            autorisation écrite préalable, est interdite et constitue une contrefaçon sanctionnée par les
            articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </p>
        </Section>

        <Section title="Responsabilité">
          <p>
            Otaku Shop met tout en œuvre pour assurer l&apos;exactitude des informations diffusées sur le site,
            mais ne saurait être tenu responsable des erreurs, omissions ou de l&apos;indisponibilité temporaire
            des contenus. L&apos;utilisateur est seul responsable de l&apos;usage qu&apos;il fait du site.
          </p>
        </Section>

        <Section title="Liens externes">
          <p>
            Le site peut contenir des liens vers des sites tiers (OpenSea, MetaMask, réseaux sociaux…).
            Otaku Shop n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à
            leur contenu.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Pour toute question relative au site ou à ces mentions légales :{' '}
            <a href="mailto:kilimangarocontact@gmail.com" style={{ color: '#f97316' }}>
              kilimangarocontact@gmail.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}
