import { getCurrentOrg } from '@/lib/org';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Users, BookOpen, GraduationCap, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const org = await getCurrentOrg();

  if (!org) {
    // Pas d'org → propose un onboarding simple
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-iris-grad">Bienvenue</h2>
          <p className="mt-2 opacity-80">
            Aucune organisation détectée pour votre compte. Créez-en une pour commencer.
          </p>
          <Link href="/admin/settings" className="btn-cta-lg mt-4 inline-flex">Créer mon organisation</Link>
        </div>
      </div>
    );
  }

  // Mock data pour l'instant - à remplacer par de vraies requêtes
  const stats = {
    formateurs: 12,
    tuteurs: 8,
    apprenants: 156,
    formations: 24,
  };

  const recentActivity = [
    { id: '1', action: 'Nouvelle formation créée', user: 'Marie Dubois', time: 'Il y a 2h' },
    { id: '2', action: 'Utilisateur inscrit', user: 'Jean Martin', time: 'Il y a 4h' },
    { id: '3', action: 'Formation publiée', user: 'Sophie Leroy', time: 'Il y a 6h' },
    { id: '4', action: 'Test complété', user: 'Pierre Durand', time: 'Il y a 8h' },
    { id: '5', action: 'Ressource ajoutée', user: 'Anna Petit', time: 'Il y a 12h' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de bord"
        subtitle={`Vue d'ensemble de ${org.name || 'l\'organisation'}`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Formateurs"
          value={stats.formateurs}
          icon="users"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Tuteurs"
          value={stats.tuteurs}
          icon="users"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Apprenants"
          value={stats.apprenants}
          icon="graduation-cap"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Formations"
          value={stats.formations}
          icon="book-open"
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activité récente */}
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Activité récente</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                <div>
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-white/70 text-sm">{activity.user}</p>
                </div>
                <span className="text-white/50 text-sm">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Accès rapides */}
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Accès rapides</h3>
          <div className="space-y-3">
            <Link
              href="/admin/formations/new"
              className="flex items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
            >
              <div className="p-2 bg-iris-500/20 rounded-lg mr-4">
                <BookOpen className="h-5 w-5 text-iris-400" />
              </div>
              <div>
                <p className="font-medium text-white group-hover:text-iris-300">Créer une formation</p>
                <p className="text-sm text-white/70">Nouvelle formation interactive</p>
              </div>
            </Link>

            <Link
              href="/admin/utilisateurs"
              className="flex items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
            >
              <div className="p-2 bg-blush-500/20 rounded-lg mr-4">
                <Users className="h-5 w-5 text-blush-400" />
              </div>
              <div>
                <p className="font-medium text-white group-hover:text-blush-300">Inviter un formateur</p>
                <p className="text-sm text-white/70">Ajouter un nouvel instructeur</p>
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
            >
              <div className="p-2 bg-white/10 rounded-lg mr-4">
                <FileText className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <p className="font-medium text-white">Paramètres</p>
                <p className="text-sm text-white/70">Configuration de l'organisation</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
