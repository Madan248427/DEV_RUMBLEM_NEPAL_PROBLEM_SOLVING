import { Outlet } from "react-router-dom";
import UserSidebar from "./pages/Sidebar/Sidebar";
import "./UserLayout.css";

const UserLayout = () => {
  return (
    <div className="user-layout">
      
      <UserSidebar />
      <main className="user-main">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;