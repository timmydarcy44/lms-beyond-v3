import { GamificationVideoUploader } from "@/components/super-admin/gamification-video-uploader";

export default function GamificationVideosPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Gestion des Vidéos</h1>
        <p className="text-white/70">Upload et gestion des vidéos pour la gamification</p>
      </div>
      
      <GamificationVideoUploader />
    </div>
  );
}







