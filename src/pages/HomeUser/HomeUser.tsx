// src/pages/HomeUser/HomeUserPage.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useAuth } from "@/contexts/auth/AuthContext";
import QueueStatusView from "../QueueView/QueueStatus";

interface Action {
  title: string;
  description: string;
  to: string;
  icon: React.ReactNode;
  color?: string;
}

// Modern styled icons with gradients
const UserIcon = ({ color = "from-blue-400 to-indigo-600" }) => (
  <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  </div>
);

const TicketIcon = ({ color = "from-emerald-400 to-teal-600" }) => (
  <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
      <path fillRule="evenodd" d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 01-.375.65 2.249 2.249 0 000 3.898.75.75 0 01.375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 17.625v-3.026a.75.75 0 01.374-.65 2.249 2.249 0 000-3.898.75.75 0 01-.374-.65V6.375zm15-1.125a.75.75 0 01.75.75v.75a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm.75 4.5a.75.75 0 00-1.5 0v.75a.75.75 0 001.5 0v-.75zm-.75 3a.75.75 0 01.75.75v.75a.75.75 0 01-1.5 0v-.75a.75.75 0 01.75-.75zm.75 4.5a.75.75 0 00-1.5 0V18a.75.75 0 001.5 0v-.75zM6 12a.75.75 0 01.75-.75H12a.75.75 0 010 1.5H6.75A.75.75 0 016 12zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
    </svg>
  </div>
);

const HistoryIcon = ({ color = "from-amber-400 to-orange-600" }) => (
  <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
    </svg>
  </div>
);

const EditIcon = ({ color = "from-pink-400 to-rose-600" }) => (
  <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
      <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
    </svg>
  </div>
);

const ChartIcon = ({ color = "from-violet-400 to-purple-600" }) => (
  <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
  </div>
);

const AnnouncementIcon = ({ color = "from-cyan-400 to-blue-600" }) => (
  <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
      <path d="M16.881 4.346A23.112 23.112 0 018.25 6H7.5a5.25 5.25 0 00-.88 10.427 21.593 21.593 0 001.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.592.772-2.468a17.116 17.116 0 01-.628-1.607c1.918.258 3.76.75 5.5 1.446A21.727 21.727 0 0018 11.25c0-2.413-.393-4.735-1.119-6.904zM18.26 3.74a23.22 23.22 0 011.24 7.51 23.22 23.22 0 01-1.24 7.51c-.055.161-.111.322-.17.482a.75.75 0 101.409.516 24.555 24.555 0 001.415-6.43 2.992 2.992 0 00.836-2.078c0-.806-.319-1.54-.836-2.078a24.65 24.65 0 00-1.415-6.43.75.75 0 10-1.409.516c.059.16.116.321.17.483z" />
    </svg>
  </div>
);

const QueueIcon = ({ color = "from-indigo-400 to-blue-600" }) => (
  <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
      <path d="M5.625 3.75a2.625 2.625 0 100 5.25h12.75a2.625 2.625 0 000-5.25H5.625zM3.75 11.25a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75zM3 15.75a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM3.75 18.75a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75z" />
    </svg>
  </div>
);

const RegisterIcon = ({ color = "from-green-400 to-emerald-600" }) => (
  <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
      <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
    </svg>
  </div>
);

const SettingsIcon = ({ color = "from-slate-400 to-gray-600" }) => (
  <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
      <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
    </svg>
  </div>
);

const ActionCard: React.FC<Action> = ({ title, description, to, icon }) => (
  <Link
    to={to}
    className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-center hover:translate-y-[-4px]"
  >
    <div className="mb-4 transform transition-transform hover:scale-110">{icon}</div>
    <h3 className="text-xl font-semibold text-neutral-700 mb-2">{title}</h3>
    <p className="text-neutral-600 text-sm">{description}</p>
  </Link>
);

const HomeUserPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();

  React.useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [navigate, user]);

  // Ensure we have the latest user data when the component mounts
  React.useEffect(() => {
    // This is necessary to ensure we have fresh data when navigating to this page
    const fetchCurrentUser = async () => {
      if (user && !userProfile && !authLoading) {
        console.log("HomeUserPage: Obteniendo datos de usuario...");
        await refreshUserProfile();
      }
    };
    
    fetchCurrentUser();
  }, [user, userProfile, authLoading, refreshUserProfile]);

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Cargando perfil…</p>
      </div>
    );
  }

  const actorActions: Action[] = [
    {
      title: "Solicitar Ticket",
      description: "Solicita un ticket en el sistema.",
      to: "/solicitar-turno",
      icon: <TicketIcon />,
    },
    {
      title: "Historial de Tickets",
      description: "Consulta tus tickets anteriores.",
      to: "/ticket-history",
      icon: <HistoryIcon />,
    },
    {
      title: "Mis Datos",
      description: "Visualiza tus datos personales.",
      to: "/personal-data",
      icon: <UserIcon />,
    },
  ];

  const workerActions: Action[] = [
    {
      title: "Gestionar Colas",
      description: "Administra los puntos de acceso y la atención de tickets.",
      to: "/worker/manage-queue",
      icon: <QueueIcon />,
    },
    {
      title: "Mis Datos",
      description: "Gestiona y edita tus datos personales.",
      to: "/personal-data",
      icon: <UserIcon />,
    },
  ];

  const adminActions: Action[] = [
    {
      title: "Estadísticas",
      description: "Visualiza estadísticas del sistema.",
      to: "/admin/statistics",
      icon: <ChartIcon />,
    },
    {
      title: "Anuncios",
      description: "Gestiona los anuncios del sistema.",
      to: "/admin/announcements",
      icon: <AnnouncementIcon />,
    },
    {
      title: "Puntos de Acceso",
      description: "Gestiona los puntos de acceso y asigna trabajadores.",
      to: "/admin/access-points",
      icon: <QueueIcon color="from-blue-400 to-sky-600" />,
    },
    {
      title: "Registrar Trabajador",
      description: "Registra nuevos trabajadores en el sistema.",
      to: "/register-worker",
      icon: <RegisterIcon />,
    },
    {
      title: "Gestión de Usuarios",
      description: "Administra los usuarios del sistema.",
      to: "/manage-userdata",
      icon: <EditIcon />,
    },
    {
      title: "Gestión de Trabajadores",
      description: "Administra los trabajadores del sistema.",
      to: "/admin/manage-workers",
      icon: <SettingsIcon />,
    }
  ];

  let actions: Action[] = [];
  
  if (userProfile.userType === "user" || userProfile.userType === "actor") {
    actions = actorActions;
  } else if (userProfile.userType === "worker") {
    if (userProfile.details && userProfile.details.is_admin) {
      actions = adminActions;
    } else {
      actions = workerActions;
    }
  } else if (userProfile.userType === "admin") {
    actions = adminActions;
  }

  return (
    <>
      <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-neutral-800">
           ¡ Hola, {userProfile.nombre || user.email} !
          </h1>
          <p className="text-lg text-neutral-600 mt-2">
            Aquí puedes acceder a las funcionalidades del sistema.
          </p>
        </header>

        <main className="max-w-5xl mx-auto">
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} mb-12`}>
            {actions.map((action, index) => (
              <ActionCard
                key={index}
                title={action.title}
                description={action.description}
                to={action.to}
                icon={action.icon}
              />
            ))}
          </div>

          <section className="pt-8 border-t border-gray-300">
            <QueueStatusView />
          </section>
        </main>
      </div>
    </>
  );
};

export default HomeUserPage;