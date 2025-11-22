"use client";

import { useEffect, useRef, useState } from "react";

export function TrustIndex() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fonction pour charger et initialiser Trust Index
    const loadTrustIndex = () => {
      console.log("[TrustIndex] Début du chargement...");
      
      // Vérifier si le script est déjà chargé
      const existingScript = document.querySelector('script[src*="trustindex.io"]');
      
      if (existingScript && scriptLoadedRef.current) {
        console.log("[TrustIndex] Script déjà chargé, réinitialisation...");
        // Si déjà chargé, réinitialiser le widget
        if ((window as any).TrustindexLoader) {
          (window as any).TrustindexLoader.load();
          setLoading(false);
        }
        return;
      }

      // Charger le script Trustindex avec l'identifiant spécifique
      const script = document.createElement("script");
      script.src = "https://cdn.trustindex.io/loader.js?c04957f3726379396096fb45252";
      script.async = true;
      script.defer = true;
      script.id = "trustindex-loader-script";
      
      script.onload = () => {
        console.log("[TrustIndex] Script chargé avec succès");
        scriptLoadedRef.current = true;
        
        // Attendre que le DOM soit prêt et que TrustindexLoader soit disponible
        const checkAndLoad = () => {
          if ((window as any).TrustindexLoader) {
            console.log("[TrustIndex] TrustindexLoader trouvé, chargement du widget...");
            try {
              (window as any).TrustindexLoader.load();
              setLoading(false);
              console.log("[TrustIndex] Widget chargé");
            } catch (err) {
              console.error("[TrustIndex] Erreur lors du chargement du widget:", err);
              setError(true);
              setLoading(false);
            }
          } else {
            console.log("[TrustIndex] TrustindexLoader pas encore disponible, nouvelle tentative...");
            setTimeout(checkAndLoad, 200);
          }
        };
        
        // Première tentative après 500ms
        setTimeout(checkAndLoad, 500);
        
        // Timeout de sécurité après 5 secondes
        setTimeout(() => {
          if (loading) {
            console.warn("[TrustIndex] Timeout - Le widget n'a pas pu se charger");
            setError(true);
            setLoading(false);
          }
        }, 5000);
      };
      
      script.onerror = () => {
        console.error("[TrustIndex] Erreur lors du chargement du script Trust Index");
        setError(true);
        setLoading(false);
      };
      
      document.head.appendChild(script);
      console.log("[TrustIndex] Script ajouté au DOM");
    };

    // Charger Trust Index après un court délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      loadTrustIndex();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [loading]);

  // Script inline pour forcer le chargement après le rendu (uniquement côté client)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initTrustIndex = () => {
      if (typeof (window as any).TrustindexLoader !== 'undefined') {
        console.log('[TrustIndex] TrustindexLoader trouvé dans script inline');
        try {
          (window as any).TrustindexLoader.load();
        } catch (e) {
          console.error('[TrustIndex] Erreur dans script inline:', e);
        }
      } else {
        console.log('[TrustIndex] TrustindexLoader pas encore disponible dans script inline');
      }
    };

    // Exécuter le script inline après un délai
    const scriptTimer = setTimeout(() => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTrustIndex);
      } else {
        initTrustIndex();
      }

      window.addEventListener('load', initTrustIndex);
    }, 500);

    return () => {
      clearTimeout(scriptTimer);
    };
  }, []);

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
        
        {/* Widget Trust Index - Format pour no-registration=google */}
        <div
          ref={widgetRef}
          className="trustindex-widget"
          data-no-registration="google"
          style={{ 
            minHeight: "300px",
            width: "100%",
            display: "block"
          }}
        >
          {loading && !error && (
            <div className="text-center text-gray-500 py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6A664] mb-4"></div>
              <p>Chargement des avis Google...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Les avis Google ne peuvent pas être affichés pour le moment.
              </p>
              <p className="text-sm text-gray-500">
                Pour afficher les avis, vous devez configurer Trust Index avec votre profil Google Business.
                <br />
                Contactez le support Trust Index pour obtenir votre <code className="bg-gray-100 px-2 py-1 rounded">location-id</code> ou <code className="bg-gray-100 px-2 py-1 rounded">widget-id</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

