/**
 * Analyseur concurrentiel simplifié (sans Puppeteer)
 * Utilise des requêtes HTTP simples pour analyser les sites
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const COMPETITOR_URLS = [
  // URLs à analyser - à compléter
  // Exemple: 'https://example-psychopedagogue.fr',
];

// Fonction pour faire une requête HTTP
function fetch(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000,
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

// Fonction pour extraire les données SEO du HTML
function extractSEOData(html, url) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const metaKeywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i);
  
  // Extraire les H1
  const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
  const h1 = h1Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
  
  // Extraire les H2
  const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
  const h2 = h2Matches.slice(0, 10).map(m => m.replace(/<[^>]+>/g, '').trim());
  
  // Compter les liens
  const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi) || [];
  const links = linkMatches.map(m => {
    const hrefMatch = m.match(/href=["']([^"']+)["']/i);
    const textMatch = m.match(/>([^<]+)</i);
    return {
      href: hrefMatch ? hrefMatch[1] : '',
      text: textMatch ? textMatch[1].trim().substring(0, 100) : '',
    };
  }).filter(l => l.href && l.text);
  
  // Compter les images
  const images = (html.match(/<img[^>]*>/gi) || []).length;
  
  // Vérifier la présence de certains éléments
  const hasBlog = /<article|<div[^>]*class=["'][^"']*blog|<div[^>]*class=["'][^"']*post/i.test(html);
  const hasFAQ = /<div[^>]*class=["'][^"']*faq|<div[^>]*id=["'][^"']*faq/i.test(html);
  const hasTestimonials = /<div[^>]*class=["'][^"']*testimonial|<div[^>]*class=["'][^"']*avis|<div[^>]*class=["'][^"']*review/i.test(html);
  const hasContactForm = /<form[^>]*action=["'][^"']*contact|<form[^>]*class=["'][^"']*contact/i.test(html);
  const hasBooking = /doctolib|rdv|booking|rendez-vous/i.test(html);
  
  // Extraire Structured Data
  const structuredDataMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi) || [];
  const structuredData = structuredDataMatches.map(m => {
    const jsonMatch = m.match(/>([^<]+)</i);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        return null;
      }
    }
    return null;
  }).filter(Boolean);
  
  // Compter les mots (approximation)
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(/\s+/).length;
  
  // Vérifier les liens internes vs externes
  const internalLinks = links.filter(l => {
    try {
      const linkUrl = new URL(l.href, url);
      const baseUrl = new URL(url);
      return linkUrl.hostname === baseUrl.hostname;
    } catch {
      return !l.href.startsWith('http');
    }
  });
  
  return {
    title: titleMatch ? titleMatch[1] : null,
    metaDescription: metaDescMatch ? metaDescMatch[1] : null,
    metaKeywords: metaKeywordsMatch ? metaKeywordsMatch[1] : null,
    h1,
    h2,
    links: links.length,
    internalLinks: internalLinks.length,
    externalLinks: links.length - internalLinks.length,
    images,
    wordCount,
    hasBlog,
    hasFAQ,
    hasTestimonials,
    hasContactForm,
    hasBooking,
    structuredData: structuredData.length,
    isMobileFriendly: !!viewportMatch,
  };
}

// Fonction pour analyser un site
async function analyzeSite(url) {
  console.log(`\n🔍 Analyse de: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const loadTime = Date.now() - startTime;
    
    if (response.status !== 200) {
      return {
        url,
        error: `Status ${response.status}`,
      };
    }
    
    const seoData = extractSEOData(response.body, url);
    
    // Vérifier le sitemap
    let sitemapExists = false;
    try {
      const sitemapUrl = new URL('/sitemap.xml', url).href;
      const sitemapResponse = await fetch(sitemapUrl);
      sitemapExists = sitemapResponse.status === 200;
    } catch (e) {
      sitemapExists = false;
    }
    
    return {
      url,
      loadTime,
      status: response.status,
      sitemapExists,
      ...seoData,
    };
    
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    return {
      url,
      error: error.message,
    };
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage de l\'analyse concurrentielle...\n');
  
  if (COMPETITOR_URLS.length === 0) {
    console.log('⚠️  Aucune URL de concurrent à analyser.');
    console.log('📝 Ajoutez des URLs dans COMPETITOR_URLS dans le script.\n');
    return;
  }
  
  const analyses = [];
  
  for (const url of COMPETITOR_URLS) {
    const analysis = await analyzeSite(url);
    analyses.push(analysis);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause entre analyses
  }
  
  // Générer le rapport
  const report = {
    date: new Date().toISOString(),
    totalCompetitors: COMPETITOR_URLS.length,
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
}

// Générer un rapport Markdown
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
    markdown += `- **Status HTTP:** ${analysis.status}\n`;
    markdown += `- **Mobile-friendly:** ${analysis.isMobileFriendly ? '✅ Oui' : '❌ Non'}\n`;
    markdown += `- **Sitemap:** ${analysis.sitemapExists ? '✅ Oui' : '❌ Non'}\n\n`;
    
    markdown += `### SEO\n\n`;
    markdown += `- **Title:** ${analysis.title || 'Non défini'}\n`;
    markdown += `- **Meta Description:** ${analysis.metaDescription ? (analysis.metaDescription.substring(0, 150) + '...') : 'Non défini'}\n`;
    markdown += `- **H1:** ${analysis.h1.length > 0 ? analysis.h1.join(', ') : 'Non trouvé'}\n`;
    markdown += `- **Structured Data:** ${analysis.structuredData > 0 ? `✅ ${analysis.structuredData} type(s)` : '❌ Aucun'}\n\n`;
    
    markdown += `### Contenu\n\n`;
    markdown += `- **Nombre de mots:** ${analysis.wordCount.toLocaleString()}\n`;
    markdown += `- **Liens internes:** ${analysis.internalLinks}\n`;
    markdown += `- **Liens externes:** ${analysis.externalLinks}\n`;
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

module.exports = { analyzeSite };

