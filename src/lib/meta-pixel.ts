export type MetaEventParams = Record<
  string,
  string | number | boolean | undefined
>;

type MetaEventType = "track" | "trackCustom";

function sendMetaEvent(
  type: MetaEventType,
  eventName: string,
  params?: MetaEventParams,
  attempt = 0,
) {
  if (typeof window === "undefined") return;

  /*
   * Pixel belum siap.
   * Coba lagi setiap 100ms maksimal 20 kali = ±2 detik.
   */
  if (typeof window.fbq !== "function") {
    if (attempt < 20) {
      window.setTimeout(() => {
        sendMetaEvent(type, eventName, params, attempt + 1);
      }, 100);
    }

    return;
  }

  if (params) {
    window.fbq(type, eventName, params);
  } else {
    window.fbq(type, eventName);
  }
}

export function trackMetaEvent(eventName: string, params?: MetaEventParams) {
  sendMetaEvent("track", eventName, params);
}

export function trackMetaCustomEvent(
  eventName: string,
  params?: MetaEventParams,
) {
  sendMetaEvent("trackCustom", eventName, params);
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
