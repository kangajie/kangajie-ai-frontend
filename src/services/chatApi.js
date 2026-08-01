import { BACKEND_URL } from '../lib/constants';

/**
 * Send chat message to backend API
 *
 * Request body:
 * {
 *   history: [{ role: 'user'|'model', parts: [{ text: string }] }],
 *   message: string,
 *   fileData?: string,       // base64 data URL
 *   mimeType?: string,
 *   fileName?: string,
 *   userName?: string,
 * }
 *
 * Response:
 * {
 *   reply: string,
 *   title?: string | null,
 *   sources?: Array<{ url: string; title: string }>,
 *   editedImage?: string,    // base64 PNG
 * }
 */
export async function sendChat(payload, signal) {
  // BACKEND_URL is '' in dev (Vite proxy handles it), full URL in prod
  const url = `${BACKEND_URL}/api/chat`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (networkErr) {
    // Network error (offline, CORS pre-flight failed, etc.)
    if (networkErr.name === 'AbortError') throw networkErr;
    throw new Error(
      `Tidak dapat terhubung ke server. Pastikan backend berjalan dan coba lagi.\n(${networkErr.message})`
    );
  }

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData.error || errData.detail || errorMsg;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();

  // Backend kadang return { error: ... } dengan status 200 (all keys busy)
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}
