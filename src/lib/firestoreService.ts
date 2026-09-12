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
import { db } from './firebase';
import { Supplier, AutoPart, SupplierFormData, AutoPartFormData } from '../types';

const SUPPLIERS_COLLECTION = 'suppliers';
const AUTOPARTS_COLLECTION = 'auto_parts';

const SUPPLIERS_CACHE_KEY = 'daewoo_suppliers_cache';
const AUTOPARTS_CACHE_KEY = 'daewoo_autoparts_cache';

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

// Initial sample suppliers if completely empty
const INITIAL_SAMPLE_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_init_1',
    orderNumber: 1,
    systemTime: '08.09.2026, 09:15:20',
    createdAt: 1788858920000,
    activityType: 'yuridik',
    name: '"Avto Detal Servis" MCHJ',
    address: 'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko\'chasi, 42',
    phone: '+998 90 123 45 67',
    paymentMethod: 'bank orqali',
    paymentCondition: 'naqd joyida',
    qualityStability: 'yaxshi',
    transparencyLevel: 'shaffof',
    responsibility: 'mahsulot sifatiga javob beradi',
    disciplineLevel: 'vaqtida',
    extras: 'yetkazib berish (bepul)',
    products: ['Filtrlar', 'Tormoz kolodkasi', 'Amortizator'],
  },
  {
    id: 'sup_init_2',
    orderNumber: 2,
    systemTime: '08.09.2026, 11:30:00',
    createdAt: 1788867000000,
    activityType: 'jismoniy',
    name: 'Karimov Rustam Baxtiyorovich (YATT)',
    address: 'Samarqand sh., Gagarin ko\'chasi, 15',
    phone: '+998 93 987 65 43',
    paymentMethod: 'naqd',
    paymentCondition: 'kechiktirib to\'lash',
    delayDays: '15',
    qualityStability: 'yaxshi',
    transparencyLevel: 'shaffof',
    responsibility: 'mahsulot sifatiga javob beradi',
    disciplineLevel: 'vaqtida',
    extras: 'yetkazib berish (pulli)',
    products: ['Svecha', 'Moy filtri', 'Generator remeni'],
  },
];

const INITIAL_SAMPLE_AUTOPARTS: AutoPart[] = [
  {
    id: 'part_init_1',
    orderNumber: 1,
    systemTime: '15.08.2026, 09:30:00',
    createdAt: 1786786200000,
    partName: 'Oldi tormoz kolodkasi',
    brand: 'Sangsin Hi-Q',
    supplierName: '"Avto Detal Servis" MCHJ',
    price: 14.50,
    date: '2026-08-15',
    source: 'Rasmiy diler',
    comment: 'Cobalt va Gentra uchun original partiya',
  },
  {
    id: 'part_init_2',
    orderNumber: 2,
    systemTime: '20.08.2026, 11:15:00',
    createdAt: 1787222100000,
    partName: 'Oldi tormoz kolodkasi',
    brand: 'Sangsin Hi-Q',
    supplierName: 'Karimov Rustam Baxtiyorovich (YATT)',
    price: 15.00,
    date: '2026-08-20',
    source: 'Ulgurji bozor',
    comment: 'Koreya quti, sifatli',
  },
  {
    id: 'part_init_3',
    orderNumber: 3,
    systemTime: '28.08.2026, 14:00:00',
    createdAt: 1787916000000,
    partName: 'Oldi tormoz kolodkasi',
    brand: 'Sangsin Hi-Q',
    supplierName: '"Avto Detal Servis" MCHJ',
    price: 15.20,
    date: '2026-08-28',
    source: 'Rasmiy diler',
    comment: 'Yangi import partiyasi',
  },
  {
    id: 'part_init_4',
    orderNumber: 4,
    systemTime: '02.09.2026, 10:20:00',
    createdAt: 1788344400000,
    partName: 'Oldi tormoz kolodkasi',
    brand: 'Sangsin Hi-Q',
    supplierName: 'Karimov Rustam Baxtiyorovich (YATT)',
    price: 14.80,
    date: '2026-09-02',
    source: 'Bozor',
    comment: 'Chegirma bilan berildi',
  },
  {
    id: 'part_init_5',
    orderNumber: 5,
    systemTime: '08.09.2026, 10:00:15',
    createdAt: 1788861615000,
    partName: 'Oldi tormoz kolodkasi',
    brand: 'Sangsin Hi-Q',
    supplierName: '"Avto Detal Servis" MCHJ',
    price: 15.50,
    date: '2026-09-08',
    source: 'Rasmiy diler',
    comment: 'Oxirgi kelgan narx, kafolat 6 oy',
  },
  {
    id: 'part_init_6',
    orderNumber: 6,
    systemTime: '25.08.2026, 11:45:00',
    createdAt: 1787654700000,
    partName: 'Moy filtri (Oil Filter)',
    brand: 'Mann Filter',
    supplierName: 'Karimov Rustam Baxtiyorovich (YATT)',
    price: 3.50,
    date: '2026-08-25',
    source: 'Ulgurji bozor',
    comment: 'Nexia 3, Spark uchun',
  },
  {
    id: 'part_init_7',
    orderNumber: 7,
    systemTime: '08.09.2026, 11:45:00',
    createdAt: 1788867900000,
    partName: 'Moy filtri (Oil Filter)',
    brand: 'Mann Filter',
    supplierName: '"Avto Detal Servis" MCHJ',
    price: 3.75,
    date: '2026-09-08',
    source: 'Do\'kon',
    comment: 'Germaniya zavod',
  },
  {
    id: 'part_init_8',
    orderNumber: 8,
    systemTime: '08.09.2026, 12:20:30',
    createdAt: 1788870030000,
    partName: 'Oldi amortizator',
    brand: 'Mando',
    supplierName: '"Avto Detal Servis" MCHJ',
    price: 28.00,
    date: '2026-09-07',
    source: 'Koreya import',
    comment: 'Laziz va gaz-moyli, zavod kafolati mavjud',
  },
];

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
      if (snapshot.empty && !localStorage.getItem('daewoo_suppliers_seeded')) {
        // Seed initial data to firestore if empty
        localStorage.setItem('daewoo_suppliers_seeded', 'true');
        INITIAL_SAMPLE_SUPPLIERS.forEach((item) => {
          setDoc(doc(db, SUPPLIERS_COLLECTION, item.id), cleanForFirestore(item)).catch((err) => {
            console.warn('Seeding supplier error:', err);
          });
        });
        callback(INITIAL_SAMPLE_SUPPLIERS);
        localStorage.setItem(SUPPLIERS_CACHE_KEY, JSON.stringify(INITIAL_SAMPLE_SUPPLIERS));
        return;
      }

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
      if (snapshot.empty && !localStorage.getItem('daewoo_autoparts_seeded')) {
        localStorage.setItem('daewoo_autoparts_seeded', 'true');
        INITIAL_SAMPLE_AUTOPARTS.forEach((item) => {
          setDoc(doc(db, AUTOPARTS_COLLECTION, item.id), cleanForFirestore(item)).catch((err) => {
            console.warn('Seeding autopart error:', err);
          });
        });
        callback(INITIAL_SAMPLE_AUTOPARTS);
        localStorage.setItem(AUTOPARTS_CACHE_KEY, JSON.stringify(INITIAL_SAMPLE_AUTOPARTS));
        return;
      }

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
