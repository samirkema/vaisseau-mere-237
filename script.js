// ===== VAISSEAU MÈRE 237 — Script =====

// Menu burger mobile
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

burger?.addEventListener('click', () => {
  burger.classList.toggle('active');
  nav.classList.toggle('open');
  document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});

// Fermer le menu quand on clique sur un lien
nav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('active');
    nav.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// Header scroll effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    header.style.background = 'rgba(8,8,8,0.97)';
  } else {
    header.style.background = 'rgba(8,8,8,0.85)';
  }
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav a');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${entry.target.id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(section => observer.observe(section));

// Contact form
const form = document.getElementById('contact-form');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Message envoyé ✓';
  btn.style.background = '#2a9d1a';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Envoyer →';
    btn.style.background = '';
    btn.disabled = false;
    form.reset();
  }, 3000);
});

// Modale biographie artiste
const artistes = {
  nu9ve: {
    photo: '<img src="images/nu9ve.png" alt="NU9VE">',
    nom: 'NU9VE',
    genre: 'Rap · Street-pop · Afro-urbain · Cameroun',
    communaute: 'DYDYNASTIE',
    bio: [
      'Rappeur, chanteur et compositeur, Dydy09 ou encore Nu9ve est un artiste déterminé qui impose sa vision avec une autorité naturelle et un charisme indéniable. Évoluant avec agilité entre univers sonores denses, il s'est rapidement forgé une réputation de kickeur hors pair.',
      'Il s'est fait remarquer avec son premier succès intitulé <strong>CARRÉ</strong>, ensuite il a enchaîné avec la série <strong>DYDY DRILL</strong>. Sur son projet <strong>CODE PIN</strong>, Dydy09 s'est rallié au beatmaker ICE, ensemble ils ont débloqué une synergie parfaite. L'artiste a ensuite prouvé sa palette technique en s'associant au beatmaker Cabaraiz sur l'EP <strong>REMISE EN FORME</strong>, un projet synonyme de performance brute et de discipline lyricale.',
      'Au-delà des studios, Dydy ne se contente pas d'avoir des auditeurs : il guide un peuple. À la tête de la <strong>DYDYNASTIE</strong>, son mouvement et sa fanbase, l'artiste a dépassé le simple statut de musicien pour devenir un véritable repère. Porté par une communauté loyale qui le considère comme un meneur et le couronne roi de sa génération, Dydy09 avance avec l'assurance de ceux qui sont nés pour régner sur la nouvelle ère de la street-pop.'
    ]
  },
  mrkof: {
    photo: '<div class="artiste-cover-placeholder" style="width:100%;height:100%;font-size:48px;">MK</div>',
    nom: 'Mr Kof In D Houz',
    genre: 'R&B · Afro-urbain · Street-pop · Cameroun',
    communaute: 'MAGIC BLOC',
    bio: [
      'Ancré dans la vibrante scène urbaine camerounaise, Mr Kof — souvent surnommé <strong>LA SORCELLERIE</strong> — est un artiste qui bouscule les codes de la musique afro-urbaine contemporaine. À la croisée d'un R&B sensuel et d'influences Hip-Hop, il s'impose par une signature vocale unique et une audace narrative rare dans le paysage musical de sa région.',
      'Ce qui distingue véritablement Mr Kof, c'est sa plume. L'artiste refuse les non-dits et s'illustre par des textes hardcores, crus et provocateurs, abordant sans filtre les relations, le désir et les réalités de sa génération. Cette identité brute et charnelle prend toute son ampleur dans son EP <strong>THE WITCHCRAFT'S HOUZ CHAP 1 : MAGIC ROOM</strong>, conçu en symbiose avec le beatmaker Cabaraiz.',
      'Au-delà de la musique, Mr Kof a fédéré un véritable mouvement culturel en lançant le <strong>MAGIC BLOC</strong>. Bien plus qu'une simple fanbase, c'est un rassemblement puissant, une bannière sous laquelle se réunissent les passionnés qui se reconnaissent dans son authenticité et son rejet des faux-semblants.'
    ]
  },
  izis: {
    photo: '<div class="artiste-cover-placeholder" style="width:100%;height:100%;font-size:48px;">IZ</div>',
    nom: 'IZIS 27',
    genre: 'Afro-R&B · Trap · Afro-urbain · Cameroun',
    communaute: null,
    bio: [
      'Actif dans la scène urbaine underground camerounaise, Izis — récemment stylisé en <strong>Izis 27</strong> — s'impose comme l'une des voix les plus singulières et prometteuses de sa génération. Naviguant avec une agilité déconcertante entre les mélodies envoûtantes de l'afro-R&B, l'énergie brute de la Trap et les rythmiques afro-urbain, il façonne un univers musical hybride, à la fois intimiste et percutant.',
      'C'est à travers son projet conceptuel <strong>G-LUV</strong>, massivement partagé sur Audiomack sous l'étendard d'OFFISKY, qu'il pose les fondations de son identité : un alliage de sonorités "lovers" et de récit du quotidien qui a immédiatement séduit une communauté de passionnés.',
      'Izis s'illustre également par sa capacité à sublimer les univers de ses pairs lors de collaborations marquantes — notamment aux côtés de Dydy09 sur <strong>LOVE & STREET</strong> et <strong>COMPATIBLE</strong>, issu du projet Code Pin. Toujours en quête d'innovation et de renouvellement esthétique, sa détermination témoigne de sa volonté à repousser les frontières musicales.'
    ]
  }
};

const bioModal = document.getElementById('bio-modal');
const bioOverlay = bioModal?.querySelector('.bio-modal-overlay');
const bioClose = bioModal?.querySelector('.bio-modal-close');

function openBioModal(id) {
  const a = artistes[id];
  if (!a) return;
  document.getElementById('modal-photo').innerHTML = a.photo;
  document.getElementById('modal-nom').textContent = a.nom;
  document.getElementById('modal-genre').textContent = a.genre;
  const comm = document.getElementById('modal-communaute');
  comm.textContent = a.communaute || '';
  comm.style.display = a.communaute ? '' : 'none';
  document.getElementById('modal-bio').innerHTML = a.bio.map(p => `<p class="bio-modal-bio">${p}</p>`).join('');
  bioModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeBioModal() {
  bioModal.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.artiste-bio-trigger').forEach(el => {
  el.addEventListener('click', () => openBioModal(el.dataset.artiste));
});
bioOverlay?.addEventListener('click', closeBioModal);
bioClose?.addEventListener('click', closeBioModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBioModal();
});

// Reveal animations on scroll
const reveals = document.querySelectorAll('.artiste-card, .projet-card, .service-card, .boutique-item');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

reveals.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
});
