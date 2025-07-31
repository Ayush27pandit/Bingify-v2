export function getEmbeddedYoutubeUrl(inputUrl: string): string | null {
  try {
    const url = new URL(inputUrl);

    // Handle regular YouTube links
    if (url.hostname.includes("youtube.com") && url.pathname === "/watch") {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    // Handle short links
    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}
