import Serializer from '@supabase/realtime-js/dist/module/lib/serializer.js';

const serializer = new Serializer();

/**
 * Wraps the Realtime Phoenix serializer so non-array JSON payloads (e.g. from a
 * proxy or malformed frames) do not throw when destructured — which surfaces as
 * "n is not iterable" in minified bundles.
 */
export function realtimeSafeDecode(
  rawPayload: string | ArrayBuffer,
  callback: (msg: Record<string, unknown>) => void
): void {
  if (typeof rawPayload === 'string') {
    try {
      const parsed: unknown = JSON.parse(rawPayload);
      if (!Array.isArray(parsed) || parsed.length < 5) {
        callback({});
        return;
      }
      const [join_ref, ref, topic, event, payload] = parsed;
      callback({ join_ref, ref, topic, event, payload });
      return;
    } catch {
      callback({});
      return;
    }
  }
  serializer.decode(rawPayload, callback);
}
