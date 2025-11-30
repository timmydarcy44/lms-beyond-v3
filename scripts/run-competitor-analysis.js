/**
 * Script pour lancer l'analyse concurrentielle (Option 2)
 * Version complète avec recherche automatique sur Google
 */

const { analyzeSite, searchCompetitors } = require('./competitor-analyzer');

async function main() {
  console.log('🚀 Lancement de l\'analyse concurrentielle (Option 2)...\n');
  console.log('📋 Cette version va :');
  console.log('   1. Rechercher automatiquement les concurrents sur Google');
  console.log('   2. Analyser chaque site identifié');
  console.log('   3. Générer un rapport complet\n');
  
  const puppeteer = require('puppeteer');
  const fs = require('fs').promises;
  const path = require('path');
  
  // Mots-clés au niveau national (France)
  const TARGET_KEYWORDS = [
    'psychopédagogue France',
    'psychopédagogue',
    'troubles DYS accompagnement',
    'TDA-H psychopédagogue',
    'harcèlement scolaire accompagnement',
    'accompagnement scolaire troubles DYS',
    'neuroéducation psychopédagogie',
    'psychopédagogue troubles neurodéveloppement',
    'accompagnement TND',
    'psychopédagogue enfants',
  ];
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    let allCompetitors = new Set();
    
    // Rechercher des concurrents pour chaque mot-clé
    console.log('📊 Recherche des concurrents sur Google...\n');
    for (const keyword of TARGET_KEYWORDS) {
      console.log(`   🔍 Recherche: "${keyword}"`);
      const results = await searchCompetitors(browser, keyword);
      results.forEach(url => allCompetitors.add(url));
      console.log(`   ✅ ${results.length} sites trouvés\n`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Pause entre recherches
    }
    
    const competitors = Array.from(allCompetitors);
    console.log(`\n✅ ${competitors.length} concurrents uniques identifiés au total\n`);
    console.log('📋 Liste des concurrents :');
    competitors.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });
    console.log('\n');
    
    // Analyser chaque concurrent
    console.log('🔍 Analyse des sites concurrents...\n');
    const analyses = [];
    for (let i = 0; i < competitors.length; i++) {
      const url = competitors[i];
      console.log(`   [${i + 1}/${competitors.length}] Analyse de: ${url}`);
      const analysis = await analyzeSite(browser, url);
      analyses.push(analysis);
      if (!analysis.error) {
        console.log(`   ✅ Analysé: ${analysis.title || 'Sans titre'}`);
      } else {
        console.log(`   ❌ Erreur: ${analysis.error}`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // Pause entre analyses
    }
    
    // Générer le rapport
    const report = {
      date: new Date().toISOString(),
      keywords: TARGET_KEYWORDS,
      totalCompetitors: competitors.length,
      analyses: analyses.filter(a => !a.error),
      errors: analyses.filter(a => a.error),
    };
    
    // Sauvegarder le rapport JSON
    const reportPath = path.join(__dirname, '../competitor-analysis-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Générer un rapport markdown
    const markdownReport = generateMarkdownReport(report);
    const markdownPath = path.join(__dirname, '../COMPETITOR_ANALYSIS_REPORT.md');
    await fs.writeFile(markdownPath, markdownReport);
    
    console.log('\n✅ Analyse terminée !');
    console.log(`📄 Rapport JSON: ${reportPath}`);
    console.log(`📄 Rapport Markdown: ${markdownPath}`);
    console.log(`\n📊 Résumé:`);
    console.log(`   - Sites analysés avec succès: ${report.analyses.length}`);
    console.log(`   - Erreurs: ${report.errors.length}`);
    
  } finally {
    await browser.close();
  }
}

function generateMarkdownReport(report) {
  let markdown = `# Rapport d'Analyse Concurrentielle - Jessica Contentin\n\n`;
  markdown += `**Date:** ${new Date(report.date).toLocaleDateString('fr-FR')}\n`;
  markdown += `**Mots-clés analysés:** ${report.keywords.join(', ')}\n`;
  markdown += `**Nombre de concurrents identifiés:** ${report.totalCompetitors}\n`;
  markdown += `**Sites analysés avec succès:** ${report.analyses.length}\n\n`;
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
    markdown += `- **Meta Description:** ${analysis.metaDescription ? (analysis.metaDescription.substring(0, 150) + (analysis.metaDescription.length > 150 ? '...' : '')) : 'Non défini'}\n`;
    markdown += `- **H1:** ${analysis.h1.length > 0 ? analysis.h1.join(', ') : 'Non trouvé'}\n`;
    markdown += `- **Structured Data:** ${analysis.structuredData.length > 0 ? `✅ ${analysis.structuredData.length} type(s)` : '❌ Aucun'}\n\n`;
    
    markdown += `### Contenu\n\n`;
    markdown += `- **Nombre de mots:** ${analysis.wordCount.toLocaleString()}\n`;
    markdown += `- **Liens internes:** ${analysis.links.filter(l => l.isInternal).length}\n`;
    markdown += `- **Liens externes:** ${analysis.links.filter(l => !l.isInternal).length}\n`;
    markdown += `- **Images:** ${analysis.images}\n`;
    markdown += `- **Blog:** ${analysis.hasBlog ? '✅ Oui' : '❌ Non'}\n`;
    markdown += `- **FAQ:** ${analysis.hasFAQ ? '✅ Oui' : '❌ Non'}\n`;
    markdown += `- **Témoignages:** ${analysis.hasTestimonials ? '✅ Oui' : '❌ Non'}\n\n`;
    
    markdown += `### Conversion\n\n`;
    markdown += `- **Formulaire de contact:** ${analysis.hasContactForm ? '✅ Oui' : '❌ Non'}\n`;
    markdown += `- **Prise de RDV:** ${analysis.hasBooking ? '✅ Oui' : '❌ Non'}\n\n`;
    
    if (analysis.h2.length > 0) {
      markdown += `### Structure (H2)\n\n`;
      analysis.h2.forEach(h2 => {
        markdown += `- ${h2}\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `---\n\n`;
  });
  
  if (report.errors.length > 0) {
    markdown += `## Erreurs\n\n`;
    report.errors.forEach(error => {
      markdown += `- ${error.url}: ${error.error}\n`;
    });
  }
  
  return markdown;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

