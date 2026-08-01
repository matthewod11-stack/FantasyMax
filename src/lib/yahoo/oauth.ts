const YAHOO_CALLBACK_PATH = '/api/auth/yahoo/callback';

function parseHttpsUrl(value: string, name: string): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }

  const isLocalHttp =
    url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

  if (url.protocol !== 'https:' && !isLocalHttp) {
    throw new Error(`${name} must use HTTPS outside local development`);
  }

  return url;
}

export function getCanonicalAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    throw new Error('NEXT_PUBLIC_APP_URL is required');
  }

  return parseHttpsUrl(configured, 'NEXT_PUBLIC_APP_URL').origin;
}

export function getYahooRedirectUri(): string {
  const configured = process.env.YAHOO_REDIRECT_URI?.trim();

  if (configured) {
    const url = parseHttpsUrl(configured, 'YAHOO_REDIRECT_URI');
    if (url.pathname !== YAHOO_CALLBACK_PATH || url.search || url.hash) {
      throw new Error(`YAHOO_REDIRECT_URI must end with ${YAHOO_CALLBACK_PATH}`);
    }
    return url.toString().replace(/\/$/, '');
  }

  return `${getCanonicalAppUrl()}${YAHOO_CALLBACK_PATH}`;
}
