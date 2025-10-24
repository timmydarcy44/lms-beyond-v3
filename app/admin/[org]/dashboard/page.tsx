import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getSingleOrg } from '@/lib/org-single';
import { Rail } from '@/components/cine/Rail';
import { CardPoster } from '@/components/cine/CardPoster';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  
  if (!user) redirect('/login/admin');
  
  const { orgId } = await getSingleOrg();
  
  const { data: formations } = await sb
    .from('formations')
    .select('id,title,cover_url,updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  const { data: pathways } = await sb
    .from('pathways')
    .select('id,title,cover_url,updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  const handleFormationClick = (id: string) => {
    window.location.href = `/admin/formations/${id}`;
  };

  const handlePathwayClick = (id: string) => {
    window.location.href = `/admin/parcours/${id}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text">Dashboard</h2>
        <p className="text-muted mt-1">Vue d'ensemble de votre organisation</p>
      </div>

      {/* Formations récentes */}
      {formations && formations.length > 0 && (
        <Rail title="Formations récentes">
          {formations.slice(0, 6).map((formation) => (
            <CardPoster
              key={formation.id}
              title={formation.title}
              subtitle={`Mis à jour ${new Date(formation.updated_at).toLocaleDateString()}`}
              coverUrl={formation.cover_url || undefined}
              onClick={() => handleFormationClick(formation.id)}
            />
          ))}
        </Rail>
      )}

      {/* Parcours récents */}
      {pathways && pathways.length > 0 && (
        <Rail title="Parcours récents">
          {pathways.slice(0, 6).map((pathway) => (
            <CardPoster
              key={pathway.id}
              title={pathway.title}
              subtitle={`Mis à jour ${new Date(pathway.updated_at).toLocaleDateString()}`}
              coverUrl={pathway.cover_url || undefined}
              onClick={() => handlePathwayClick(pathway.id)}
            />
          ))}
        </Rail>
      )}

      {/* État vide */}
      {(!formations || formations.length === 0) && (!pathways || pathways.length === 0) && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="text-muted">
            <h3 className="text-lg font-medium mb-2">Aucun contenu</h3>
            <p>Créez votre première formation ou parcours pour commencer.</p>
          </div>
        </div>
      )}
    </div>
  );
}