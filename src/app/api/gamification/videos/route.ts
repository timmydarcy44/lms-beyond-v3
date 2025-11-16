import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * GET - Récupère la liste des vidéos de gamification
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const videoType = searchParams.get("video_type"); // journalist, player, background, other
    const scenarioContext = searchParams.get("scenario_context"); // media-training-psg, etc.

    let query = supabase
      .from("gamification_videos")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (videoType) {
      query = query.eq("video_type", videoType);
    }

    if (scenarioContext) {
      query = query.eq("scenario_context", scenarioContext);
    }

    const { data, error } = await query;
    
    console.log("[api/gamification/videos] Query params:", { videoType, scenarioContext });
    console.log("[api/gamification/videos] Videos found:", data?.length || 0);
    
    // Corriger les URLs si elles contiennent un placeholder
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (data && supabaseUrl) {
      data.forEach((video: any) => {
        if (video.public_url && (
          video.public_url.includes('your_supabase_project_id') || 
          video.public_url.includes('YOUR_SUPABASE_PROJECT_ID')
        )) {
          const bucketName = video.storage_bucket || 'gamification-videos';
          const encodedPath = encodeURIComponent(video.storage_path);
          video.public_url = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${encodedPath}`;
          console.log("[api/gamification/videos] Fixed URL for video:", video.id, video.public_url);
        }
      });
    }
    
    if (data && data.length > 0) {
      console.log("[api/gamification/videos] First video:", {
        id: data[0].id,
        title: data[0].title,
        video_type: data[0].video_type,
        public_url: data[0].public_url,
        storage_path: data[0].storage_path,
      });
    }

    if (error) {
      console.error("[gamification/videos] Error fetching videos:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("[gamification/videos] Unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

