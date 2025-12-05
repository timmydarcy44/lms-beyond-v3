"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Mail, Calendar, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export function FixPurchasesClient() {
  const [email, setEmail] = useState("");
  const [daysBack, setDaysBack] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/fix-past-purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_email: email,
          days_back: daysBack,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la correction des achats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/super/gestion-client">
        <Button
          variant="ghost"
          className="mb-4"
          style={{ color: "#C6A664" }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </Link>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 p-6 space-y-6" style={{ borderColor: "#E6D9C6" }}>
        <div className="space-y-2">
          <Label htmlFor="email" style={{ color: "#2F2A25" }}>
            Email de l'utilisateur
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#C6A664" }} />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              required
              className="pl-10"
              style={{ borderColor: "#E6D9C6" }}
            />
          </div>
          <p className="text-xs" style={{ color: "#2F2A25", opacity: 0.6 }}>
            L'email utilisé lors de l'achat sur Stripe
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="daysBack" style={{ color: "#2F2A25" }}>
            Nombre de jours en arrière
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#C6A664" }} />
            <Input
              id="daysBack"
              type="number"
              value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value) || 30)}
              min={1}
              max={365}
              className="pl-10"
              style={{ borderColor: "#E6D9C6" }}
            />
          </div>
          <p className="text-xs" style={{ color: "#2F2A25", opacity: 0.6 }}>
            Rechercher les achats sur les X derniers jours (défaut: 30)
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-full px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          style={{
            backgroundColor: "#C6A664",
            color: "white",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            "Corriger les achats passés"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Erreur</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Traitement terminé</AlertTitle>
            <AlertDescription className="text-green-700">
              {result.message}
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-2xl border-2 p-6" style={{ borderColor: "#E6D9C6" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "#2F2A25" }}>Résumé</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl p-4 border-2" style={{ borderColor: "#E6D9C6", backgroundColor: "#F8F5F0" }}>
                <div className="text-2xl font-bold" style={{ color: "#2F2A25" }}>{result.summary.total_sessions}</div>
                <div className="text-sm" style={{ color: "#2F2A25", opacity: 0.7 }}>Sessions trouvées</div>
              </div>
              <div className="rounded-xl p-4 border-2" style={{ borderColor: "#10b981", backgroundColor: "#F0FDF4" }}>
                <div className="text-2xl font-bold text-green-600">{result.summary.granted}</div>
                <div className="text-sm text-green-700">Accès accordés</div>
              </div>
              <div className="rounded-xl p-4 border-2" style={{ borderColor: "#3b82f6", backgroundColor: "#EFF6FF" }}>
                <div className="text-2xl font-bold text-blue-600">{result.summary.already_exists}</div>
                <div className="text-sm text-blue-700">Déjà existants</div>
              </div>
              <div className="rounded-xl p-4 border-2" style={{ borderColor: "#ef4444", backgroundColor: "#FEF2F2" }}>
                <div className="text-2xl font-bold text-red-600">{result.summary.errors}</div>
                <div className="text-sm text-red-700">Erreurs</div>
              </div>
            </div>
          </div>

          {result.results && result.results.length > 0 && (
            <div className="bg-white rounded-2xl border-2 p-6" style={{ borderColor: "#E6D9C6" }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "#2F2A25" }}>Détails des actions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.results.map((item: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 ${
                      item.status === "granted"
                        ? "bg-green-50 border-green-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium" style={{ color: "#2F2A25" }}>
                          Session: {item.session_id?.substring(0, 20)}...
                        </div>
                        <div className="text-xs mt-1" style={{ color: "#2F2A25", opacity: 0.6 }}>
                          Item: {item.catalog_item_id?.substring(0, 20)}...
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === "granted"
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {item.status === "granted" ? "Accès accordé" : "Déjà existant"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className="bg-white rounded-2xl border-2 p-6" style={{ borderColor: "#ef4444" }}>
              <h3 className="text-lg font-semibold mb-4 text-red-600">Erreurs</h3>
              <div className="space-y-2">
                {result.errors.map((err: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-red-50 border-2 border-red-200">
                    <div className="text-sm text-red-800">
                      Session: {err.session_id || "N/A"}
                    </div>
                    <div className="text-xs text-red-600 mt-1">{err.error}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

