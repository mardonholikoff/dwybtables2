import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { db } from './firebase';
import { Supplier, AutoPart, SupplierFormData, AutoPartFormData } from '../types';

const SUPPLIERS_COLLECTION = 'suppliers';
const AUTOPARTS_COLLECTION = 'auto_parts';

const DB_ID = firebaseConfig.firestoreDatabaseId || 'default';
const SUPPLIERS_CACHE_KEY = `daewoo_suppliers_cache_${DB_ID}`;
const AUTOPARTS_CACHE_KEY = `daewoo_autoparts_cache_${DB_ID}`;

// Load cached data
export function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = cleanForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function getCachedSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(SUPPLIERS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function getCachedAutoParts(): AutoPart[] {
  try {
    const raw = localStorage.getItem(AUTOPARTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Subscribe to Suppliers
export function subscribeSuppliers(
  callback: (suppliers: Supplier[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, SUPPLIERS_COLLECTION);
  const q = query(colRef, orderBy('orderNumber', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Supplier[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Supplier, 'id'>) });
      });

      // Sort by orderNumber just in case
      items.sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));

      localStorage.setItem(SUPPLIERS_CACHE_KEY, JSON.stringify(items));
      callback(items);
    },
    (err) => {
      console.warn('Firestore suppliers error or offline mode:', err);
      // Fallback to local cache
      const cached = getCachedSuppliers();
      if (cached.length > 0) {
        callback(cached);
      }
      if (onError) onError(err);
    }
  );
}

// Subscribe to Auto Parts
export function subscribeAutoParts(
  callback: (parts: AutoPart[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, AUTOPARTS_COLLECTION);
  const q = query(colRef, orderBy('orderNumber', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AutoPart[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<AutoPart, 'id'>) });
      });

      items.sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));

      localStorage.setItem(AUTOPARTS_CACHE_KEY, JSON.stringify(items));
      callback(items);
    },
    (err) => {
      console.warn('Firestore auto_parts error or offline mode:', err);
      const cached = getCachedAutoParts();
      if (cached.length > 0) {
        callback(cached);
      }
      if (onError) onError(err);
    }
  );
}

// Save Supplier
export async function saveSupplierToDb(
  data: SupplierFormData,
  existingSupplier?: Supplier | null,
  currentCount: number = 0
): Promise<void> {
  if (!navigator.onLine) {
    throw new Error('Oflayn rejimda yangi yozuv qo\'shish yoki tahrirlash imkoniyati cheklangan!');
  }

  const now = new Date();
  const systemTime = now.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const isDelayPayment =
    data.paymentCondition === 'kechiktirib to\'lash' ||
    Boolean(data.paymentConditions?.some((c) => c.includes('kechiktirib')));

  const rawDelayDays = isDelayPayment && data.delayDays ? String(data.delayDays).trim() : null;

  const acts = (data.activityTypes && data.activityTypes.length > 0)
    ? data.activityTypes
    : typeof data.activityType === 'string'
      ? data.activityType.split(',').map((s) => s.trim()).filter(Boolean)
      : [data.activityType || 'jismoniy'];

  const pMethods = data.paymentMethods && data.paymentMethods.length > 0
    ? data.paymentMethods
    : [String(data.paymentMethod || 'naqd pul')];

  const pConditions = data.paymentConditions && data.paymentConditions.length > 0
    ? data.paymentConditions
    : [String(data.paymentCondition || 'naqd joyida')];

  if (existingSupplier) {
    const updated: Supplier = {
      ...existingSupplier,
      activityType: data.activityType,
      activityTypes: acts as any,
      name: data.name.trim(),
      address: data.address.trim(),
      phone: data.phone.trim(),
      paymentMethod: data.paymentMethod,
      paymentMethods: pMethods,
      paymentCondition: data.paymentCondition,
      paymentConditions: pConditions,
      qualityStability: data.qualityStability,
      qualityScore: data.qualityScore || 4,
      transparencyLevel: data.transparencyLevel,
      transparencyScore: data.transparencyScore || 4,
      responsibility: data.responsibility,
      responsibilityScore: data.responsibilityScore || 4,
      disciplineLevel: data.disciplineLevel,
      disciplineScore: data.disciplineScore || 4,
      extras: data.extras,
      extrasScore: data.extrasScore || 4,
      products: data.products || [],
    };

    if (rawDelayDays) {
      updated.delayDays = rawDelayDays;
    } else {
      delete updated.delayDays;
    }

    const payload = cleanForFirestore(updated);
    await setDoc(doc(db, SUPPLIERS_COLLECTION, existingSupplier.id), payload);
  } else {
    const id = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSupplier: Supplier = {
      id,
      orderNumber: currentCount + 1,
      systemTime,
      createdAt: now.getTime(),
      activityType: data.activityType,
      activityTypes: acts as any,
      name: data.name.trim(),
      address: data.address.trim(),
      phone: data.phone.trim(),
      paymentMethod: data.paymentMethod,
      paymentMethods: pMethods,
      paymentCondition: data.paymentCondition,
      paymentConditions: pConditions,
      qualityStability: data.qualityStability,
      qualityScore: data.qualityScore || 4,
      transparencyLevel: data.transparencyLevel,
      transparencyScore: data.transparencyScore || 4,
      responsibility: data.responsibility,
      responsibilityScore: data.responsibilityScore || 4,
      disciplineLevel: data.disciplineLevel,
      disciplineScore: data.disciplineScore || 4,
      extras: data.extras,
      extrasScore: data.extrasScore || 4,
      products: data.products || [],
    };

    if (rawDelayDays) {
      newSupplier.delayDays = rawDelayDays;
    }

    const payload = cleanForFirestore(newSupplier);
    await setDoc(doc(db, SUPPLIERS_COLLECTION, id), payload);
  }
}

