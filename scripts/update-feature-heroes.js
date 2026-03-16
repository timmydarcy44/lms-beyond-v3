const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app', 'app-landing', 'features');

const pages = {
  'fiches-revision': {
    label: 'Fiches de révision',
    title: 'Crée ta fiche en 1 clic',
    desc: "Nevo. analyse ton cours et génère automatiquement une fiche structurée avec les points clés, les définitions et les exemples.",
    icon: 'FileText',
  },
  'reformulation': {
    label: 'Reformulation IA',
    title: "4 façons de comprendre n'importe quel concept",
    desc: 'Exemples, métaphores, version enfant ou simple — Neo reformule selon ton besoin.',
    icon: 'Sparkles',
  },
  'traduction': {
    label: 'Traduction',
    title: 'Traduis ton cours en anglais en 1 clic',
    desc: "Neo traduit fidèlement tes cours pour t'aider à réviser et prononcer correctement.",
    icon: 'Languages',
  },
  'schemas': {
    label: 'Schémas visuels',
    title: 'Visualise ce que tu apprends',
    desc: "Transforme tes cours en schémas, mind maps ou timelines pour comprendre d'un coup d'œil.",
    icon: 'ImageIcon',
  },
  'flashcards': {
    label: 'Flashcards',
    title: 'La révision espacée pour tout retenir',
    desc: 'Neo génère des cartes intelligentes et adapte la révision à ta mémoire.',
    icon: 'BookOpen',
  },
  'quiz': {
    label: 'Quiz adaptatif',
    title: "Teste tes connaissances avant l'exam",
    desc: 'QCM, Vrai/Faux, textes à trou ou questions ouvertes pour te challenger.',
    icon: 'HelpCircle',
  },
  'audio': {
    label: 'Audio du cours',
    title: 'Écoute tes cours en marchant',
    desc: 'Transforme ton cours en audio naturel pour réviser partout.',
    icon: 'Volume2',
  },
  'notes': {
    label: 'Notes enrichies',
    title: 'Prends des notes intelligentes',
    desc: 'Écris librement, Neo restructure et transforme tes notes.',
    icon: 'PenLine',
  },
  'mode-focus': {
    label: 'Mode Focus',
    title: 'Concentre-toi sans distraction',
    desc: 'Lecture immersive, mise en page apaisante et zéro bruit visuel.',
    icon: 'Eye',
  },
  'pomodoro': {
    label: 'Pomodoro',
    title: 'La méthode Pomodoro intégrée',
    desc: '25 minutes de focus, 5 minutes de pause — directement dans Nevo.',
    icon: 'Timer',
  },
  'neuro-adapte': {
    label: 'Neuro adapté',
    title: 'Conçu pour les profils DYS et TDAH',
    desc: 'Police OpenDyslexic, espacement, couleurs douces — tout pour faciliter la lecture.',
    icon: 'Brain',
  },
};

const heroTemplate = ({ label, title, desc, icon }) => `      <section className="relative overflow-hidden min-h-[60vh] flex items-center justify-center text-center pt-16"
        style={{background: "linear-gradient(135deg, #be1354 0%, #d4434a 30%, #e8673a 60%, #F97316 100%)"}}>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ background: "radial-gradient(circle, #ffffff, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl animate-pulse"
          style={{ background: "radial-gradient(circle, #F97316, transparent)", animationDelay: "1s" }} />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-white/30">
            <${icon} className="h-8 w-8 text-white" />
          </div>
          <p className="text-white/70 text-xs font-bold tracking-[0.3em] uppercase mb-4">
            ${label}
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            ${title}
          </h1>
          <p className="text-white/80 text-xl max-w-2xl mx-auto mb-10">
            ${desc}
          </p>
          <a href="/app-landing/signup"
            className="inline-block px-8 py-4 rounded-full bg-white text-[#be1354] font-bold text-lg hover:scale-105 transition-transform shadow-xl">
            Essayer gratuitement
          </a>
          <div className="mt-4">
            <a href="/app-landing" className="text-white/50 text-sm hover:text-white transition-colors">
              ← Retour à l'accueil
            </a>
          </div>
        </div>
      </section>`;

Object.entries(pages).forEach(([slug, data]) => {
  const filePath = path.join(baseDir, slug, 'page.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  const start = content.indexOf('<section');
  if (start === -1) return;
  const end = content.indexOf('</section>', start);
  if (end === -1) return;
  const before = content.slice(0, start);
  const after = content.slice(end + '</section>'.length);
  const next = before + heroTemplate(data) + after;
  fs.writeFileSync(filePath, next, 'utf8');
  console.log('Updated hero:', slug);
});
