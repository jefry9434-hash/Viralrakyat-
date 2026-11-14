import { getVideoUrl } from "../lib/supabase.js";

export default function VideoPreview({ filePath, title }) {
  return (
    <video
      className="video-preview"
      src={getVideoUrl(filePath)}
      controls
      preload="metadata"
      playsInline
      aria-label={`Video ${title}`}
    />
  );
}
