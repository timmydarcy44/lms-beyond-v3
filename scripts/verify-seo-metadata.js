/**
 * Script de vérification des métadonnées SEO
 * Vérifie que chaque page a un title, H1 et meta description unique
 */

const fs = require('fs');
const path = require('path');

// Configuration des pages à vérifier
const PAGES_TO_CHECK = [
  {
    route: '/',
    file: 'src/app/jessica-contentin/page.tsx',
    layout: 'src/app/jessica-contentin/layout.tsx',
    expectedH1: 'Jessica CONTENTIN - Psychopédagogue certifiée en neuroéducation',
  },
  {
    route: '/a-propos',
    file: 'src/app/jessica-contentin/a-propos/page.tsx',
    metadata: 'src/app/jessica-contentin/a-propos/metadata.ts',
    expectedH1: 'À propos de Jessica CONTENTIN',
  },
  {
    route: '/specialites',
    file: 'src/app/jessica-contentin/specialites/page.tsx',
    layout: 'src/app/jessica-contentin/specialites/layout.tsx',
    expectedH1: 'Mes Spécialités en Psychopédagogie',
  },
  {
    route: '/consultations',
    file: 'src/app/jessica-contentin/consultations/page.tsx',
    layout: 'src/app/jessica-contentin/consultations/layout.tsx',
    expectedH1: 'Consultations Psychopédagogiques',
  },
  {
    route: '/orientation',
    file: 'src/app/jessica-contentin/orientation/page.tsx',
    layout: 'src/app/jessica-contentin/orientation/layout.tsx',
    expectedH1: 'Orientation Scolaire et Professionnelle',
  },
  {
    route: '/ressources',
    file: 'src/app/jessica-contentin/ressources/page.tsx',
    metadata: 'src/app/jessica-contentin/ressources/metadata.ts',
    expectedH1: 'Ressources Psychopédagogiques',
  },
];

// Spécialités dynamiques
const SPECIALITIES = [
  'tnd',
  'harcelement',
  'confiance-en-soi',
  'gestion-stress',
  'guidance-parentale',
  'tests',
  'therapie',
  'neuroeducation',
  'strategie-apprentissage',
];

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function extractMetadata(filePath) {
  if (!checkFileExists(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
  
  // Extraire title
  const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
  const title = titleMatch ? titleMatch[1] : null;
  
  // Extraire description
  const descMatch = content.match(/description:\s*["']([^"']+)["']/);
  const description = descMatch ? descMatch[1] : null;
  
  return { title, description };
}

function extractH1(filePath) {
  if (!checkFileExists(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
  
  // Chercher les H1
  const h1Matches = content.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
  const h1s = h1Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
  
  // Chercher aussi dans les templates JSX
  const h1TemplateMatches = content.match(/\{SPECIALITY_SEO_CONFIG\[slug\]\?\.h1|\{content\.title\}/g) || [];
  
  return h1s.length > 0 ? h1s : (h1TemplateMatches.length > 0 ? ['Dynamique'] : null);
}

function main() {
  console.log('🔍 Vérification des métadonnées SEO...\n');
  
  const results = [];
  const titles = new Set();
  const descriptions = new Set();
  const h1s = new Set();
  
  // Vérifier les pages statiques
  for (const page of PAGES_TO_CHECK) {
    console.log(`📄 Vérification: ${page.route}`);
    
    let metadata = null;
    if (page.metadata) {
      metadata = extractMetadata(page.metadata);
    } else if (page.layout) {
      metadata = extractMetadata(page.layout);
    }
    
    const h1 = extractH1(page.file);
    
    const result = {
      route: page.route,
      hasMetadata: !!metadata,
      title: metadata?.title || 'NON DÉFINI',
      description: metadata?.description || 'NON DÉFINIE',
      h1: h1?.[0] || 'NON TROUVÉ',
      issues: [],
    };
    
    // Vérifier l'unicité
    if (metadata?.title) {
      if (titles.has(metadata.title)) {
        result.issues.push(`Title dupliqué: "${metadata.title}"`);
      }
      titles.add(metadata.title);
    } else {
      result.issues.push('Title manquant');
    }
    
    if (metadata?.description) {
      if (descriptions.has(metadata.description)) {
        result.issues.push(`Description dupliquée`);
      }
      descriptions.add(metadata.description);
    } else {
      result.issues.push('Meta description manquante');
    }
    
    if (h1 && h1[0] !== 'Dynamique') {
      if (h1s.has(h1[0])) {
        result.issues.push(`H1 dupliqué: "${h1[0]}"`);
      }
      h1s.add(h1[0]);
    } else if (!h1) {
      result.issues.push('H1 manquant');
    }
    
    results.push(result);
    
    if (result.issues.length > 0) {
      console.log(`   ❌ Problèmes: ${result.issues.join(', ')}`);
    } else {
      console.log(`   ✅ OK`);
    }
  }
  
  // Vérifier les spécialités dynamiques
  console.log(`\n📄 Vérification des spécialités dynamiques...`);
  const seoConfigPath = path.join(process.cwd(), 'src/lib/seo/link-juice-strategy.ts');
  if (checkFileExists(seoConfigPath)) {
    const seoConfig = fs.readFileSync(seoConfigPath, 'utf-8');
    
    for (const slug of SPECIALITIES) {
      const titleMatch = seoConfig.match(new RegExp(`"${slug}":\\s*{[^}]*title:\\s*"([^"]+)"`));
      const descMatch = seoConfig.match(new RegExp(`"${slug}":\\s*{[^}]*description:\\s*"([^"]+)"`));
      const h1Match = seoConfig.match(new RegExp(`"${slug}":\\s*{[^}]*h1:\\s*"([^"]+)"`));
      
      const title = titleMatch ? titleMatch[1] : null;
      const description = descMatch ? descMatch[1] : null;
      const h1 = h1Match ? h1Match[1] : null;
      
      console.log(`   ${slug}: ${title ? '✅' : '❌'} Title, ${description ? '✅' : '❌'} Description, ${h1 ? '✅' : '❌'} H1`);
      
      if (title) titles.add(title);
      if (description) descriptions.add(description);
      if (h1) h1s.add(h1);
    }
  }
  
  // Résumé
  console.log('\n📊 Résumé:');
  console.log(`   - Pages vérifiées: ${results.length + SPECIALITIES.length}`);
  console.log(`   - Titles uniques: ${titles.size}`);
  console.log(`   - Descriptions uniques: ${descriptions.size}`);
  console.log(`   - H1 uniques: ${h1s.size}`);
  
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  if (totalIssues === 0) {
    console.log('\n✅ Toutes les métadonnées sont uniques et présentes !');
  } else {
    console.log(`\n⚠️  ${totalIssues} problème(s) détecté(s)`);
  }
}

main();

