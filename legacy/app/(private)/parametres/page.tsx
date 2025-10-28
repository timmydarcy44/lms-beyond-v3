import { Settings, User, Upload } from "lucide-react";
import { createSupabaseServerClient, requireUser } from "@/lib/supabase/server";

export default async function ParametresPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Récupérer le profil utilisateur
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user!.id)
    .single();

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-[#5B7CFF]" />
        <h1 className="text-3xl font-extrabold text-white">Paramètres</h1>
      </div>

      <div className="max-w-2xl">
        <div className="bg-[#0F1522] rounded-2xl border border-white/5 p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <User size={20} />
            Profil utilisateur
          </h2>

          <form className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5B7CFF] to-[#B15BFF] flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {profile?.first_name?.[0] || user?.email?.[0] || "?"}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Photo de profil</label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  <Upload size={16} />
                  Changer
                </label>
              </div>
            </div>

            {/* Prénom */}
            <div>
              <label className="block text-sm text-white/80 mb-2">Prénom</label>
              <input
                type="text"
                defaultValue={profile?.first_name || ""}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#5B7CFF]/50"
                placeholder="Votre prénom"
              />
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm text-white/80 mb-2">Nom</label>
              <input
                type="text"
                defaultValue={profile?.last_name || ""}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#5B7CFF]/50"
                placeholder="Votre nom"
              />
            </div>

            {/* Email (lecture seule) */}
            <div>
              <label className="block text-sm text-white/80 mb-2">E-mail</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white/60 cursor-not-allowed"
              />
              <p className="text-xs text-white/40 mt-1">L'e-mail ne peut pas être modifié</p>
            </div>

            {/* Bouton de sauvegarde */}
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#5B7CFF] to-[#B15BFF] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Sauvegarder les modifications
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
