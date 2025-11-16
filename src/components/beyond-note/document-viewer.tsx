"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

interface DocumentViewerProps {
  documentUrl: string;
  extractedText: string;
  documentId: string | null;
}

export function DocumentViewer({ documentUrl, extractedText, documentId }: DocumentViewerProps) {
  const [viewMode, setViewMode] = useState<"image" | "text">("image");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Document
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "image" ? "text" : "image")}
            >
              <Eye className="h-4 w-4 mr-2" />
              {viewMode === "image" ? "Voir le texte" : "Voir l'image"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement("a");
                link.href = documentUrl;
                link.download = "document";
                link.click();
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "image" | "text")}>
          <TabsList className="mb-4">
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="text">Texte extrait</TabsTrigger>
          </TabsList>
          <TabsContent value="image" className="mt-0">
            <div className="relative w-full min-h-[400px] max-h-[600px] bg-gray-100 rounded-lg overflow-auto flex items-center justify-center p-4">
              <img
                src={documentUrl}
                alt="Document scanné"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </TabsContent>
          <TabsContent value="text" className="mt-0">
            <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                {extractedText || "Aucun texte extrait"}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

