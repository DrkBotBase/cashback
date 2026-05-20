"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Award, Gift, MessageCircle, Phone, X } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [dbPoints, setDbPoints] = useState<number | null>(null);
  const [rewardPoints, setRewardPoints] = useState<number>(10);
  const [showContactModal, setShowContactModal] = useState(false);
  const [adminContact, setAdminContact] = useState<{ whatsapp: string, name: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user && (session.user as any).role === "ADMIN") {
      router.push("/admin");
    }

    const fetchInitialData = async () => {
      try {
        const [pointsRes, contactRes, settingsRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/admin-contact"),
          fetch("/api/settings")
        ]);

        if (pointsRes.ok) {
          const data = await pointsRes.json();
          setDbPoints(data.points);
          if (data.points !== (session?.user as any)?.points) {
            update({ points: data.points });
          }
        }

        if (contactRes.ok) {
          const data = await contactRes.json();
          setAdminContact(data);
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setRewardPoints(data.value);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    if (session?.user) {
      fetchInitialData();
    }
  }, [status, session, router, update]);

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen text-lg">Cargando...</div>;
  }

  if (!session) return null;

  const points = dbPoints !== null ? dbPoints : (session.user as any).points || 0;
  const nextReward = rewardPoints;
  const rewardsAvailable = Math.floor(points / nextReward);
  const progressPoints = points % nextReward;
  const progress = (progressPoints / nextReward) * 100;

  const handleWhatsApp = () => {
    if (!adminContact) return;
    const message = encodeURIComponent(`Hola ${adminContact.name}, soy ${session.user?.name}, necesito un servicio.`);
    window.open(`https://wa.me/57${adminContact.whatsapp}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    if (!adminContact) return;
    window.open(`tel:${adminContact.whatsapp}`, '_self');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-xl font-bold text-gray-900">Hola, {session.user?.name}!</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={24} />
          </button>
        </header>

        {rewardsAvailable > 0 && (
          <div className="bg-green-100 border border-green-200 rounded-2xl p-4 flex items-center space-x-4 animate-pulse">
            <div className="bg-green-600 p-2 rounded-full text-white">
              <Gift size={24} />
            </div>
            <div>
              <p className="text-green-800 font-bold">¡Tienes {rewardsAvailable} {rewardsAvailable === 1 ? 'pedido gratis' : 'pedidos gratis'}!</p>
              <p className="text-green-700 text-xs">Muestra este panel a tu repartidor para canjearlo.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tus Puntos</span>
            <Award className="text-yellow-500" size={28} />
          </div>
          <div className="text-4xl font-extrabold text-indigo-600 mb-6">
            {points} <span className="text-lg font-normal text-gray-400">puntos</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-600">Progreso hacia tu {rewardsAvailable > 0 ? 'próxima' : 'primera'} recompensa</span>
              <span className="text-indigo-600">{progressPoints}/{nextReward}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              {rewardsAvailable > 0 
                ? `¡Ya has acumulado ${rewardsAvailable} pedidos gratis!` 
                : `¡Cada ${nextReward} puntos obtienes un pedido gratis!`}
            </p>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
          <h3 className="font-bold text-lg mb-2">¿Cómo ganar puntos?</h3>
          <p className="text-indigo-100 text-sm">
            Dile a tu repartidor tu número de WhatsApp registrado cada vez que hagas un pedido. ¡Él sumará los puntos por ti!
          </p>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowContactModal(true)}
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all transform hover:scale-110 active:scale-95 z-40"
        title="Contactar repartidor"
      >
        <MessageCircle size={28} />
      </button>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Contactar Repartidor</h3>
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-500 text-sm">
              ¿Cómo deseas comunicarte con el domiciliario?
            </p>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center space-x-3 bg-[#25D366] text-white py-4 rounded-2xl font-bold hover:bg-[#20ba5a] transition-colors"
              >
                <MessageCircle size={24} />
                <span>WhatsApp</span>
              </button>
              
              <button
                onClick={handleCall}
                className="flex items-center justify-center space-x-3 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
              >
                <Phone size={24} />
                <span>Llamada Telefónica</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
