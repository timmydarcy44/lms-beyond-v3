"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Folder, ArrowLeft } from "lucide-react";

interface FolderItem {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
}

export default function BeyondNoteFoldersPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/nevo/folders");
        if (!res.ok) return;
        const data = await res.json();
        setFolders(data.folders || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#0F1117]">
      <div className="bg-white border-b border-[#E8E9F0] px-6 py-5 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/beyond-note-app")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Mes dossiers</h1>
      </div>

      <div className="px-6 py-6">
        {loading ? (
          <div className="text-sm text-[#6B7280]">Chargement...</div>
        ) : folders.length === 0 ? (
          <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-8 text-center">
            <Folder className="h-10 w-10 mx-auto mb-4 text-[#9CA3AF]" />
            <p className="text-[#0F1117] font-medium mb-2">Aucun dossier</p>
            <p className="text-[#9CA3AF] text-sm">Créez votre premier dossier depuis la bibliothèque.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/beyond-note-app?folder=${folder.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-2xl flex items-center justify-center text-white"
                    style={{ background: folder.color || "#6D28D9" }}
                  >
                    {folder.emoji || "📁"}
                  </div>
                  <div>
                    <p className="font-medium">{folder.name}</p>
                    <p className="text-xs text-[#9CA3AF]">Dossier</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
