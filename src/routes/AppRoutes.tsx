// src/AppRoutes.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "@/pages/navbar/navbar";
import ProtectedRoute from "./ProtectedRoutes.tsx";
import TestAuth from "@/components/TestAuth";


import HomePage from "@/pages/GlobalHome/GlobalHome";
import AboutPage from "@/pages/About/About";
import LoginForm from "@/pages/Login/LoginForm";
import SignupPage from "@/pages/Signup/SignupPage.tsx";
import PersonalData from "@/pages/PersonalData/PersonalData";
import ProfilePage from "@/pages/HomeUser/HomeUser";
import CreateWorkerForm from "@/pages/RegisterWorker/CreateWorkerForm";
import RequestTicketPage from "@/pages/RequestTicket/RequestTicket";
import TicketHistoryPage from "@/pages/TicketHistory/TicketHistory";
import ManageUserData from "@/pages/ManageUserData/ManageUserData";
import Statistics from "@/pages/AdminDashboard/Statistics";
import Announcements from "@/pages/AdminDashboard/Announcements";
import ManageQueue from "@/pages/WorkerDashboard/ManageQueue";
import QueueStatusView from "@/pages/QueueView/QueueStatus";
import ManageAccessPoints from "@/pages/AdminDashboard/ManageAccessPoints";
import ManageWorkers from "@/pages/AdminDashboard/ManageWorkers";
import CreateRegularUserForm from "@/pages/RegisterUser/CreateRegularUserForm";
import RecoverPasswordPage from "@/pages/RecoverPassword/RecoverPasswordPage";
import ResetPasswordPage from "@/pages/ResetPassword/ResetPasswordPage";

const AppRoutes: React.FC = () => (
  <BrowserRouter>
    {/* Navbar siempre vivo dentro del Router */}
    <Navbar />

    {/* Global background and padding for content area below Navbar */}
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 pt-16">
      <Routes>
        {/* Páginas Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/recover-password" element={<RecoverPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/personal-data" element={<PersonalData />} />
        <Route path="/register-user" element={<CreateRegularUserForm />} />
        {/* Página de perfil (requiere estar logueado) */}
        <Route
          path="/home-user"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Rutas de registro sólo para administradores */}
        <Route
          path="/register-worker"
          element={
            <ProtectedRoute role="worker" requireAdmin={true}>
              <CreateWorkerForm />
            </ProtectedRoute>
          }
        />

        <Route path="/test-auth" element={
            <ProtectedRoute role="worker" requireAdmin={true}>
                <TestAuth />
            </ProtectedRoute>
          } />


        {/* Solicitar turno (pública) */}
        <Route path="/solicitar-turno" element={<RequestTicketPage />} />

        {/* Vista de estado de cola (pública) */}
        <Route path="/queue-status" element={<QueueStatusView />} />

        {/* Historial de tickets (requiere login) */}
        <Route
          path="/ticket-history"
          element={
            <ProtectedRoute>
              <TicketHistoryPage />
            </ProtectedRoute>
          }
        />
        
        {/* Gestión de usuarios (solo administradores) */}
        <Route
          path="/manage-userdata"
          element={
            <ProtectedRoute role="worker" requireAdmin={true}>
              <ManageUserData />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Administrador */}
        <Route
          path="/admin/statistics"
          element={
            <ProtectedRoute role="worker" requireAdmin={true}>
              <Statistics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute role="worker" requireAdmin={true}>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/access-points"
          element={
            <ProtectedRoute role="worker" requireAdmin={true}>
              <ManageAccessPoints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-workers"
          element={
            <ProtectedRoute role="worker" requireAdmin={true}>
              <ManageWorkers />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Trabajador */}
        <Route
          path="/worker/manage-queue"
          element={
            <ProtectedRoute role="worker">
              <ManageQueue />
            </ProtectedRoute>
          }
        />

        {/* Rutas no definidas redirigen al home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  </BrowserRouter>
);

export default AppRoutes;
