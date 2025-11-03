export default async function handler(req, res) {
  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-private',
    'user-read-email'
  ].join(' ');

  const url = new URL('https://accounts.spotify.com/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.SPOTIFY_CLIENT_ID);
  url.searchParams.set('scope', scopes);
  url.searchParams.set('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);
  url.searchParams.set('state', Math.random().toString(36).slice(2));

  res.redirect(url.toString());
}
