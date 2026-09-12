import { useState, useEffect, useMemo } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { SupplierTable } from './components/SupplierTable';
import { AutoPartsTable } from './components/AutoPartsTable';
import { AnalyticsView } from './components/AnalyticsView';
import { AddSupplierModal } from './components/AddSupplierModal';
import { AddAutoPartModal } from './components/AddAutoPartModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Supplier, SupplierFormData, AutoPart, AutoPartFormData, ActiveTab } from './types';
import {
  subscribeSuppliers,
  subscribeAutoParts,
  saveSupplierToDb,
  deleteSupplierFromDb,
  saveAutoPartToDb,
  deleteAutoPartFromDb,
  getCachedSuppliers,
  getCachedAutoParts,
} from './lib/firestoreService';
import { useOnlineStatus } from './hooks/useOnlineStatus';

const AUTH_KEY = 'daewoo_auth_session';

export default function App() {
  const isOnline = useOnlineStatus();

  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_KEY) || null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('suppliers');

  // 1-Jadval: Yetkazib beruvchilar
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    return getCachedSuppliers();
  });
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // 2-Jadval: Avto ehtiyot qismlar
  const [autoParts, setAutoParts] = useState<AutoPart[]>(() => {
    return getCachedAutoParts();
  });
  const [isAddAutoPartOpen, setIsAddAutoPartOpen] = useState(false);
  const [editingAutoPart, setEditingAutoPart] = useState<AutoPart | null>(null);

  // Real-time Firestore obunalari (Ofllayn bo'lsa ham keshdan o'qiydi)
  useEffect(() => {
    if (!currentUser) return;

    // Yetkazib beruvchilar kolleksiyasiga obuna
    const unsubSuppliers = subscribeSuppliers(
      (data) => {
        setSuppliers(data);
      },
      (error) => {
        console.warn('Suppliers subscription note:', error);
      }
    );

    // Avto ehtiyot qismlar kolleksiyasiga obuna
    const unsubAutoParts = subscribeAutoParts(
      (data) => {
        setAutoParts(data);
      },
      (error) => {
        console.warn('AutoParts subscription note:', error);
      }
    );

    return () => {
      unsubSuppliers();
      unsubAutoParts();
    };
  }, [currentUser]);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem(AUTH_KEY, username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  // 1-Jadval: Yetkazib beruvchini saqlash (Firebase + Offline guard)
  const handleSaveSupplier = async (data: SupplierFormData, editId?: string) => {
    if (!isOnline) {
      alert('Oflayn rejimda yangi yozuv qo\'shish yoki tahrirlash imkoniyati cheklangan!');
      return;
    }

    try {
      const existing = editId ? suppliers.find((s) => s.id === editId) : null;
      await saveSupplierToDb(data, existing, suppliers.length);
      setIsAddSupplierOpen(false);
      setEditingSupplier(null);
    } catch (err: any) {
      alert(err?.message || 'Saqlashda xatolik yuz berdi');
    }
  };

  // 1-Jadval: Yetkazib beruvchini o'chirish (Firebase + Offline guard)
  const handleDeleteSupplier = async (id: string) => {
    if (!isOnline) {
      alert('Oflayn rejimda yozuvni o\'chirish imkoniyati cheklangan!');
      return;
    }

    try {
      await deleteSupplierFromDb(id);
    } catch (err: any) {
      alert(err?.message || 'O\'chirishda xatolik yuz berdi');
    }
  };

  // 2-Jadval: Avto ehtiyot qismini saqlash (Firebase + Offline guard)
  const handleSaveAutoPart = async (data: AutoPartFormData, editId?: string) => {
    if (!isOnline) {
      alert('Oflayn rejimda yangi yozuv qo\'shish yoki tahrirlash imkoniyati cheklangan!');
      return;
    }

    try {
      const existing = editId ? autoParts.find((p) => p.id === editId) : null;
      await saveAutoPartToDb(data, existing, autoParts.length);
      setIsAddAutoPartOpen(false);
      setEditingAutoPart(null);
    } catch (err: any) {
      alert(err?.message || 'Saqlashda xatolik yuz berdi');
    }
  };

  // 2-Jadval: Avto ehtiyot qismini o'chirish (Firebase + Offline guard)
  const handleDeleteAutoPart = async (id: string) => {
    if (!isOnline) {
      alert('Oflayn rejimda yozuvni o\'chirish imkoniyati cheklangan!');
      return;
    }

    try {
      await deleteAutoPartFromDb(id);
    } catch (err: any) {
      alert(err?.message || 'O\'chirishda xatolik yuz berdi');
    }
  };

  // Mavjud barcha yetkazib beruvchilardagi unikal mahsulotlar (1-jadval uchun)
  const allAvailableProducts = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach((s) => {
      s.products?.forEach((p) => {
        if (p && p.trim()) set.add(p.trim());
      });
    });
    return Array.from(set);
  }, [suppliers]);

  // If not logged in, show Kirish oynasi (Login Screen)
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-amber-50 font-sans text-black">
        <LoginScreen onLogin={handleLogin} />
        <OfflineIndicator />
      </main>
    );
  }

  // Authenticated Screen
  return (
    <div className="min-h-screen bg-amber-50 text-black flex flex-col font-sans selection:bg-amber-300 selection:text-black">
      {/* Navbar with Daewoo branding, date, database status, tab switcher and logout */}
      <Navbar
        onLogout={handleLogout}
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        suppliersCount={suppliers.length}
        autoPartsCount={autoParts.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 min-w-0 overflow-x-hidden">
        {activeTab === 'suppliers' && (
          <SupplierTable
            suppliers={suppliers}
            onOpenAddModal={() => {
              setEditingSupplier(null);
              setIsAddSupplierOpen(true);
            }}
            onEditSupplier={(supplier) => {
              setEditingSupplier(supplier);
              setIsAddSupplierOpen(true);
            }}
            onDeleteSupplier={handleDeleteSupplier}
          />
        )}

        {activeTab === 'autoparts' && (
          <AutoPartsTable
            parts={autoParts}
            onOpenAddModal={() => {
              setEditingAutoPart(null);
              setIsAddAutoPartOpen(true);
            }}
            onEditPart={(part) => {
              setEditingAutoPart(part);
              setIsAddAutoPartOpen(true);
            }}
            onDeletePart={handleDeleteAutoPart}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView parts={autoParts} suppliers={suppliers} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-amber-300 bg-yellow-100 py-3.5 px-6 text-center text-xs text-black font-semibold">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} DAEWOO — Monitoring va Hisob Tizimi</p>
          <div className="flex items-center gap-3 text-[11px] text-stone-700 font-bold">
            <span>Baza: Firestore + Lokal Kesh</span>
            <span>•</span>
            <span>PWA & Oflayn Ko'rish</span>
          </div>
        </div>
      </footer>

      {/* 1-Jadval: Yetkazib beruvchi qo'shish / tahrirlash modali */}
      <AddSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => {
          setIsAddSupplierOpen(false);
          setEditingSupplier(null);
        }}
        onSave={handleSaveSupplier}
        currentCount={suppliers.length}
        initialSupplier={editingSupplier}
        availableProducts={allAvailableProducts}
      />

      {/* 2-Jadval: Avto ehtiyot qism qo'shish / tahrirlash modali */}
      <AddAutoPartModal
        isOpen={isAddAutoPartOpen}
        onClose={() => {
          setIsAddAutoPartOpen(false);
          setEditingAutoPart(null);
        }}
        onSave={handleSaveAutoPart}
        currentCount={autoParts.length}
        initialPart={editingAutoPart}
        suppliers={suppliers}
        existingParts={autoParts}
      />

      {/* PWA Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}
