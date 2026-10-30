import { notFound } from "next/navigation";
import { loadPublicProfile } from "@/lib/cfa/profile-share";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { ProfileAnswer } from "./profile-answer";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getServiceRoleClient();
  if (!db) notFound();
  const profile = await loadPublicProfile(db, token);
  if (!profile) notFound();

  return (
    <main className="min-h-screen bg-[#F6F4EF] px-4 py-10 text-[#1A0C04]">
      <article className="mx-auto max-w-xl rounded-[28px] bg-white p-6 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6E5BFF]">Profil Byound School</p>
        <h1 className="mt-2 text-3xl font-extrabold">{profile.firstName} {profile.lastName}</h1>
        <p className="mt-2 text-sm">{profile.cursus} · {profile.availability}</p>
        {profile.expired ? <p className="mt-6 text-sm">Ce lien a expiré.</p> : null}
        {!profile.expired && profile.motivation ? <p className="mt-6 text-sm leading-6">{profile.motivation}</p> : null}
        {!profile.expired && profile.strengths.length ? (
          <div className="mt-6">
            <p className="text-sm font-extrabold">Soft skills partagées</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {profile.strengths.map((skill) => <li key={skill} className="rounded-full bg-[#E7F8F2] px-3 py-1 text-xs font-extrabold text-[#04140C]">{skill}</li>)}
            </ul>
          </div>
        ) : null}
        {!profile.expired && profile.idmc != null ? <p className="mt-4 text-sm">IDMC partagé : {profile.idmc}/100</p> : null}
        {!profile.expired && profile.disc ? <p className="mt-2 text-sm">DISC partagé : {profile.disc}</p> : null}
        {!profile.expired && profile.cvUrl ? <a className="mt-4 inline-block text-sm font-extrabold text-[#6E5BFF]" href={profile.cvUrl}>Voir le CV</a> : null}
        {!profile.expired ? <ProfileAnswer token={token} response={profile.response} /> : null}
      </article>
    </main>
  );
}
