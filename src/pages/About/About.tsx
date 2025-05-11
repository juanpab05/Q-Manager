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
  // { id: 1, name: "Cristian Daniel Guaza Mejia", role: "Desarrollador Fullstack & DB"},
//  { id: 3, name: "Jhonier Mendez Bravo", role: "Desarrollador Backend"},
//  { id: 4, name: "Juan Pablo Pazmiño Caicedo", role: "Desarrollador Backend & DB"},
//  { id: 5, name: "Fernando Cardona Giraldo", role: "Desarollador Backend"},
//  { id: 6, name: "Pablo Esteban Becerra Gomez", role: "Desarollador Frontend"},
  // Añade más miembros si es necesario
];

// Componente para las secciones con íconos
const IconSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ 
  icon, title, children 
}) => (
  <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 transition-all hover:shadow-xl hover:translate-y-[-2px]">
    <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6">
      <div className="flex-shrink-0 bg-indigo-100 p-4 rounded-xl text-indigo-600 mb-4 sm:mb-0 sm:mr-6">
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-indigo-700 mb-3">{title}</h3>
        <div className="text-neutral-600 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  </div>
);

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
            <div className="relative mb-10">
              <div className="w-20 h-1 bg-indigo-500 mx-auto rounded-full"></div>
              <div className="w-10 h-1 bg-indigo-300 mx-auto mt-1 rounded-full"></div>
            </div>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Q-Manager es un Sistema de Manejo de Atención a Usuarios diseñado para coordinar y
              gestionar la atención en múltiples puntos, otorgando prioridades y optimizando el flujo
              de manera eficiente, rápida y sin complicaciones. Nuestro objetivo es transformar la experiencia de espera.
            </p>
          </section>

          {/* Sección Misión y Visión */}
          <section className="mb-16 md:mb-20">
            <div className="flex flex-col space-y-8">
              <IconSection 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                } 
                title="Nuestra Misión"
              >
                <p className="mb-3">
                  Revolucionar la experiencia de gestión de filas y atención al cliente mediante una plataforma intuitiva y eficiente que elimine tiempos de espera innecesarios y proporcione datos valiosos para la toma de decisiones.
                </p>
                <p>
                  Nos comprometemos a mejorar la satisfacción tanto de los usuarios como de la organización, implementando tecnología de vanguardia que respete el tiempo de todos los involucrados y optimice recursos.
                </p>
              </IconSection>

              <IconSection 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                } 
                title="Nuestra Visión"
              >
                <p className="mb-3">
                  Ser reconocidos como el estándar de excelencia en sistemas de gestión de atención al usuario, optimizando la experiencia del cliente en cada interacción.
                </p>
                <p>
                  Aspiramos a construir un futuro donde las filas físicas sean cosa del pasado, reemplazadas por experiencias digitales fluidas que respeten el tiempo de cada persona y generen eficiencias operativas significativas.
                </p>
              </IconSection>

              <IconSection 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                } 
                title="Nuestros Valores"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-700 mb-1">Innovación</h4>
                    <p className="text-sm text-neutral-600">Buscamos constantemente nuevas formas de mejorar nuestra plataforma.</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-700 mb-1">Eficiencia</h4>
                    <p className="text-sm text-neutral-600">Optimizamos procesos para maximizar el valor del tiempo.</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-700 mb-1">Accesibilidad</h4>
                    <p className="text-sm text-neutral-600">Creamos soluciones inclusivas para todos los usuarios.</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-700 mb-1">Transparencia</h4>
                    <p className="text-sm text-neutral-600">Ofrecemos información clara sobre tiempos y procesos.</p>
                  </div>
                </div>
              </IconSection>
            </div>
          </section>

          {/* Sección Nuestro Equipo */}
          <section className="mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-800 mb-6 text-center">
              Nuestro Equipo
            </h2>
            <div className="relative mb-10">
              <div className="w-20 h-1 bg-indigo-500 mx-auto rounded-full"></div>
              <div className="w-10 h-1 bg-indigo-300 mx-auto mt-1 rounded-full"></div>
            </div>
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