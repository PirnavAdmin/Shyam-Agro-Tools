import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./TopBar.css";
import Notification from "../notification/Notification";

function TopBar({ openSidebar }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const profileRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeProfileMenu = () => {
    setShowProfileMenu(false);
  };

  return (
    <div className="topbar">
      <button type="button" className="topbar-brand" onClick={openSidebar}>
        <h1 className="navbar-subtitle">
          <Link to="/crm" className="brand-link">
            <span className="text-blue">SHYAM AGRO</span>{" "}
            <span className="text-red">TOOLS</span>
          </Link>
        </h1>
      </button>

      <div className="topbar-right">
        <Notification />
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? "Light" : "Dark"}
        </button>

        <div className="profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="profile-box"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">A</div>
            <div className="profile-info">
              <h4>Admin</h4>
              <p>Administrator</p>
            </div>
            <span className="profile-arrow">v</span>
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <button
                type="button"
                className="profile-menu-item"
                onClick={closeProfileMenu}
              >
                <span className="menu-icon mail-icon">@</span>
                <span>Mail</span>
              </button>
              <button
                type="button"
                className="profile-menu-item"
                onClick={closeProfileMenu}
              >
                <span className="menu-icon account-icon">A</span>
                <span>Account</span>
              </button>
              <button
                type="button"
                className="profile-menu-item logout-item"
                onClick={closeProfileMenu}
              >
                <span className="menu-icon logout-icon">L</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopBar;
