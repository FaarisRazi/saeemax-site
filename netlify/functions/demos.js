// Returns Faaris Builds' YouTube videos whose title contains " - Make Demo",
// newest first, with that suffix stripped for display. Runs server-side so
// the landing page never needs to store these video files itself, and so
// the API key never reaches the browser.
//
// One-time setup required in the Netlify dashboard:
//   Site settings -> Environment variables -> add YOUTUBE_API_KEY
//   (a free YouTube Data API v3 key from console.cloud.google.com — no
//   billing needed, the default 10,000 units/day quota is far more than
//   this needs). Until that's set, the site falls back to a small static
//   list baked into script.js, so nothing breaks in the meantime.

const CHANNEL_ID = 'UCAIO9iCr9i_A67xLn6VK5iw'; // Faaris Builds
const UPLOADS_PLAYLIST_ID = 'UU' + CHANNEL_ID.slice(2);
const MARKER = ' - Make Demo';

// Drops the trailing hashtag block YouTube descriptions usually end with
// (and the blank line before it), leaving just the written caption.
function stripTrailingHashtags(text) {
  const lines = (text || '').split('\n');
  while (lines.length && /^(\s*#\S+)+\s*$/.test(lines[lines.length - 1])) {
    lines.pop();
  }
  while (lines.length && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
  return lines.join('\n').trim();
}

exports.handler = async function () {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'YOUTUBE_API_KEY is not set in Netlify environment variables.' }),
    };
  }

  try {
    let items = [];
    let pageToken = '';
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${UPLOADS_PLAYLIST_ID}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'YouTube API request failed');
      items = items.concat(data.items || []);
      pageToken = data.nextPageToken;
    } while (pageToken && items.length < 200);

    const demos = items
      .filter((v) => v.snippet && v.snippet.title && v.snippet.title.includes(MARKER))
      .map((v) => ({
        videoId: v.snippet.resourceId.videoId,
        title: v.snippet.title.split(MARKER).join('').trim(),
        description: stripTrailingHashtags(v.snippet.description),
        publishedAt: v.snippet.publishedAt,
      }))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
      body: JSON.stringify(demos),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
