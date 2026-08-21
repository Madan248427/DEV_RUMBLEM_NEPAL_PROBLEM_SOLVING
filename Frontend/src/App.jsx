"use client";

import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./context/ProtectedRoute";
import PublicRoute from "./context/PublicRoute";
import Chatbot from "./chatbot/Chatbot";

// Auth & Public Pages
import Login from "./pages/Login/Login";
import LandingPage from "./pages/page";
import Register from "./pages/Registration/Register";
import About from "./pages/about";
import PublicReports from "./pages/PublicReports/PublicReports";

// Dashboards & Management Pages
import UserDashboard from "./User/Dashboard"; 
import OrganizerDashboard from "./pages/Dashboard/Dashboard"; 
import OrganizerReports from "./pages/Reports/Reports";
import OrganizerNotices from "./pages/Notices/Notices";

// User & Profile pages
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Notifications from "./pages/Notifications/Notifications";
import NoticePage from "./pages/Notice/NoticePage";

// Layouts & Misc
import UserLayout from "./UserLayout";
import ForgetPassword from "./pages/ForgotPassword/ForgotPassword";
import Unauthorized from "./pages/PageNotFound/NotFound";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentSuccess from "./pages/PaymentSuccess";

function App() {
  return (
    <Routes>
      <Route element={<Chatbot />}>
        {/* ================= STRICT PUBLIC-ONLY ROUTES ================= */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgetPassword />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failure" element={<PaymentFailure />} />
        </Route>

        {/* ================= GENERAL PUBLIC PAGES ================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/public-reports" element={<PublicReports />} />

        {/* Redirect generic routes */}
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />

        {/* ================= CITIZEN / USER DASHBOARD ================= */}
        <Route element={<ProtectedRoute allowedRoles={["citizen", "user", "organizer", "admin", "employee"]} />}>
          <Route element={<UserLayout />}>
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
        </Route>

        {/* ================= ORGANIZER / ADMIN DASHBOARD & MANAGEMENT ================= */}
        <Route element={<ProtectedRoute allowedRoles={["organizer", "admin", "employee", "user", "citizen"]} />}>
          <Route element={<UserLayout />}>
            {/* Dashboard aliases */}
            <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
            <Route path="/dashboard" element={<OrganizerDashboard />} />
            
            {/* Reports */}
            <Route path="/reports" element={<OrganizerReports />} />
            <Route path="/organizer-reports" element={<OrganizerReports />} />

            {/* Notices */}
            <Route path="/notices" element={<OrganizerNotices />} />
            <Route path="/organizer-notices" element={<OrganizerNotices />} />
          </Route>
        </Route>

        {/* ================= SHARED PROTECTED ROUTES (Wrapped in UserLayout) ================= */}
        <Route element={<ProtectedRoute allowedRoles={["citizen", "organizer", "admin", "user", "employee"]} />}>
          <Route element={<UserLayout />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
          </Route>
        </Route>

        {/* Fallbacks */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Unauthorized />} />
      </Route>
    </Routes>
  );
}

export default App;