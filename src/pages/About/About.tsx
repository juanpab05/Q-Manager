// src/pages/AboutPage/AboutPage.tsx

import React from 'react';
// import Navbar from '@/pages/navbar/navbar'; // Remove this import
import { useAuth } from '@/contexts/auth/AuthContext'; // Importamos useAuth para verificar autenticación

// Placeholder para imagen de miembro del equipo
const MemberImagePlaceholder: React.FC<{ nameInitial: string }> = ({ nameInitial }) => (
  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl sm:text-4xl font-semibold mb-4 shadow-md">
    {nameInitial}
  </div>
);

interface TeamMember {
  id: number;
  name: string;
  role: string;
  imageUrl?: string;
}

// Datos de los miembros del equipo (reemplaza con tus datos reales)
const teamMembers: TeamMember[] = [
// { id: 1, name: "David Santiago Guerrero Delgado", role: "Desarrollador Frontend"},
  { id: 1, name: "Cristian Daniel Guaza Mejia", role: "Desarrollador Fullstack & DB"},
//  { id: 3, name: "Jhonier Mendez Bravo", role: "Desarrollador Backend"},
//  { id: 4, name: "Juan Pablo Pazmiño Caicedo", role: "Desarrollador Backend & DB"},
//  { id: 5, name: "Fernando Cardona Giraldo", role: "Desarollador Backend"},
//  { id: 6, name: "Pablo Esteban Becerra Gomez", role: "Desarollador Frontend"},
  // Añade más miembros si es necesario
];


const AboutPage: React.FC = () => {
  const auth = useAuth(); // Obtenemos el contexto de autenticación
  const isAuthenticated = auth && auth.isAuthenticated; // Verificamos si está autenticado

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* <Navbar /> REMOVED: Renderizar Navbar solo si el usuario está autenticado */}
      
      {/* Ajustar el padding superior del main dinámicamente */}
      <main className={`pb-16 px-4 sm:px-6 lg:px-8 ${isAuthenticated ? 'pt-24' : 'pt-12 sm:pt-16'}`}> 
        <div className="max-w-5xl mx-auto">

          {/* Sección Introductoria */}
          <section className="text-center mb-16 md:mb-20">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-800 mb-6">
              Sobre <span className="text-indigo-600">Q-Manager</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Q-Manager es un Sistema de Manejo de Atención a Usuarios diseñado para coordinar y
              gestionar la atención en múltiples puntos, otorgando prioridades y optimizando el flujo
              de manera eficiente, rápida y sin complicaciones. Nuestro objetivo es transformar la experiencia de espera.
            </p>
          </section>

          {/* Sección Nuestro Equipo */}
          <section className="mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-800 mb-10 md:mb-12 text-center">
              Nuestro Equipo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl shadow-xl p-6 pt-8 text-center flex flex-col items-center hover:shadow-2xl transition-shadow duration-300"
                >
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover mb-5 shadow-md border-2 border-indigo-200"
                    />
                  ) : (
                    <MemberImagePlaceholder nameInitial={member.name.charAt(0)} />
                  )}
                  <h3 className="text-xl font-semibold text-indigo-600 mb-1">{member.name}</h3>
                  <p className="text-sm text-neutral-700 font-medium mb-2">{member.role}</p>
                </div>
              ))}
            </div>
          </section>
          
        </div>
      </main>
    </div>
  );
};

export default AboutPage;