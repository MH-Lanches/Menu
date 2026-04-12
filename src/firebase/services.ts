import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { getDb, getStorageInstance } from './config';

// ============================================
// 📦 PRODUTOS
// ============================================

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  rating: number;
  prepTime: string;
  available: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function addProduct(product: Product): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    return null;
  }
}

export async function getProducts(): Promise<Product[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'products'),
      where('category', '==', category),
      where('available', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  } catch (error) {
    console.error('Erro ao buscar produtos por categoria:', error);
    return [];
  }
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await updateDoc(doc(db, 'products', id), {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return false;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'products', id));
    return true;
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    return false;
  }
}

// ============================================
// 🛒 PEDIDOS / VENDAS
// ============================================

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  paymentMethod: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export async function createOrder(order: Order): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return null;
  }
}

export async function getOrders(): Promise<Order[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
}

export async function getOrdersByStatus(status: string): Promise<Order[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'orders'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  } catch (error) {
    console.error('Erro ao buscar pedidos por status:', error);
    return [];
  }
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await updateDoc(doc(db, 'orders', id), {
      status,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return false;
  }
}

// ============================================
// 👤 USUÁRIOS (Clientes)
// ============================================

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  createdAt?: Timestamp;
  lastOrderAt?: Timestamp;
}

export async function saveCustomer(customer: Customer): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  try {
    // Verifica se já existe pelo telefone
    const q = query(collection(db, 'customers'), where('phone', '==', customer.phone));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'customers', existingDoc.id), {
        name: customer.name,
        address: customer.address,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        lastOrderAt: Timestamp.now(),
      });
      return existingDoc.id;
    }
    
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customer,
      createdAt: Timestamp.now(),
      lastOrderAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    return null;
  }
}

export async function getCustomers(): Promise<Customer[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const q = query(collection(db, 'customers'), orderBy('totalOrders', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

// ============================================
// 🖼️ STORAGE (Upload de Imagens)
// ============================================

export async function uploadImage(
  file: File,
  folder: 'logos' | 'products' | 'banners' | 'avatars'
): Promise<string | null> {
  const storage = getStorageInstance();
  if (!storage) return null;
  try {
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return null;
  }
}

export async function deleteImage(url: string): Promise<boolean> {
  const storage = getStorageInstance();
  if (!storage) return false;
  try {
    const imageRef = ref(storage, url);
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    return false;
  }
}

export async function getImagesFromFolder(folder: string): Promise<string[]> {
  const storage = getStorageInstance();
  if (!storage) return [];
  try {
    const folderRef = ref(storage, folder);
    const result = await listAll(folderRef);
    const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)));
    return urls;
  } catch (error) {
    console.error('Erro ao listar imagens:', error);
    return [];
  }
}

// ============================================
// 📊 DASHBOARD (Estatísticas)
// ============================================

export async function getDashboardStats(): Promise<{
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
}> {
  const db = getDb();
  if (!db) {
    return { totalProducts: 0, totalOrders: 0, totalCustomers: 0, totalRevenue: 0, pendingOrders: 0, todayOrders: 0, todayRevenue: 0 };
  }

  try {
    const [productsSnap, ordersSnap, customersSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'customers')),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalRevenue = 0;
    let pendingOrders = 0;
    let todayOrders = 0;
    let todayRevenue = 0;

    ordersSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.status !== 'cancelled') {
        totalRevenue += data.total || 0;
      }
      if (data.status === 'pending') {
        pendingOrders++;
      }
      const createdAt = data.createdAt?.toDate?.();
      if (createdAt && createdAt >= today) {
        todayOrders++;
        if (data.status !== 'cancelled') {
          todayRevenue += data.total || 0;
        }
      }
    });

    return {
      totalProducts: productsSnap.size,
      totalOrders: ordersSnap.size,
      totalCustomers: customersSnap.size,
      totalRevenue,
      pendingOrders,
      todayOrders,
      todayRevenue,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { totalProducts: 0, totalOrders: 0, totalCustomers: 0, totalRevenue: 0, pendingOrders: 0, todayOrders: 0, todayRevenue: 0 };
  }
}