// Delete Supplier
export async function deleteSupplierFromDb(id: string): Promise<void> {
  if (!navigator.onLine) {
    throw new Error('Oflayn rejimda yozuvni o\'chirish imkoniyati cheklangan!');
  }
  await deleteDoc(doc(db, SUPPLIERS_COLLECTION, id));
}

// Save Auto Part
export async function saveAutoPartToDb(
  data: AutoPartFormData,
  existingPart?: AutoPart | null,
  currentCount: number = 0
): Promise<void> {
  if (!navigator.onLine) {
    throw new Error('Oflayn rejimda yangi yozuv qo\'shish yoki tahrirlash imkoniyati cheklangan!');
  }

  const now = new Date();
  const systemTime = now.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const numericPrice = typeof data.price === 'number'
    ? data.price
    : parseFloat(String(data.price).replace(/\s/g, '').replace(/,/g, '.')) || 0;

  if (existingPart) {
    const updated: AutoPart = {
      ...existingPart,
      partName: data.partName.trim(),
      code: (data.code || '').trim(),
      specialMark: (data.specialMark || '').trim(),
      carPosition: (data.carPosition || '').trim(),
      country: data.country.trim(),
      brand: data.brand.trim(),
      supplierName: data.supplierName.trim(),
      price: numericPrice,
      date: data.date.trim(),
      source: data.source.trim(),
      comment: (data.comment || '').trim(),
    };
    const payload = cleanForFirestore(updated);
    await setDoc(doc(db, AUTOPARTS_COLLECTION, existingPart.id), payload);
  } else {
    const id = `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newPart: AutoPart = {
      id,
      orderNumber: currentCount + 1,
      systemTime,
      createdAt: now.getTime(),
      partName: data.partName.trim(),
      code: (data.code || '').trim(),
      specialMark: (data.specialMark || '').trim(),
      carPosition: (data.carPosition || '').trim(),
      country: data.country.trim(),
      brand: data.brand.trim(),
      supplierName: data.supplierName.trim(),
      price: numericPrice,
      date: data.date.trim(),
      source: data.source.trim(),
      comment: (data.comment || '').trim(),
    };
    const payload = cleanForFirestore(newPart);
    await setDoc(doc(db, AUTOPARTS_COLLECTION, id), payload);
  }
}

// Delete Auto Part
export async function deleteAutoPartFromDb(id: string): Promise<void> {
  if (!navigator.onLine) {
    throw new Error('Oflayn rejimda yozuvni o\'chirish imkoniyati cheklangan!');
  }
  await deleteDoc(doc(db, AUTOPARTS_COLLECTION, id));
}
