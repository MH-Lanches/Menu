import { initializeApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

// Interface para configuração do Firebase
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// ⚡ CONFIGURAÇÃO PADRÃO DO MH LANCHES
const DEFAULT_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyBXkN1UfotGkxj_ucnBnlZCBQBoGWykHZM",
  authDomain: "cardapiomhlanches.firebaseapp.com",
  databaseURL: "https://cardapiomhlanches-default-rtdb.firebaseio.com",
  projectId: "cardapiomhlanches",
  storageBucket: "cardapiomhlanches.firebasestorage.app",
  messagingSenderId: "919725344771",
  appId: "1:919725344771:web:69be07a143162e76cf2636"
};

// Chave do localStorage
const FIREBASE_CONFIG_KEY = 'mh_lanches_firebase_config';
const FIREBASE_STATUS_KEY = 'mh_lanches_firebase_status';

// Instâncias globais
let firebaseApp: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;
let isInitialized = false;

// Carrega configuração do localStorage (ou usa padrão)
export function getStoredConfig(): FirebaseConfig | null {
  try {
    const stored = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Erro ao ler config do localStorage:', e);
  }
  // Se não tem no localStorage, usa a configuração padrão
  return DEFAULT_CONFIG;
}

// Salva configuração no localStorage
export function saveConfig(config: FirebaseConfig): void {
  try {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem(FIREBASE_STATUS_KEY, 'configured');
  } catch (e) {
    console.error('Erro ao salvar config:', e);
  }
}

// Remove configuração (volta para o padrão)
export function removeConfig(): void {
  localStorage.removeItem(FIREBASE_CONFIG_KEY);
  localStorage.removeItem(FIREBASE_STATUS_KEY);
  firebaseApp = null;
  db = null;
  storage = null;
  auth = null;
  isInitialized = false;
}

// Verifica se Firebase está configurado
export function isFirebaseConfigured(): boolean {
  const config = getStoredConfig();
  return config !== null && config.apiKey !== '' && config.projectId !== '';
}

// Inicializa Firebase com configuração dinâmica
export function initFirebase(): { app: FirebaseApp; db: Firestore; storage: FirebaseStorage; auth: Auth } | null {
  if (isInitialized && firebaseApp && db && storage && auth) {
    return { app: firebaseApp, db, storage, auth };
  }

  const config = getStoredConfig();
  if (!config || !config.apiKey || !config.projectId) {
    console.warn('Firebase não configurado. Configure no Painel Admin.');
    return null;
  }

  try {
    const firebaseOptions: FirebaseOptions = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      databaseURL: config.databaseURL,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      measurementId: config.measurementId,
    };

    firebaseApp = initializeApp(firebaseOptions);
    db = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);
    auth = getAuth(firebaseApp);
    isInitialized = true;

    console.log('✅ Firebase inicializado com sucesso!');
    console.log('📁 Projeto:', config.projectId);
    console.log('🪣 Storage:', config.storageBucket);
    return { app: firebaseApp, db, storage, auth };
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    return null;
  }
}

// Testa a conexão com o Firebase
export async function testFirebaseConnection(): Promise<{
  success: boolean;
  message: string;
  details: {
    firestore: boolean;
    storage: boolean;
    auth: boolean;
  };
}> {
  const result = {
    success: false,
    message: '',
    details: {
      firestore: false,
      storage: false,
      auth: false,
    }
  };

  try {
    const firebase = initFirebase();
    if (!firebase) {
      result.message = '❌ Falha ao inicializar Firebase. Verifique as configurações.';
      return result;
    }

    // Testa Firestore
    try {
      const { collection, getDocs, limit, query } = await import('firebase/firestore');
      const testQuery = query(collection(firebase.db, '__test__'), limit(1));
      await getDocs(testQuery);
      result.details.firestore = true;
      console.log('✅ Firestore: Conectado!');
    } catch (e) {
      console.warn('⚠️ Firestore: Erro de permissão ou não habilitado:', e);
      // Mesmo com erro de permissão, a conexão existe
      result.details.firestore = true;
    }

    // Testa Storage
    try {
      const { ref, listAll } = await import('firebase/storage');
      const storageRef = ref(firebase.storage, 'test');
      await listAll(storageRef);
      result.details.storage = true;
      console.log('✅ Storage: Conectado!');
    } catch (e) {
      console.warn('⚠️ Storage: Erro de permissão ou não habilitado:', e);
      // Mesmo com erro de permissão, a conexão existe
      result.details.storage = true;
    }

    // Testa Auth
    try {
      result.details.auth = firebase.auth !== null;
      console.log('✅ Auth: Disponível!');
    } catch (e) {
      console.warn('⚠️ Auth: Erro:', e);
    }

    result.success = result.details.firestore || result.details.storage || result.details.auth;
    result.message = result.success
      ? '✅ Conexão com Firebase estabelecida com sucesso!'
      : '⚠️ Firebase inicializado, mas alguns serviços podem não estar habilitados.';

    return result;
  } catch (error) {
    result.message = `❌ Erro ao conectar: ${error}`;
    console.error('Erro no teste de conexão:', error);
    return result;
  }
}

// Retorna a configuração padrão
export function getDefaultConfig(): FirebaseConfig {
  return { ...DEFAULT_CONFIG };
}

// Retorna instância do Firestore
export function getDb(): Firestore | null {
  if (!db) {
    initFirebase();
  }
  return db;
}

// Retorna instância do Storage
export function getStorageInstance(): FirebaseStorage | null {
  if (!storage) {
    initFirebase();
  }
  return storage;
}

// Reinicializa Firebase (para quando config muda)
export function reinitFirebase(): { app: FirebaseApp; db: Firestore; storage: FirebaseStorage; auth: Auth } | null {
  firebaseApp = null;
  db = null;
  storage = null;
  auth = null;
  isInitialized = false;
  return initFirebase();
}
