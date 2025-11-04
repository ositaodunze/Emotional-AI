export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Missing code');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
  });

  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const tokens = await r.json();

  const home = new URL('/', `https://${req.headers.host}`);
  if (tokens.access_token) home.hash = `access_token=${tokens.access_token}`;
  res.redirect(home.toString());
}
