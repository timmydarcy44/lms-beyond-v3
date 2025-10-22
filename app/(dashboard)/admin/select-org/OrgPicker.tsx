// app/(dashboard)/admin/select-org/OrgPicker.tsx - Netflix-style organization picker
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, LogOut } from 'lucide-react';

interface Organization {
  id: string;
  slug: string;
  name: string;
  cover_url?: string;
}

interface OrgPickerProps {
  organizations: Organization[];
}

export default function OrgPicker({ organizations }: OrgPickerProps) {
  const router = useRouter();
  const [hoveredOrg, setHoveredOrg] = useState<string | null>(null);

  const handleOrgSelect = (org: Organization) => {
    router.push('/admin/dashboard');
  };

  const handleSignOut = async () => {
    // Import dynamique pour éviter les erreurs SSR
    const { supabaseBrowser } = await import('@/lib/supabase/client');
    const sb = supabaseBrowser();
    await sb.auth.signOut();
    router.push('/login/admin');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-blue-500',
      'from-teal-500 to-green-500',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-8">
      {/* Grille des organisations */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {organizations.map((org, index) => (
          <div
            key={org.id}
            className="group cursor-pointer"
            onClick={() => handleOrgSelect(org)}
            onMouseEnter={() => setHoveredOrg(org.id)}
            onMouseLeave={() => setHoveredOrg(null)}
          >
            {/* Carte organisation */}
            <div className={`
              relative w-full aspect-square rounded-2xl overflow-hidden
              transition-all duration-300 ease-out
              ${hoveredOrg === org.id 
                ? 'scale-105 shadow-2xl shadow-blue-500/20' 
                : 'scale-100 hover:scale-102'
              }
              bg-gradient-to-br ${getGradient(index)}
              border border-white/10
              group-hover:border-white/20
            `}>
              {/* Image de couverture ou placeholder */}
              {org.cover_url ? (
                <img
                  src={org.cover_url}
                  alt={org.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <span className="text-2xl font-bold text-white">
                        {getInitials(org.name)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay au hover */}
              <div className={`
                absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity duration-300
                flex items-end p-4
              `}>
                <div className="text-white">
                  <div className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Accéder à {org.name}
                  </div>
                </div>
              </div>

              {/* Effet de brillance au hover */}
              <div className={`
                absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                -translate-x-full group-hover:translate-x-full transition-transform duration-700
                ${hoveredOrg === org.id ? 'translate-x-full' : ''}
              `} />
            </div>

            {/* Titre sous la carte */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                {org.name}
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                Organisation
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="text-center pt-8 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-6 py-3 text-neutral-400 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
