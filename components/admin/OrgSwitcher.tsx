// components/admin/OrgSwitcher.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, Building2 } from 'lucide-react';

interface Organization {
  id: string;
  slug: string;
  name: string;
}

export default function OrgSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Extraire l'organisation actuelle depuis l'URL
  useEffect(() => {
    const orgSlug = pathname.split('/')[2]; // /admin/[org]/...
    if (orgSlug && orgSlug !== 'admin') {
      setCurrentOrg({ slug: orgSlug, id: '', name: orgSlug });
    }
  }, [pathname]);

  // Charger les organisations
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/org/list');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations || []);
          
          // Définir l'organisation actuelle si pas encore définie
          if (!currentOrg && data.organizations?.length > 0) {
            const orgSlug = pathname.split('/')[2];
            const found = data.organizations.find((org: Organization) => org.slug === orgSlug);
            if (found) {
              setCurrentOrg(found);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, [pathname, currentOrg]);

  const handleOrgChange = (org: Organization) => {
    // Construire la nouvelle URL en gardant la page actuelle
    const pathParts = pathname.split('/');
    pathParts[2] = org.slug; // Remplacer l'org dans l'URL
    const newPath = pathParts.join('/');
    
    setCurrentOrg(org);
    setIsOpen(false);
    router.push(newPath);
  };

  if (loading || !currentOrg) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
        <Building2 size={16} className="text-neutral-400" />
        <span className="text-sm text-neutral-400">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
      >
        <Building2 size={16} className="text-white" />
        <span className="text-sm text-white font-medium">{currentOrg.name}</span>
        <ChevronDown size={14} className="text-neutral-400" />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                Organisations
              </div>
              
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrgChange(org)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    org.slug === currentOrg.slug
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <Building2 size={16} className="text-neutral-400" />
                  <div>
                    <div className="text-sm font-medium">{org.name}</div>
                    <div className="text-xs text-neutral-400">{org.slug}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
