/**
 * Camada de integração com Firebase Realtime Database.
 *
 * - Se houver config válida em localStorage("mh_config").firebase, usa Firebase real.
 * - Caso contrário, opera 100% em localStorage (com sincronia entre abas via "storage" event).
 *
 * Pedidos do site são publicados em /pedidos/{id} e qualquer atualização vinda do PDV
 * é refletida em tempo real para o cliente em qualquer dispositivo.
 */

import type { Pedido } from "./store";

let _app: any = null;
let _db: any = null;
let _ready: Promise<boolean> | null = null;

function readFirebaseConfig() {
  try {
    const raw = localStorage.getItem("mh_config");
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    const fb = cfg?.firebase;
    if (!fb) return null;
    if (!fb.apiKey || !fb.databaseURL || !fb.projectId) return null;
    return fb;
  } catch {
    return null;
  }
}

export function isFirebaseEnabled() {
  return !!readFirebaseConfig();
}

async function ensureFirebase(): Promise<boolean> {
  if (_ready) return _ready;
  _ready = (async () => {
    const cfg = readFirebaseConfig();
    if (!cfg) return false;
    try {
      const { initializeApp, getApps, getApp } = await import("firebase/app");
      const { getDatabase } = await import("firebase/database");
      _app = getApps().length ? getApp() : initializeApp(cfg);
      _db = getDatabase(_app);
      return true;
    } catch (e) {
      console.warn("[Firebase] falha ao inicializar:", e);
      return false;
    }
  })();
  return _ready;
}

/* ========================= PEDIDOS ========================= */

export async function pushPedido(pedido: Pedido) {
  // Sempre grava local (UI imediata)
  try {
    const raw = localStorage.getItem("mh_pedidos");
    const arr: Pedido[] = raw ? JSON.parse(raw) : [];
    if (!arr.find(p => p.id === pedido.id)) {
      localStorage.setItem("mh_pedidos", JSON.stringify([pedido, ...arr]));
    }
  } catch {}
  // Tenta gravar no Firebase
  const ok = await ensureFirebase();
  if (!ok) return;
  try {
    const { ref, set } = await import("firebase/database");
    await set(ref(_db, "pedidos/" + pedido.id), pedido);
  } catch (e) {
    console.warn("[Firebase] pushPedido:", e);
  }
}

export async function updatePedidoRemoto(id: string, patch: Partial<Pedido>) {
  const ok = await ensureFirebase();
  if (!ok) return;
  try {
    const { ref, update } = await import("firebase/database");
    await update(ref(_db, "pedidos/" + id), patch);
  } catch (e) {
    console.warn("[Firebase] updatePedido:", e);
  }
}

/**
 * Escuta um pedido específico em tempo real.
 * Retorna função de unsubscribe.
 *
 * Funciona tanto com Firebase quanto em modo offline (storage event).
 */
export function subscribePedido(id: string, cb: (p: Pedido | null) => void): () => void {
  let unsubFB: (() => void) | null = null;

  // Modo offline: lê do localStorage e escuta storage event
  const readLocal = () => {
    try {
      const raw = localStorage.getItem("mh_pedidos");
      const arr: Pedido[] = raw ? JSON.parse(raw) : [];
      const found = arr.find(p => p.id === id) || null;
      cb(found);
    } catch {
      cb(null);
    }
  };
  readLocal();
  const onStorage = (e: StorageEvent) => {
    if (e.key === "mh_pedidos" || e.key === null) readLocal();
  };
  window.addEventListener("storage", onStorage);

  // Modo Firebase: escuta nó remoto
  (async () => {
    const ok = await ensureFirebase();
    if (!ok) return;
    try {
      const { ref, onValue } = await import("firebase/database");
      const r = ref(_db, "pedidos/" + id);
      const off = onValue(r, snap => {
        const val = snap.val();
        if (val) {
          // sincroniza no localStorage também (para os outros componentes)
          try {
            const raw = localStorage.getItem("mh_pedidos");
            const arr: Pedido[] = raw ? JSON.parse(raw) : [];
            const idx = arr.findIndex(p => p.id === id);
            if (idx >= 0) arr[idx] = val;
            else arr.unshift(val);
            localStorage.setItem("mh_pedidos", JSON.stringify(arr));
          } catch {}
          cb(val);
        }
      });
      unsubFB = () => off();
    } catch (e) {
      console.warn("[Firebase] subscribePedido:", e);
    }
  })();

  return () => {
    window.removeEventListener("storage", onStorage);
    if (unsubFB) unsubFB();
  };
}

/**
 * Busca um pedido pelo NÚMERO (não pelo id).
 * Útil para o cliente consultar de outro dispositivo via código.
 */
export async function buscarPedidoPorNumero(numero: number): Promise<Pedido | null> {
  // Tenta no Firebase primeiro
  const ok = await ensureFirebase();
  if (ok) {
    try {
      const { ref, get, query, orderByChild, equalTo } = await import("firebase/database");
      const q = query(ref(_db, "pedidos"), orderByChild("numero"), equalTo(numero));
      const snap = await get(q);
      const val = snap.val();
      if (val) {
        const first = Object.values(val)[0] as Pedido;
        return first;
      }
    } catch (e) {
      console.warn("[Firebase] buscarPedidoPorNumero:", e);
    }
  }
  // Fallback local
  try {
    const raw = localStorage.getItem("mh_pedidos");
    const arr: Pedido[] = raw ? JSON.parse(raw) : [];
    return arr.find(p => p.numero === numero) || null;
  } catch {
    return null;
  }
}
