import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import logo from "../../../assets/logo.png";
import {
  ChevronDown,
  FilePlus,
  FileText,
  LayoutDashboard,
  PhoneCall,
  ReceiptText,
  Ticket,
  Users,
} from "lucide-react";

function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  closeSidebar,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isInvoiceRoute = location.pathname.startsWith("/crm/invoice");
  const [isInvoiceDropdownOpen, setIsInvoiceDropdownOpen] = useState(false);

  useEffect(() => {
    setIsInvoiceDropdownOpen(isInvoiceRoute);
  }, [isInvoiceRoute]);

  const menuItems = [
    { name: "Dashboard", path: "/crm", icon: <LayoutDashboard size={25} /> },
    { name: "Tickets", path: "/crm/tickets", icon: <Ticket size={25} /> },
    { name: "Customers", path: "/crm/customers", icon: <Users size={25} /> },
    { name: "Call History", path: "/crm/call-history", icon: <PhoneCall size={25} /> },
  ];

  const invoiceItems = [
    { name: "Invoices", path: "/crm/invoice", icon: <FileText size={18} /> },
    { name: "Add Invoice", path: "/crm/invoice/add", icon: <FilePlus size={18} /> },
    { name: "Invoice Details", path: "/crm/invoice/details", icon: <ReceiptText size={18} /> },
  ];

  return (
    <div
      className={isSidebarOpen ? "sidebar open" : "sidebar closed"}
      onMouseEnter={() => setIsSidebarOpen(true)}
      onMouseLeave={() => setIsSidebarOpen(false)}
    >
      <div className="sidebar-top">
        <img
          src={logo}
          alt="SAT Logo"
          className="sidebar-logo-img"
        />
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/crm"}
            onClick={() => {
              if (window.innerWidth <= 992) {
                closeSidebar();
              }
            }}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>
            <span className="sidebar-text">{item.name}</span>
          </NavLink>
        ))}

        <div className={isInvoiceDropdownOpen ? "sidebar-dropdown open" : "sidebar-dropdown"}>
          <button
            type="button"
            className={isInvoiceRoute ? "sidebar-link active invoice-parent" : "sidebar-link invoice-parent"}
            onClick={() => {
              setIsSidebarOpen(true);
              setIsInvoiceDropdownOpen((prev) => !prev);
              if (!isInvoiceRoute) {
                navigate("/crm/invoice");
              }
            }}
          >
            <span className="sidebar-icon">
              <ReceiptText size={25} />
            </span>
            <span className="sidebar-text">Invoice</span>
            <ChevronDown className="dropdown-chevron" size={18} />
          </button>

          <div className="sidebar-submenu">
            {invoiceItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/crm/invoice"}
                onClick={() => {
                  if (window.innerWidth <= 992) {
                    closeSidebar();
                  }
                }}
                className={({ isActive }) =>
                  isActive ? "sidebar-sublink active" : "sidebar-sublink"
                }
              >
                <span className="sidebar-subicon">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
