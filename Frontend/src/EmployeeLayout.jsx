import { Outlet } from "react-router-dom";
import UserSidebar from "./pages/Sidebar/Sidebar";
import GlobalNoticePopup from "./Component/GlobalNoticePopup";

const EmployeeLayout = () => {
  return (
    <div style={{ display: "flex" }}>
        <GlobalNoticePopup />
        <UserSidebar />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default EmployeeLayout;
