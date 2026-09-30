import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminSubNav.css';

const AdminSubNav = () => {
  const menuItems = [
    { name: 'Suppliers', path: '/admin/suppliers', icon: 'fas fa-truck-loading' },
    { name: 'Orders', path: '/admin/orders', icon: 'fas fa-shopping-bag' },
    { name: 'Coins Converter', path: '/admin/coins', icon: 'fas fa-coins' },
    { name: 'Payment History', path: '/admin/payments', icon: 'fas fa-history' },
    { name: 'Categories', path: '/admin/categories', icon: 'fas fa-list' },
    { name: 'Product Lists', path: '/admin/products', icon: 'fas fa-box-open' },
    { name: 'Descriptions', path: '/admin/descriptions', icon: 'fas fa-file-alt' },
    { name: 'Contact Card', path: '/admin/contact-card', icon: 'fas fa-address-card' },
    { name: 'Footer Config', path: '/admin/footer', icon: 'fas fa-shoe-prints' },
  ];

  return (
    <div className="admin-subnav">
      <div className="subnav-scroll-container">
        {menuItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path} 
            className={({ isActive }) => isActive ? 'subnav-link active' : 'subnav-link'}
          >
            <i className={item.icon}></i>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default AdminSubNav;
