"use client";

import { useMemo, useState } from "react";
import { Eye, X } from "lucide-react";
import "katex/dist/katex.min.css";
import { renderMarkdown } from "@/components/beyond-note/beyond-note-document-page";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
};

type DocumentRow = {
  id: string;
  user_id: string | null;
  file_name: string | null;
  file_url: string | null;
  created_at: string | null;
};

type TransformationRow = {
  id: string;
  user_id: string | null;
  action: string | null;
  result: string | null;
  created_at: string | null;
  document_id: string | null;
};

type ActivityLogRow = {
  id: string;
  user_id: string | null;
  action_type: string | null;
  transformation_type: string | null;
  result_preview: string | null;
  result_url: string | null;
  created_at: string | null;
};

type PilotageClientProps = {
  profiles: ProfileRow[];
  recentConnections: ProfileRow[];
  documents: DocumentRow[];
  transformations: TransformationRow[];
  activityLogs: ActivityLogRow[];
  lastVisit: string | null;
  lastLogin: string | null;
  favoriteTransformation: string;
  trialUsersCount: number;
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("fr-FR") : "—";

const formatDay = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const formatTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "—";

const slicePreview = (value?: string | null, max = 140) => {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

const getDisplayName = (profile?: ProfileRow | null) =>
  profile?.full_name ||
  [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
  profile?.email ||
  "—";

const getInitials = (profile?: ProfileRow | null) => {
  const name = getDisplayName(profile);
  const parts = name.split(" ").filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "N";
};

const normalizeType = (action?: string | null) => {
  const value = (action || "").toLowerCase();
  if (value.includes("quiz")) return "Quiz";
  if (value.includes("audio")) return "Audio";
  if (value.includes("diagram") || value.includes("schema")) return "Diagramme";
  return "Fiche";
};

export default function PilotageClient({
  profiles,
  recentConnections,
  documents,
  transformations,
  activityLogs,
  lastVisit,
  lastLogin,
  favoriteTransformation,
  trialUsersCount,
}: PilotageClientProps) {
  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles]);
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [selectedTransformation, setSelectedTransformation] = useState<TransformationRow | null>(null);

  const userDocuments = selectedUser
    ? documents.filter((doc) => doc.user_id === selectedUser.id)
    : [];
  const userTransformations = selectedUser
    ? transformations.filter((item) => item.user_id === selectedUser.id)
    : [];
  const userLogs = selectedUser ? activityLogs.filter((log) => log.user_id === selectedUser.id) : [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Dernière visite",
            value: lastVisit ? formatDate(lastVisit) : "—",
          },
          {
            label: "Dernière connexion",
            value: lastLogin ? formatDate(lastLogin) : "—",
          },
          {
            label: "Transformation préférée",
            value: favoriteTransformation,
          },
          {
            label: "MRR / ARR",
            value: "0€ / 0€",
          },
          {
            label: "Utilisateurs en test",
            value: String(trialUsersCount),
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Flux de connexions</h2>
        <div className="mt-4 space-y-2">
          {recentConnections.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setSelectedUser(profile)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm text-slate-700 hover:bg-gray-100"
            >
              <span className="font-medium">{getDisplayName(profile)}</span>
              <span className="text-slate-500">
                {formatDay(profile.last_sign_in_at)} à {formatTime(profile.last_sign_in_at)}
              </span>
            </button>
          ))}
          {recentConnections.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune connexion récente.</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Derniers documents uploadés</h2>
          <div className="mt-4 space-y-3">
            {(documents || []).map((doc) => {
              const profile = doc.user_id ? profileById.get(doc.user_id) : null;
              return (
                <div key={doc.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs uppercase text-slate-400">{formatDate(doc.created_at)}</div>
                  <div className="mt-1 text-sm">{doc.file_name || "Document"}</div>
                  <div className="mt-1 text-xs text-slate-500">{getDisplayName(profile)}</div>
                  {doc.file_url ? (
                    <a
                      className="mt-2 inline-flex text-xs text-orange-600 hover:text-orange-500"
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ouvrir le fichier
                    </a>
                  ) : null}
                </div>
              );
            })}
            {documents?.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun document récent.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dernières transformations</h2>
          <div className="mt-4 space-y-3">
            {(transformations || []).map((item) => {
              const type = normalizeType(item.action);
              const preview =
                type === "Diagramme" ? "Aperçu du diagramme" : slicePreview(item.result, 240);
              const profile = item.user_id ? profileById.get(item.user_id) : null;
              return (
                <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase text-slate-400">{formatDate(item.created_at)}</div>
                      <div className="mt-1 text-sm font-medium text-slate-800">Type: {type}</div>
                      <div className="mt-1 text-xs text-slate-500">{getDisplayName(profile)}</div>
                      <div className="mt-2 text-sm text-slate-600">
                        {type === "Diagramme" ? (
                          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-500">
                            {preview}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                            {renderMarkdown(preview || "—", false)}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTransformation(item)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-500 hover:text-slate-700"
                      aria-label="Visualiser"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {transformations?.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune transformation récente.</p>
            ) : null}
          </div>
        </div>
      </section>

      {selectedUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase text-slate-400">Fiche client</div>
                <h3 className="text-xl font-semibold text-slate-900">{getDisplayName(selectedUser)}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
                Fermer
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[auto,1fr]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-600">
                {getInitials(selectedUser)}
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-600">{selectedUser.email}</div>
                <div className="text-xs text-slate-400">
                  Créé le {formatDate(selectedUser.created_at)} · Dernière connexion{" "}
                  {formatDate(selectedUser.last_sign_in_at)}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Documents uploadés</h4>
                <div className="mt-3 space-y-2">
                  {userDocuments.map((doc) => (
                    <div key={doc.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="text-xs text-slate-400">{formatDate(doc.created_at)}</div>
                      <div className="text-sm text-slate-700">{doc.file_name || "Document"}</div>
                      {doc.file_url ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex text-xs text-orange-600 hover:text-orange-500"
                        >
                          Ouvrir le fichier
                        </a>
                      ) : null}
                    </div>
                  ))}
                  {userDocuments.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucun document.</p>
                  ) : null}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-800">Transformations</h4>
                <div className="mt-3 space-y-2">
                  {userTransformations.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="text-xs text-slate-400">{formatDate(item.created_at)}</div>
                      <div className="text-sm text-slate-700">Type: {normalizeType(item.action)}</div>
                      <div className="text-xs text-slate-500">{slicePreview(item.result, 120)}</div>
                    </div>
                  ))}
                  {userTransformations.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune transformation.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-800">Historique d'activités</h4>
              <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-2">
                {userLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="text-xs text-slate-400">{formatDate(log.created_at)}</div>
                    <div className="text-sm text-slate-700">
                      {log.action_type || "activité"} • {log.transformation_type || "—"}
                    </div>
                    <div className="text-xs text-slate-500">{slicePreview(log.result_preview, 120)}</div>
                  </div>
                ))}
                {userLogs.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune activité.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedTransformation ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setSelectedTransformation(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase text-slate-400">Transformation</div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {normalizeType(selectedTransformation.action)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransformation(null)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
                Fermer
              </button>
            </div>
            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-slate-700">
              {renderMarkdown(selectedTransformation.result || "Aucun contenu", false)}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
