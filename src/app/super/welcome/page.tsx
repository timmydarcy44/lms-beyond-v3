"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirstName } from "@/lib/utils/user-name";

export default function SuperWelcomePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const session = await response.json();
          if (session?.fullName || session?.email) {
            const displayName = getFirstName(session.fullName, session.email);
            setFirstName(displayName);
            setIsLoading(false);
            
            // Animation d'apparition après un court délai
            setTimeout(() => {
              setShowContent(true);
            }, 200);
            
            // Transition et redirection
            setTimeout(() => {
              setIsTransitioning(true);
              setTimeout(() => {
                router.push("/super");
              }, 600);
            }, 1800);
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("[super-welcome] Error fetching session:", error);
        router.push("/login");
      }
    };

    fetchUserInfo();
  }, [router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center" />
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      {/* Fond avec gradient subtil style Apple */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
      
      {/* Contenu centré - Style Apple */}
      <div 
        className={`relative z-10 text-center transition-all duration-1000 ease-out ${
          showContent 
            ? (isTransitioning 
                ? "opacity-0 translate-y-[-30px] scale-[0.98]" 
                : "opacity-100 translate-y-0 scale-100")
            : "opacity-0 translate-y-[-10px]"
        }`}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
      >
        <h1 
          className="text-[72px] md:text-[96px] font-[350] text-gray-900 tracking-[-0.03em] leading-[1.05] mb-2"
          style={{ 
            fontWeight: 300,
            letterSpacing: '-0.03em'
          }}
        >
          Bonjour
        </h1>
        {firstName && (
          <p 
            className="text-[56px] md:text-[72px] font-[350] text-gray-600 tracking-[-0.02em] leading-[1.05] mt-1"
            style={{ 
              fontWeight: 300,
              letterSpacing: '-0.02em'
            }}
          >
            {firstName}
          </p>
        )}
      </div>
    </div>
  );
}

