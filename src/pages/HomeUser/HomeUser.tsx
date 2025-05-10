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
}

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
  </svg>
);

const TicketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a2 2 0 100-4H7a2 2 0 100 4m0 0v6m0-6H5m14 0h-2" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.062 2.062 0 113 3L8 19.35l-4 1 1-4L16.862 4.487z" />
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const AnnouncementIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
  </svg>
);

const QueueIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
  </svg>
);

const ActionCard: React.FC<Action> = ({ title, description, to, icon }) => (
  <Link
    to={to}
    className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 text-center"
  >
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-neutral-700 mb-2">{title}</h3>
    <p className="text-neutral-600 text-sm">{description}</p>
  </Link>
);

const HomeUserPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { user, userProfile } = useAuth();

  React.useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [navigate, user]);

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
      icon: <TicketIcon />,
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
      icon: <QueueIcon />,
    },
    {
      title: "Registrar Trabajador",
      description: "Registra nuevos trabajadores en el sistema.",
      to: "/register-worker",
      icon: <UserIcon />,
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
      icon: <EditIcon />,
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
      <div className="py-8 px-4 sm:px-6 lg:px-8">
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