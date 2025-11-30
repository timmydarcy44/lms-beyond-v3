/**
 * Analyseur concurrentiel avec URLs manuelles
 * Utilisez ce script si la recherche Google automatique ne fonctionne pas
 */

const { analyzeSite } = require('./competitor-analyzer');
const fs = require('fs').promises;
const path = require('path');

// ⚠️ IMPORTANT : Ajoutez ici les URLs des concurrents trouvés manuellement
const COMPETITOR_URLS = [
  // Exemple :
  // 'https://psychopedagogue-caen-exemple.fr',
  // 'https://accompagnement-dys-caen.fr',
  // Ajoutez les URLs réelles ici après recherche Google manuelle
];

async function main() {
  console.log('🚀 Analyse concurrentielle avec URLs manuelles...\n');
  
  if (COMPETITOR_URLS.length === 0) {
    console.log('⚠️  Aucune URL de concurrent à analyser.');
    console.log('\n📝 Instructions :');
    console.log('   1. Allez sur Google.fr');
    console.log('   2. Recherchez : "psychopédagogue Caen"');
    console.log('   3. Notez les 10 premiers résultats (sites web uniquement)');
    console.log('   4. Répétez pour chaque mot-clé :');
    console.log('      - "troubles DYS Caen"');
    console.log('      - "TDA-H Caen"');
    console.log('      - "harcèlement scolaire Caen"');
    console.log('      - "accompagnement scolaire Caen"');
    console.log('      - "neuroéducation Caen"');
    console.log('   5. Ajoutez les URLs dans COMPETITOR_URLS dans ce fichier');
    console.log('   6. Relancez le script\n');
    return;
  }
  
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    console.log(`📊 Analyse de ${COMPETITOR_URLS.length} concurrent(s)...\n`);
    
    const analyses = [];
    for (let i = 0; i < COMPETITOR_URLS.length; i++) {
      const url = COMPETITOR_URLS[i];
      console.log(`[${i + 1}/${COMPETITOR_URLS.length}] Analyse de: ${url}`);
      const analysis = await analyzeSite(browser, url);
      analyses.push(analysis);
      if (!analysis.error) {
        console.log(`   ✅ Analysé: ${analysis.title || 'Sans titre'}`);
      } else {
        console.log(`   ❌ Erreur: ${analysis.error}`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Générer le rapport
    const report = {
      date: new Date().toISOString(),
      totalCompetitors: COMPETITOR_URLS.length,
      analyses: analyses.filter(a => !a.error),
      errors: analyses.filter(a => a.error),
    };
    
    // Sauvegarder
    const reportPath = path.join(__dirname, '../competitor-analysis-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    const markdownReport = generateMarkdownReport(report);
    const markdownPath = path.join(__dirname, '../COMPETITOR_ANALYSIS_REPORT.md');
    await fs.writeFile(markdownPath, markdownReport);
    
    console.log('\n✅ Analyse terminée !');
    console.log(`📄 Rapport JSON: ${reportPath}`);
    console.log(`📄 Rapport Markdown: ${markdownPath}`);
    
  } finally {
    await browser.close();
  }
}

function generateMarkdownReport(report) {
  let markdown = `# Rapport d'Analyse Concurrentielle - Jessica Contentin\n\n`;
  markdown += `**Date:** ${new Date(report.date).toLocaleDateString('fr-FR')}\n`;
  markdown += `**Nombre de concurrents analysés:** ${report.totalCompetitors}\n\n`;
  markdown += `---\n\n`;
  
  report.analyses.forEach((analysis, index) => {
    markdown += `## ${index + 1}. ${analysis.url}\n\n`;
    markdown += `### Informations Générales\n\n`;
    markdown += `- **URL:** ${analysis.url}\n`;
    markdown += `- **Temps de chargement:** ${analysis.loadTime}ms\n`;
    markdown += `- **Mobile-friendly:** ${analysis.isMobileFriendly ? '✅ Oui' : '❌ Non'}\n`;
    markdown += `- **Sitemap:** ${analysis.sitemapExists ? '✅ Oui' : '❌ Non'}\n`;
    markdown += `- **Pages estimées:** ${analysis.estimatedPages}\n\n`;
    markdown += `### SEO\n\n`;
    markdown += `- **Title:** ${analysis.title || 'Non défini'}\n`;
    markdown += `- **Meta Description:** ${analysis.metaDescription ? (analysis.metaDescription.substring(0, 150) + '...') : 'Non défini'}\n`;
    markdown += `- **H1:** ${analysis.h1.length > 0 ? analysis.h1.join(', ') : 'Non trouvé'}\n`;
    markdown += `- **Structured Data:** ${analysis.structuredData.length > 0 ? `✅ ${analysis.structuredData.length} type(s)` : '❌ Aucun'}\n\n`;
    markdown += `### Contenu\n\n`;
    markdown += `- **Nombre de mots:** ${analysis.wordCount.toLocaleString()}\n`;
    markdown += `- **Liens internes:** ${analysis.links.filter(l => l.isInternal).length}\n`;
    markdown += `- **Images:** ${analysis.images}\n`;
    markdown += `- **Blog:** ${analysis.hasBlog ? '✅ Oui' : '❌ Non'}\n`;
    markdown += `- **FAQ:** ${analysis.hasFAQ ? '✅ Oui' : '❌ Non'}\n\n`;
    markdown += `---\n\n`;
  });
  
  return markdown;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

