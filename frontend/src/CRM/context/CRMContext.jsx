import { createContext, useContext, useState } from "react";

const CRMContext = createContext();

export function CRMProvider({ children }) {

  /* =========================
     GLOBAL STATE
  ========================= */

  const [customers, setCustomers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [notifications, setNotifications] = useState([]);

  /* =========================
     CUSTOMER ACTIONS
  ========================= */

  const addCustomer = (customer) => {
    setCustomers((prev) => [
      ...prev,
      { id: Date.now(), ...customer },
    ]);
  };

  const deleteCustomer = (id) => {
    setCustomers((prev) =>
      prev.filter((c) => c.id !== id)
    );
  };

  const updateCustomer = (updated) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === updated.id ? updated : c
      )
    );
  };

  /* =========================
     CONTACT ACTIONS
  ========================= */

  const addContact = (contact) => {
    setContacts((prev) => [
      ...prev,
      { id: Date.now(), ...contact },
    ]);
  };

  const deleteContact = (id) => {
    setContacts((prev) =>
      prev.filter((c) => c.id !== id)
    );
  };



  /* =========================
     INVOICE ACTIONS
  ========================= */

  const addInvoice = (invoice) => {
    setInvoices((prev) => [
      ...prev,
      { id: Date.now(), ...invoice },
    ]);
  };

  const updateInvoice = (updated) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === updated.id ? updated : inv
      )
    );
  };

  /* =========================
     SIDEBAR
  ========================= */

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  /* =========================
     VALUE
  ========================= */

  return (
    <CRMContext.Provider
      value={{
        customers,
        contacts,
        invoices,
        tickets,

        addCustomer,
        deleteCustomer,
        updateCustomer,

        addContact,
        deleteContact,

        addInvoice,
        updateInvoice,

        sidebarOpen,
        toggleSidebar,

        notifications,
        setNotifications,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

/* =========================
   CUSTOM HOOK
========================= */

export const useCRM = () => useContext(CRMContext);