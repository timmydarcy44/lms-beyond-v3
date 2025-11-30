/**
 * Bot d'analyse concurrentielle pour Jessica Contentin
 * Analyse automatique des sites concurrents
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const TARGET_KEYWORDS = [
  'psychopédagogue Caen',
  'troubles DYS Caen',
  'TDA-H Caen',
  'harcèlement scolaire Caen',
  'accompagnement scolaire Caen',
  'neuroéducation Caen',
];

const COMPETITOR_URLS = [
  // URLs à analyser - à compléter après recherche Google
  // Exemple: 'https://example-psychopedagogue.fr',
];

// Fonction pour analyser un site
async function analyzeSite(browser, url) {
  console.log(`\n🔍 Analyse de: ${url}`);
  
  try {
    const page = await browser.newPage();
    
    // Configuration
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Mesurer le temps de chargement
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const loadTime = Date.now() - startTime;
    
    // Extraire les données SEO
    const seoData = await page.evaluate(() => {
      const getMetaContent = (name) => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta ? meta.getAttribute('content') : null;
      };
      
      const getStructuredData = () => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        return scripts.map(script => {
          try {
            return JSON.parse(script.textContent);
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
      };
      
      return {
        title: document.title,
        metaDescription: getMetaContent('description'),
        metaKeywords: getMetaContent('keywords'),
        h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
        h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()).slice(0, 10),
        links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
          text: a.textContent.trim().substring(0, 100),
          href: a.getAttribute('href'),
          isInternal: !a.getAttribute('href').startsWith('http') || new URL(a.getAttribute('href')).hostname === window.location.hostname,
        })).filter(link => link.text && link.href),
        images: Array.from(document.querySelectorAll('img')).length,
        structuredData: getStructuredData(),
        wordCount: document.body.innerText.split(/\s+/).length,
        hasBlog: document.querySelector('article, .blog, .post, [class*="blog"]') !== null,
        hasFAQ: document.querySelector('[class*="faq"], [id*="faq"]') !== null,
        hasTestimonials: document.querySelector('[class*="testimonial"], [class*="avis"], [class*="review"]') !== null,
        hasContactForm: document.querySelector('form[action*="contact"], form[class*="contact"]') !== null,
        hasBooking: document.querySelector('[href*="doctolib"], [href*="rdv"], [href*="booking"], [href*="rendez-vous"]') !== null,
      };
    });
    
    // Vérifier mobile-friendly
    const isMobileFriendly = await page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]');
      return viewport !== null;
    });
    
    // Compter les pages (estimation via sitemap ou liens)
    const sitemapUrl = new URL('/sitemap.xml', url).href;
    let sitemapExists = false;
    try {
      const sitemapResponse = await page.goto(sitemapUrl, { waitUntil: 'networkidle2', timeout: 5000 });
      sitemapExists = sitemapResponse.status() === 200;
    } catch (e) {
      sitemapExists = false;
    }
    
    // Estimer le nombre de pages via les liens internes
    const internalLinks = seoData.links.filter(link => link.isInternal);
    const uniquePages = new Set(internalLinks.map(link => {
      try {
        const urlObj = new URL(link.href, url);
        return urlObj.pathname;
      } catch {
        return link.href;
      }
    }));
    
    await page.close();
    
    return {
      url,
      loadTime,
      isMobileFriendly,
      sitemapExists,
      estimatedPages: uniquePages.size,
      ...seoData,
    };
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse de ${url}:`, error.message);
    return {
      url,
      error: error.message,
    };
  }
}

// Fonction pour rechercher des concurrents sur Google
async function searchCompetitors(browser, keyword) {
  console.log(`\n🔎 Recherche pour: "${keyword}"`);
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Recherche Google
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=10`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Attendre que les résultats se chargent
    await page.waitForSelector('div#search', { timeout: 10000 });
    await page.waitForTimeout(2000); // Attendre un peu plus
    
    // Extraire les URLs des résultats de recherche Google
    const results = await page.evaluate(() => {
      const urls = [];
      
      // Méthode 1 : Chercher dans les résultats de recherche (div.g)
      const searchResults = document.querySelectorAll('div.g');
      searchResults.forEach(result => {
        const link = result.querySelector('a[href^="http"]');
        if (link) {
          const href = link.getAttribute('href');
          if (href && !href.includes('google.com') && !href.includes('youtube.com') && !href.includes('maps.google.com')) {
            try {
              const url = new URL(href);
              const origin = url.origin;
              if (!urls.includes(origin) && !origin.includes('google')) {
                urls.push(origin);
              }
            } catch (e) {
              // Ignorer les URLs invalides
            }
          }
        }
      });
      
      // Méthode 2 : Chercher dans tous les liens si méthode 1 ne fonctionne pas
      if (urls.length === 0) {
        const allLinks = Array.from(document.querySelectorAll('a[href^="http"]'));
        allLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href && !href.includes('google.com') && !href.includes('youtube.com') && !href.includes('maps.google.com')) {
            try {
              const url = new URL(href);
              const origin = url.origin;
              if (!urls.includes(origin) && !origin.includes('google')) {
                urls.push(origin);
              }
            } catch (e) {
              // Ignorer
            }
          }
        });
      }
      
      return urls.slice(0, 10); // Top 10
    });
    
    await page.close();
    
    return results;
    
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche pour "${keyword}":`, error.message);
    return [];
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage de l\'analyse concurrentielle...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    let allCompetitors = new Set();
    
    // Rechercher des concurrents pour chaque mot-clé
    if (TARGET_KEYWORDS.length > 0) {
      console.log('📊 Recherche des concurrents sur Google...');
      for (const keyword of TARGET_KEYWORDS) {
        const results = await searchCompetitors(browser, keyword);
        results.forEach(url => allCompetitors.add(url));
        await new Promise(resolve => setTimeout(resolve, 2000)); // Pause entre recherches
      }
    }
    
    // Ajouter les URLs manuelles
    COMPETITOR_URLS.forEach(url => allCompetitors.add(url));
    
    const competitors = Array.from(allCompetitors);
    console.log(`\n✅ ${competitors.length} concurrents identifiés\n`);
    
    // Analyser chaque concurrent
    const analyses = [];
    for (const url of competitors) {
      const analysis = await analyzeSite(browser, url);
      analyses.push(analysis);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pause entre analyses
    }
    
    // Générer le rapport
    const report = {
      date: new Date().toISOString(),
      totalCompetitors: competitors.length,
      analyses: analyses.filter(a => !a.error),
      errors: analyses.filter(a => a.error),
    };
    
    // Sauvegarder le rapport
    const reportPath = path.join(__dirname, '../competitor-analysis-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Générer un rapport markdown
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

// Générer un rapport Markdown
function generateMarkdownReport(report) {
  let markdown = `# Rapport d'Analyse Concurrentielle - Jessica Contentin\n\n`;
  markdown += `**Date:** ${new Date(report.date).toLocaleDateString('fr-FR')}\n`;
  markdown += `**Nombre de concurrents analysés:** ${report.totalCompetitors}\n\n`;
  markdown += `---\n\n`;
  
  report.analyses.forEach((analysis, index) => {
    markdown += `## ${index + 1}. ${analysis.url}\n\n`;
    
    if (analysis.error) {
      markdown += `❌ **Erreur:** ${analysis.error}\n\n`;
      return;
    }
    
    markdown += `### Informations Générales\n\n`;
    markdown += `- **URL:** ${analysis.url}\n`;
    markdown += `- **Temps de chargement:** ${analysis.loadTime}ms\n`;
    markdown += `- **Mobile-friendly:** ${analysis.isMobileFriendly ? '✅ Oui' : '❌ Non'}\n`;
    markdown += `- **Sitemap:** ${analysis.sitemapExists ? '✅ Oui' : '❌ Non'}\n`;
    markdown += `- **Pages estimées:** ${analysis.estimatedPages}\n\n`;
    
    markdown += `### SEO\n\n`;
    markdown += `- **Title:** ${analysis.title || 'Non défini'}\n`;
    markdown += `- **Meta Description:** ${analysis.metaDescription || 'Non défini'}\n`;
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

// Exécuter
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeSite, searchCompetitors };

