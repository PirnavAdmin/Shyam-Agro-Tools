import { useState } from "react";
import "./MainLayout.css";
import Sidebar from "../Sidebar/Sidebar";
import TopBar from "../topbar/TopBar";
import { Outlet } from "react-router-dom";

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="layout">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        closeSidebar={closeSidebar}
      />
      <div className={isSidebarOpen ? "main-content" : "main-content full"}>
        <TopBar openSidebar={openSidebar} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;