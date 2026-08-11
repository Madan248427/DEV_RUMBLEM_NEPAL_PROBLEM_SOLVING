"use client";

import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./context/ProtectedRoute";
import PublicRoute from "./context/PublicRoute";
import Chatbot from "./chatbot/Chatbot"

// Auth
import Login from "./pages/Login/Login";
import Page from"./pages/page"
import Register from "./pages/Registration/Register";
import About from "./pages/about";
// import EsewaDebugger from "./pages/EsewaDebugger";

// User pages
import UserDashboard from "./User/Dashboard";
import IssuedBooks from "./pages/IssuedBooks/IssuedBooks";
import BookListPage from "./pages/BookList/BookListPage";
import BookDetailPage from "./pages/BookDetails/BookDetail";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Notifications from "./pages/Notifications/Notifications";

// Employee/Admin pages
import Dashboard from "./pages/Dashboard/Dashboard";
import AddBook from "./pages/AddBook/AddBook";
import EditBook from "./pages/EditBook/EditBook";
import BookList from "./pages/BookList1/BookList1";
import BookDetail from "./pages/BookDetail/BookDetail";
import AdminBooks from "./pages/AdminBooks/AdminBooks";
import Transaction from "./pages/Transaction/Transaction";

// Layouts
import UserLayout from "./UserLayout";
import EmployeeLayout from "./EmployeeLayout";
import ForgetPassword from "./pages/ForgotPassword/ForgotPassword"
// Misc
import Unauthorized from "./pages/PageNotFound/NotFound";
import NoticePage from "./pages/Notice/NoticePage";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentSuccess from "./pages/PaymentSuccess";


function App() {
  return (
    <Routes>

      {/* Root Redirect */}
      {/* <Route path="/" element={<Navigate to="/" replace />} /> */}

      {/* ================= PUBLIC ROUTES ================= */}
      <Route element={<Chatbot />}>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<Page />} />
        <Route path="/about" element={<About />} />
      
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failure" element={<PaymentFailure />} />
        {/* <Route path="/esewa-debugger" element={<EsewaDebugger />} /> */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgetPassword/>} />
        <Route path="/signup" element={<Register />} />
      
      </Route>

      {/* ================= USER ROUTES ================= */}
      <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
        <Route element={<UserLayout />}>
        
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/books" element={<BookListPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/issued-books" element={<IssuedBooks />} />
          <Route path="/notifications" element={<Notifications />} />
          {/* <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} /> */}
        </Route>
        
      </Route>

      {/* ================= EMPLOYEE / ADMIN ROUTES ================= */}
      <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
      
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/add-book" element={<AddBook />} />
          <Route path="/edit-book/:id" element={<EditBook />} />
          <Route path="/book-list" element={<BookList />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/emp-books" element={<AdminBooks />} />
          <Route path="/transaction" element={<Transaction />} />
          <Route path="/notices" element={<NoticePage/>} />
          {/* <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} /> */}
          {/* <Route path="/notice" element={<Notices />} /> */}
        </Route>
        
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["user", "employee"]} />}>
        <Route element={<UserLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Route>
      </Route>

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Fallback */}
      <Route path="*" element={<div>Page Not Found</div>} />

    </Route>
    </Routes>
  );
}

export default App;
