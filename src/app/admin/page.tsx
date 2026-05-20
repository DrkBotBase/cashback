"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Plus, User as UserIcon, LogOut, Gift } from "lucide-react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [totalClients, setTotalClients] = useState<number>(0);
  const [rewardPoints, setRewardPoints] = useState<number>(10);
  const [newRewardPoints, setNewRewardPoints] = useState<string>("10");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user && (session.user as any).role !== "ADMIN") {
      router.push("/dashboard");
    }
    
    // Initial fetch for top clients, total count and settings
    const fetchInitialData = async () => {
      try {
        const [usersRes, settingsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/settings")
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          setTopClients(data.topClients || []);
          setTotalClients(data.totalClients || 0);
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setRewardPoints(data.value);
          setNewRewardPoints(data.value.toString());
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    if (session?.user && (session.user as any).role === "ADMIN") {
      fetchInitialData();
    }
  }, [status, session, router]);

  const handleUpdateSettings = async () => {
    const value = parseInt(newRewardPoints);
    if (isNaN(value) || value <= 0) {
      alert("Por favor ingresa un número válido");
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        setRewardPoints(value);
        setShowSettings(false);
        alert("Meta de puntos actualizada");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      setUsers([]);
      return;
    };
    setLoading(true);
    try {
      const res = await fetch(`/api/users?whatsapp=${searchTerm}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updatePoints = async (userId: string, amount: number) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: amount }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUsers = users.map(u => u._id === userId ? { ...u, points: data.points } : u);
        setUsers(updatedUsers);
        
        // Also update top clients if visible
        setTopClients(prev => {
          const updated = prev.map(u => u._id === userId ? { ...u, points: data.points } : u);
          return updated.sort((a, b) => b.points - a.points);
        });
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Error al actualizar puntos");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(null);
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen text-lg">Cargando...</div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-12">
      <div className="max-w-md mx-auto space-y-6">
        <header className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Panel Delivery</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{totalClients} clientes registrados</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
              title="Configuración de Recompensas"
            >
              <div className={`bg-white p-2 rounded-lg shadow-sm border transition-colors ${showSettings ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100'}`}>
                <span className="text-xs font-bold text-indigo-600">{rewardPoints} pts</span>
              </div>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={24} />
            </button>
          </div>
        </header>

        {showSettings && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide flex items-center">
              Meta de Recompensas
            </h3>
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1 ml-1">Puntos para premio gratis</label>
                <input
                  type="number"
                  value={newRewardPoints}
                  onChange={(e) => setNewRewardPoints(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={handleUpdateSettings}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por WhatsApp..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!e.target.value) setUsers([]);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none shadow-sm transition-all"
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Buscar
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center py-10 text-gray-500">Buscando clientes...</p>
          ) : users.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase px-1">Resultados de búsqueda</h2>
              {users.map((user) => (
                <div key={user._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.whatsapp}</p>
                      <p className="text-xs font-semibold text-indigo-600 mt-1">{user.points} puntos actuales</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {user.points >= rewardPoints && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Canjear ${rewardPoints} puntos de ${user.name}?`)) {
                            updatePoints(user._id, -rewardPoints);
                          }
                        }}
                        disabled={updating === user._id}
                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-3 rounded-xl transition-colors disabled:opacity-50"
                        title={`Canjear ${rewardPoints} puntos`}
                      >
                        <Gift size={24} />
                      </button>
                    )}
                    <button
                      onClick={() => updatePoints(user._id, 1)}
                      disabled={updating === user._id}
                      className="bg-green-100 hover:bg-green-200 text-green-700 p-3 rounded-xl transition-colors disabled:opacity-50"
                      title="Sumar 1 punto"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm && !loading ? (
            <p className="text-center py-10 text-gray-500 italic">No se encontraron clientes.</p>
          ) : (
            <div className="space-y-6">
              {topClients.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-gray-400 uppercase px-1">Top Clientes (Más puntos)</h2>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {topClients.map((user, index) => (
                      <div key={user._id} className={`p-4 flex items-center justify-between ${index !== topClients.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.whatsapp}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-indigo-600 font-bold text-sm">{user.points} pts</span>
                          <button
                            onClick={() => updatePoints(user._id, 1)}
                            disabled={updating === user._id}
                            className="bg-green-50 text-green-600 p-1.5 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-center py-4 text-gray-500 italic text-sm">Ingresa un número para buscar clientes específicos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
