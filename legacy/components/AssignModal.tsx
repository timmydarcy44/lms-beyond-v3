"use client";
import { useState } from "react";
import { X, Search, User, Users, Layers } from "lucide-react";

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  kind: "user" | "group" | "pathway";
}

export function AssignModal({ isOpen, onClose, formationId, kind }: AssignModalProps) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  // Mock data - à remplacer par de vraies données
  const mockData = {
    user: [
      { id: "1", name: "Jean Dupont", email: "jean@example.com" },
      { id: "2", name: "Marie Martin", email: "marie@example.com" },
      { id: "3", name: "Pierre Durand", email: "pierre@example.com" },
    ],
    group: [
      { id: "1", name: "Développeurs Frontend", count: 12 },
      { id: "2", name: "Designers UX/UI", count: 8 },
      { id: "3", name: "Product Managers", count: 5 },
    ],
    pathway: [
      { id: "1", name: "Formation React", description: "Parcours complet React" },
      { id: "2", name: "Formation Node.js", description: "Backend avec Node.js" },
      { id: "3", name: "Formation DevOps", description: "Déploiement et CI/CD" },
    ]
  };

  const filteredData = mockData[kind].filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selected) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          targetId: selected,
          formationId
        })
      });
      
      const json = await res.json();
      
      if (json.ok) {
        alert(`Formation assignée avec succès !`);
        onClose();
      } else {
        alert(`Erreur: ${json.error}`);
      }
    } catch (error) {
      console.error("Assignment error:", error);
      alert("Erreur lors de l'assignation");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getIcon = () => {
    switch (kind) {
      case "user": return <User className="w-5 h-5" />;
      case "group": return <Users className="w-5 h-5" />;
      case "pathway": return <Layers className="w-5 h-5" />;
    }
  };

  const getTitle = () => {
    switch (kind) {
      case "user": return "Assigner à un apprenant";
      case "group": return "Assigner à un groupe";
      case "pathway": return "Assigner à un parcours";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0E0E0E] border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-lg font-semibold text-white">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder={`Rechercher ${kind === "user" ? "un apprenant" : kind === "group" ? "un groupe" : "un parcours"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-60 overflow-y-auto">
          {filteredData.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item.id)}
              className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                selected === item.id ? "bg-indigo-500/20 border-l-2 border-indigo-500" : ""
              }`}
            >
              <div className="text-white font-medium">{item.name}</div>
              {kind === "user" && "email" in item && (
                <div className="text-sm text-white/60">{item.email}</div>
              )}
              {kind === "group" && "count" in item && (
                <div className="text-sm text-white/60">{item.count} membres</div>
              )}
              {kind === "pathway" && "description" in item && (
                <div className="text-sm text-white/60">{item.description}</div>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || loading}
            className="flex-1 px-4 py-3 rounded-lg btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Assignation..." : "Assigner"}
          </button>
        </div>
      </div>
    </div>
  );
}



