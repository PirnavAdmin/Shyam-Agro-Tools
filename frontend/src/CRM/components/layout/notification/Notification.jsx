import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Notification.css";

const API_BASE_URL = "https://wildlife-unwieldy-devotee.ngrok-free.dev/api";

function Notification() {
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const notificationRef = useRef(null);

  const apiHeaders = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  const getJsonData = async (response) => {
    if (!response || !response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        fetch(`${API_BASE_URL}/Contacts`, { headers: apiHeaders }),
        fetch(`${API_BASE_URL}/Tickets`, { headers: apiHeaders }),
        fetch(`${API_BASE_URL}/Orders`, { headers: apiHeaders }),
        fetch(`${API_BASE_URL}/Invoices`, { headers: apiHeaders }),
        fetch(`${API_BASE_URL}/Purchases`, { headers: apiHeaders }),
      ]);

      const contacts =
        results[0].status === "fulfilled"
          ? await getJsonData(results[0].value)
          : [];

      const tickets =
        results[1].status === "fulfilled"
          ? await getJsonData(results[1].value)
          : [];

      const orders =
        results[2].status === "fulfilled"
          ? await getJsonData(results[2].value)
          : [];

      const invoices =
        results[3].status === "fulfilled"
          ? await getJsonData(results[3].value)
          : [];

      const purchases =
        results[4].status === "fulfilled"
          ? await getJsonData(results[4].value)
          : [];

      const latestNotifications = [
        ...contacts.map((item) => ({
          id: `contact-${item.contactId}`,
          sortId: item.contactId || 0,
          title: "Contact Added",
          message: item.contactName || "New contact added",
          module: "Call History",
          route: "/call-history",
        })),

        ...tickets.map((item) => ({
          id: `ticket-${item.ticketId || item.id}`,
          sortId: item.ticketId || item.id || 0,
          title: "Ticket Added",
          message:
            item.customerName ||
            item.customer ||
            item.issueName ||
            item.issue ||
            "New ticket added",
          module: "Tickets",
          route: "/tickets",
        })),

        ...orders.map((item) => ({
          id: `order-${item.orderId}`,
          sortId: item.orderId || 0,
          title: "Order Added",
          message: item.customerName || item.productName || "New order added",
          module: "Orders",
          route: "/orders",
        })),

        ...invoices.map((item) => ({
          id: `invoice-${item.invoiceId}`,
          sortId: item.invoiceId || 0,
          title: "Invoice Added",
          message:
            item.customerName ||
            item.invoiceNumber ||
            "New invoice added",
          module: "Invoices",
          route: "/invoice",
        })),

        ...purchases.map((item) => ({
          id: `purchase-${item.purchaseId}`,
          sortId: item.purchaseId || 0,
          title: "Purchase Added",
          message:
            item.supplierName ||
            item.supplier ||
            item.itemName ||
            item.item ||
            "New purchase added",
          module: "Purchases",
          route: "/purchases",
        })),
      ]
        .filter((item) => item.sortId)
        .sort((a, b) => b.sortId - a.sortId)
        .slice(0, 8);

      setNotifications(latestNotifications);
    } catch (error) {
      console.error("Notification Error:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    setShowDropdown(false);

    if (notification.route) {
      navigate(notification.route);
    }
  };

  return (
    <div className="notification-wrapper" ref={notificationRef}>
      <button
        type="button"
        className="notification-btn"
        onClick={() => {
          setShowDropdown(!showDropdown);
          fetchNotifications();
        }}
      >
        🔔

        {notifications.length > 0 && (
          <span className="notification-count">{notifications.length}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">Live Notifications</div>

          {loading ? (
            <div className="notification-empty">Loading...</div>
          ) : notifications.length > 0 ? (
            notifications.map((item) => (
              <button
                type="button"
                className="notification-item"
                key={item.id}
                onClick={() => handleNotificationClick(item)}
              >
                <h5>{item.title}</h5>
                <p>{item.message}</p>
                <small>{item.module}</small>
              </button>
            ))
          ) : (
            <div className="notification-empty">No Notifications</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notification;