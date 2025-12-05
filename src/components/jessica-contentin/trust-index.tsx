"use client";

import { useState, useEffect, useRef } from "react";

/**
 * CONFIGURATION GOOGLE BUSINESS IFRAME
 * 
 * Pour afficher les avis Google via iframe :
 * 1. Allez sur votre profil Google Business
 * 2. Cliquez sur "Partager" ou "Partager l'entreprise"
 * 3. Sélectionnez "Intégrer une carte"
 * 4. Copiez l'URL de l'iframe (elle commence par https://www.google.com/maps/embed?pb=...)
 * 5. Collez-la ci-dessous dans GOOGLE_BUSINESS_IFRAME_URL
 * 
 * Exemple d'URL : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d..."
 */
const GOOGLE_BUSINESS_IFRAME_URL = ""; // ⬅️ COLLEZ VOTRE URL GOOGLE BUSINESS IFRAME ICI

export function TrustIndex() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  // Trust Index Widget ID
  const TRUST_INDEX_WIDGET_ID = "b77eee0587d8867421367bea9ed";
  
  // Utiliser l'iframe si l'URL est configurée, sinon utiliser le script Trust Index
  const useIframe = !!GOOGLE_BUSINESS_IFRAME_URL;

  // S'assurer que le composant est monté côté client avant de manipuler le DOM
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Ne rien faire si le composant n'est pas encore monté
    if (!isMounted) return;
    
    // Vérifier que document est disponible (côté client uniquement)
    if (typeof document === 'undefined') return;
    if (useIframe) {
      // Si on utilise l'iframe, juste attendre le chargement
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Charger le script Trust Index
      const loadTrustIndex = () => {
        console.log("[TrustIndex] Début du chargement du script Trust Index...");
        
        // Vérifier si le script est déjà chargé
        const existingScript = document.querySelector(`script[src*="trustindex.io"][src*="${TRUST_INDEX_WIDGET_ID}"]`);
        
        if (existingScript) {
          console.log("[TrustIndex] Script déjà présent dans le DOM");
          // Attendre un peu et vérifier si TrustindexLoader est disponible
          setTimeout(() => {
            if ((window as any).TrustindexLoader) {
              console.log("[TrustIndex] TrustindexLoader disponible, chargement du widget...");
              try {
                (window as any).TrustindexLoader.load();
                setLoading(false);
                setError(false);
              } catch (err) {
                console.error("[TrustIndex] Erreur lors du chargement du widget:", err);
                setError(true);
                setLoading(false);
              }
            } else {
              console.log("[TrustIndex] TrustindexLoader pas encore disponible, attente...");
              setLoading(false);
            }
          }, 1000);
          return;
        }

        // Créer et charger le script
        const script = document.createElement("script");
        script.src = `https://cdn.trustindex.io/loader.js?${TRUST_INDEX_WIDGET_ID}`;
        script.async = true;
        script.defer = true;
        script.id = "trustindex-loader-script";
        
        script.onload = () => {
          console.log("[TrustIndex] ✅ Script chargé avec succès");
          scriptLoadedRef.current = true;
          
          // Attendre que TrustindexLoader soit disponible
          const checkAndLoad = () => {
            if ((window as any).TrustindexLoader) {
              console.log("[TrustIndex] ✅ TrustindexLoader trouvé, chargement du widget...");
              try {
                (window as any).TrustindexLoader.load();
                // Attendre un peu pour que le widget se rende
                setTimeout(() => {
                  setLoading(false);
                  setError(false);
                  console.log("[TrustIndex] ✅ Widget chargé et affiché");
                }, 1000);
              } catch (err) {
                console.error("[TrustIndex] ❌ Erreur lors du chargement du widget:", err);
                setError(true);
                setLoading(false);
              }
            } else {
              console.log("[TrustIndex] ⏳ TrustindexLoader pas encore disponible, nouvelle tentative...");
              setTimeout(checkAndLoad, 300);
            }
          };
          
          // Première tentative après 500ms
          setTimeout(checkAndLoad, 500);
          
          // Timeout de sécurité après 10 secondes
          setTimeout(() => {
            if (loading) {
              console.warn("[TrustIndex] ⚠️ Timeout - Le widget n'a pas pu se charger dans les temps");
              // Essayer l'iframe de fallback
              const iframeFallback = document.getElementById('trustindex-iframe-fallback') as HTMLIFrameElement;
              if (iframeFallback) {
                console.log("[TrustIndex] Tentative avec l'iframe de fallback...");
                iframeFallback.style.display = "block";
                if (widgetRef.current) {
                  widgetRef.current.style.display = "none";
                }
                setLoading(false);
                setError(false);
              } else {
                setError(true);
                setLoading(false);
              }
            }
          }, 10000);
        };
        
        script.onerror = () => {
          console.error("[TrustIndex] ❌ Erreur lors du chargement du script");
          setError(true);
          setLoading(false);
        };
        
        // Ajouter le script au head
        document.head.appendChild(script);
        console.log("[TrustIndex] Script ajouté au DOM");
      };

      // Charger le script après un court délai
      const timer = setTimeout(() => {
        loadTrustIndex();
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [useIframe, isMounted]);

  // Ne rien afficher pendant l'hydratation
  if (!isMounted) {
    return (
      <section className="py-12 bg-[#F8F5F0] mx-4 mb-4 rounded-2xl">
        <div className="mx-auto max-w-7xl px-6">
          <h2
            className="text-3xl font-bold text-[#2F2A25] mb-8 text-center"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            }}
          >
            Avis Google
          </h2>
          <div className="relative w-full" style={{ minHeight: "400px" }}>
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6A664] mb-4"></div>
                <p>Chargement...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-[#F8F5F0] mx-4 mb-4 rounded-2xl">
      <div className="mx-auto max-w-7xl px-6">
        <h2
          className="text-3xl font-bold text-[#2F2A25] mb-8 text-center"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          }}
        >
          Avis Google
        </h2>
        
        <div className="relative w-full" style={{ minHeight: "400px" }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-10">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6A664] mb-4"></div>
                <p>Chargement des avis Google...</p>
              </div>
            </div>
          )}
          
          {useIframe ? (
            <iframe
              src={GOOGLE_BUSINESS_IFRAME_URL}
              className="w-full rounded-xl border-0"
              style={{
                minHeight: "400px",
                height: "600px",
                display: loading ? "none" : "block",
              }}
              title="Avis Google - Jessica CONTENTIN"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                setLoading(false);
                setError(false);
              }}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          ) : (
            <>
              {/* 
                Conteneur Trust Index - Équivalent HTML du shortcode [trustindex data-widget-id=b77eee0587d8867421367bea9ed]
                Le shortcode WordPress [trustindex data-widget-id=b77eee0587d8867421367bea9ed] se traduit par :
                - class="trustindex-widget"
                - data-widget-id="b77eee0587d8867421367bea9ed"
                Le script Trust Index chargera automatiquement les avis dans ce conteneur
              */}
              <div
                ref={widgetRef}
                className="trustindex-widget"
                data-widget-id={TRUST_INDEX_WIDGET_ID}
                style={{ 
                  minHeight: "400px",
                  width: "100%",
                  display: "block"
                }}
              >
                {/* Le widget Trust Index sera injecté ici par le script loader.js */}
              </div>
              
              {/* 
                Iframe de fallback Trust Index (si le script ne fonctionne pas)
                URL format: https://www.trustindex.io/reviews/{WIDGET_ID}?no-registration=google
              */}
              <iframe
                src={`https://www.trustindex.io/reviews/${TRUST_INDEX_WIDGET_ID}?no-registration=google`}
                className="w-full rounded-xl border-0"
                style={{
                  minHeight: "400px",
                  height: "600px",
                  display: "none" // Caché par défaut, activé automatiquement si le script échoue
                }}
                title="Avis Google - Jessica CONTENTIN"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                id="trustindex-iframe-fallback"
              />
            </>
          )}
          
          {error && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Les avis Google ne peuvent pas être affichés pour le moment.
              </p>
              {useIframe ? (
                <p className="text-sm text-gray-500">
                  L'iframe Google Business n'a pas pu se charger. Vérifiez que l'URL dans <code className="bg-gray-100 px-2 py-1 rounded">GOOGLE_BUSINESS_IFRAME_URL</code> est correcte.
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Pour afficher les avis via iframe, configurez <code className="bg-gray-100 px-2 py-1 rounded">GOOGLE_BUSINESS_IFRAME_URL</code> en haut du fichier <code className="bg-gray-100 px-2 py-1 rounded">trust-index.tsx</code>.
                  <br />
                  <strong>Instructions :</strong> Google Business &gt; Partager &gt; Intégrer une carte &gt; Copier l'URL de l'iframe
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

