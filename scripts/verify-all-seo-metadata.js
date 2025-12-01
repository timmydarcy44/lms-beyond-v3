/**
 * Script de vérification complète des métadonnées SEO
 * Vérifie que toutes les pages ont des titles, descriptions et keywords optimisés
 */

const fs = require('fs');
const path = require('path');

// Configuration des pages à vérifier
const PAGES_TO_CHECK = [
  {
    route: '/',
    layout: 'src/app/jessica-contentin/page/layout.tsx',
    expectedTitle: 'Jessica CONTENTIN - Psychopédagogue certifiée en neuroéducation | Fleury-sur-Orne, Caen',
    expectedKeywords: ['psychopédagogue Fleury-sur-Orne', 'psychopédagogue Caen', 'troubles DYS Caen'],
  },
  {
    route: '/a-propos',
    metadata: 'src/app/jessica-contentin/a-propos/metadata.ts',
    expectedTitle: 'À propos - Jessica CONTENTIN | Psychopédagogue certifiée neuroéducation | Caen',
  },
  {
    route: '/specialites',
    layout: 'src/app/jessica-contentin/specialites/layout.tsx',
    expectedTitle: 'Spécialités - Psychopédagogie | Troubles DYS, TDA-H, Harcèlement scolaire | Caen',
  },
  {
    route: '/consultations',
    layout: 'src/app/jessica-contentin/consultations/layout.tsx',
    expectedTitle: 'Consultations | Tarifs et Modalités | Psychopédagogue Fleury-sur-Orne',
  },
  {
    route: '/orientation',
    layout: 'src/app/jessica-contentin/orientation/layout.tsx',
    expectedTitle: 'Orientation Scolaire et Professionnelle | Parcoursup | Psychopédagogue Caen',
  },
  {
    route: '/ressources',
    metadata: 'src/app/jessica-contentin/ressources/metadata.ts',
    expectedTitle: 'Ressources Psychopédagogiques | Articles et Outils | Jessica CONTENTIN',
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
  'orientation',
];

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function extractMetadataFromFile(filePath) {
  if (!checkFileExists(filePath)) {
    return null;
  }

  const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
  
  // Extraire le title
  const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
  const title = titleMatch ? titleMatch[1] : null;
  
  // Extraire la description
  const descMatch = content.match(/description:\s*["']([^"']+)["']/);
  const description = descMatch ? descMatch[1] : null;
  
  // Extraire les keywords
  const keywordsMatch = content.match(/keywords:\s*\[([^\]]+)\]/);
  const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim().replace(/["']/g, '')) : null;
  
  return { title, description, keywords };
}

function checkPage(page) {
  const result = {
    route: page.route,
    status: '❌',
    issues: [],
    metadata: null,
  };

  // Vérifier le layout ou metadata
  if (page.layout) {
    result.metadata = extractMetadataFromFile(page.layout);
    if (!result.metadata) {
      result.issues.push(`Layout non trouvé: ${page.layout}`);
    }
  } else if (page.metadata) {
    result.metadata = extractMetadataFromFile(page.metadata);
    if (!result.metadata) {
      result.issues.push(`Metadata non trouvé: ${page.metadata}`);
    }
  }

  if (result.metadata) {
    // Vérifier le title
    if (!result.metadata.title) {
      result.issues.push('Title manquant');
    } else if (page.expectedTitle && !result.metadata.title.includes(page.expectedTitle.split('|')[0].trim())) {
      result.issues.push(`Title ne correspond pas. Attendu: ${page.expectedTitle}, Trouvé: ${result.metadata.title}`);
    }

    // Vérifier la description
    if (!result.metadata.description) {
      result.issues.push('Description manquante');
    } else if (result.metadata.description.length < 120) {
      result.issues.push(`Description trop courte (${result.metadata.description.length} caractères, minimum 120)`);
    }

    // Vérifier les keywords
    if (page.expectedKeywords) {
      const hasKeywords = page.expectedKeywords.some(kw => 
        result.metadata.keywords && result.metadata.keywords.some(k => k.includes(kw))
      );
      if (!hasKeywords) {
        result.issues.push(`Keywords attendus non trouvés: ${page.expectedKeywords.join(', ')}`);
      }
    }

    if (result.issues.length === 0) {
      result.status = '✅';
    }
  }

  return result;
}

// Vérifier les pages principales
console.log('🔍 Vérification des métadonnées SEO...\n');
const results = PAGES_TO_CHECK.map(checkPage);

// Afficher les résultats
results.forEach(result => {
  console.log(`${result.status} ${result.route}`);
  if (result.metadata) {
    console.log(`   Title: ${result.metadata.title || 'MANQUANT'}`);
    console.log(`   Description: ${result.metadata.description ? result.metadata.description.substring(0, 80) + '...' : 'MANQUANTE'}`);
  }
  if (result.issues.length > 0) {
    result.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
  }
  console.log('');
});

// Vérifier les spécialités
console.log('\n🔍 Vérification des spécialités...\n');
const seoConfigPath = 'src/lib/seo/link-juice-strategy.ts';
if (checkFileExists(seoConfigPath)) {
  const seoConfigContent = fs.readFileSync(path.join(process.cwd(), seoConfigPath), 'utf-8');
  
  SPECIALITIES.forEach(slug => {
    const hasConfig = seoConfigContent.includes(`"${slug}":`);
    const hasTitle = seoConfigContent.includes(`title:`);
    const status = hasConfig ? '✅' : '❌';
    console.log(`${status} /specialites/${slug} ${hasConfig ? '' : '(config manquante)'}`);
  });
}

// Résumé
const successCount = results.filter(r => r.status === '✅').length;
const totalCount = results.length;
console.log(`\n📊 Résumé: ${successCount}/${totalCount} pages avec métadonnées optimisées`);

if (successCount < totalCount) {
  console.log('\n⚠️  Des améliorations sont nécessaires pour optimiser le SEO.');
  process.exit(1);
} else {
  console.log('\n✅ Toutes les pages ont des métadonnées optimisées !');
  process.exit(0);
}

