export type AnalyticsEventType = "visit" | "cart_open" | "product_add" | "order_sent";

export type AnalyticsEvent = {
  id: string;
  type: AnalyticsEventType;
  at: number;
  session: string;
  meta?: Record<string, any>;
};

const KEY = "mh_analytics";
const SESSION_KEY = "mh_site_session";
const VISIT_MARK_KEY = "mh_visit_mark";

function id() {
  return Math.random().toString(36).slice(2, 10);
}

export function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `${Date.now()}_${id()}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function readAnalytics(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeAnalytics(events: AnalyticsEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events.slice(-5000)));
}

export function logEvent(type: AnalyticsEventType, meta?: Record<string, any>) {
  const events = readAnalytics();
  events.push({ id: id(), type, at: Date.now(), session: getSessionId(), meta });
  writeAnalytics(events);
}

export function logVisitOncePerSession() {
  const now = Date.now();
  const raw = sessionStorage.getItem(VISIT_MARK_KEY);
  if (raw && now - Number(raw) < 30 * 60 * 1000) return;
  sessionStorage.setItem(VISIT_MARK_KEY, String(now));
  logEvent("visit", { path: `${location.pathname}${location.hash || ""}` || "/index.html" });
}

export const logCartOpen = () => logEvent("cart_open");
export const logProductAdd = (produtoId: string, produtoNome: string) => logEvent("product_add", { produtoId, produtoNome });
export const logOrderSent = (payload: { total: number; itens: number; tipoPedido: string }) => logEvent("order_sent", payload);

export function dayKey(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function inDateRange(ts: number, from?: string, to?: string) {
  const key = dayKey(ts);
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}
