export type ActivityType = 'jismoniy' | 'yuridik';

export type PaymentMethod = 'naqd' | 'bank orqali' | 'bank kartalari orqali';

export type PaymentConditionType =
  | 'naqd joyida'
  | 'kechiktirib to\'lash'
  | 'oldindan to\'lov (avans)'
  | 'bo\'lib-bo\'lib to\'lash';

export type QualityStability = 'yomon' | 'o\'rtacha' | 'yaxshi';

export type TransparencyLevel = 'shaffof' | 'shubhali';

export type ResponsibilityType =
  | 'mahsulot sifatiga javob beradi'
  | 'mahsulot sifatiga javob bermaydi'
  | 'mahsulot sifatiga ba\'zida javob beradi';

export type DisciplineLevel = 'vaqtida' | 'o\'rtacha' | 'kechikadi';

export type ExtrasType = 'yetkazib berish (pulli)' | 'yetkazib berish (bepul)';

export interface Supplier {
  id: string;
  orderNumber: number; // 1-tartib raqam (avtomatik)
  systemTime: string; // 2-sistema vaqti (avtomatik)
  createdAt: number;
  activityType: ActivityType | string; // 3-faoliyat turi (jismoniy, yuridik yoki birgalikda)
  activityTypes?: ActivityType[]; // bir nechta faoliyat turlari (ikkalasini ham tanlash imkoni)
  name: string; // 4-nom (majburiy)
  address: string; // 5-manzil (majburiy)
  phone: string; // 6-telefon raqam (majburiy)
  paymentMethod: PaymentMethod | string; // 7-pul o'tkazmalari (bir nechta bo'lishi mumkin)
  paymentMethods?: string[]; // bir nechta pul o'tkazma turlari
  paymentCondition: PaymentConditionType | string; // 8-to'lov sharti (bir nechta bo'lishi mumkin)
  paymentConditions?: string[]; // bir nechta to'lov shartlari
  delayDays?: number | string; // agar kechiktirib to'lash bo'lsa kun
  qualityStability: QualityStability; // 9-sifat barqarorligi
  qualityScore?: number; // 1 dan 5 gacha baho
  transparencyLevel: TransparencyLevel; // 10-shaffoflik darajasi
  transparencyScore?: number; // 1 dan 5 gacha baho
  responsibility: ResponsibilityType; // 11-javobgarlik
  responsibilityScore?: number; // 1 dan 5 gacha baho
  disciplineLevel: DisciplineLevel; // 12-intizom darajasi
  disciplineScore?: number; // 1 dan 5 gacha baho
  extras: ExtrasType; // 13-qo'shimchalar
  extrasScore?: number; // 1 dan 5 gacha baho
  products?: string[]; // 14-taklif qilinadigan mahsulotlar ro'yxati (ixtiyoriy)
}

export interface SupplierFormData {
  activityType: ActivityType | string;
  activityTypes?: ActivityType[];
  name: string;
  address: string;
  phone: string;
  paymentMethod: PaymentMethod | string;
  paymentMethods: string[];
  paymentCondition: PaymentConditionType | string;
  paymentConditions: string[];
  delayDays: string;
  qualityStability: QualityStability;
  qualityScore: number; // 1 dan 5 gacha baho
  transparencyLevel: TransparencyLevel;
  transparencyScore: number; // 1 dan 5 gacha baho
  responsibility: ResponsibilityType;
  responsibilityScore: number; // 1 dan 5 gacha baho
  disciplineLevel: DisciplineLevel;
  disciplineScore: number; // 1 dan 5 gacha baho
  extras: ExtrasType;
  extrasScore: number; // 1 dan 5 gacha baho
  products: string[]; // taklif qilinadigan mahsulotlar ro'yxati
}

export interface UserSession {
  username: string;
  loggedInAt: string;
}

export interface AutoPart {
  id: string;
  orderNumber: number; // 1-tartib son (avtomatik)
  systemTime: string; // 2-sistema vaqti (avtomatik)
  createdAt: number;
  partName: string; // 3-avto ehtiyot qism nomi (majburiy)
  brand: string; // 4-brend (majburiy)
  supplierName: string; // 5-yetkazib beruvchi (majburiy)
  price: number; // 6-narx (majburiy)
  date: string; // 7-sana (majburiy)
  source: string; // 8-ma'lumot manbaasi (majburiy)
  comment: string; // 9-izoh (majburiy)
}

export interface AutoPartFormData {
  partName: string;
  brand: string;
  supplierName: string;
  price: string;
  date: string;
  source: string;
  comment: string;
}

export type ActiveTab = 'suppliers' | 'autoparts' | 'analytics';
