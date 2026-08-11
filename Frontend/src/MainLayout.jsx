import { Outlet } from "react-router-dom";
import Chatbot from "./chatbot/Chatbot";

const MainLayout = () => {
  return (
    <div className="main-layout">
      {/* Your Chatbot is always visible */}
      <Chatbot />

      {/* Page content renders here */}
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;