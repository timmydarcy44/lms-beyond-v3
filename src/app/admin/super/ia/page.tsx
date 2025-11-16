import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Edit2, Save, X, History, FileText } from "lucide-react";
import { AIInteractionsManager } from "@/components/super-admin/ai-interactions-manager";

export default async function SuperAdminIAPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-yellow-400" />
            Gestion de l'IA
          </h1>
          <p className="text-white/60 text-sm">
            Gérez les prompts et consultez l'historique des interactions avec l'IA
          </p>
        </div>
      </div>

      <AIInteractionsManager />
    </div>
  );
}


