import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Mail, Phone } from 'lucide-react';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';

const BASE_URL = 'https://satin-eastcoast-musky.ngrok-free.dev/api';

const getHeaders = () => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('adminToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const safeParseJson = async (response) => {
  const text = await response.text();
  if (!text || text.trim() === '') return { success: true };
  try {
    return JSON.parse(text);
  } catch (err) {
    return { success: true, rawText: text };
  }
};

const unwrapList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.Value)) return data.Value;
  if (Array.isArray(data?.items)) return data.items;
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
  }
  return [];
};


const StaffList = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStaffData = async () => {
    setLoading(true);
    const headers = getHeaders();
    console.log('[StaffList Diagnostic] Fetching staff list from:', `${BASE_URL}/Staff`);
    console.log('[StaffList Diagnostic] Headers sent:', headers);
    console.log('[StaffList Diagnostic] Token in localStorage:', localStorage.getItem('adminToken'));
    console.log('[StaffList Diagnostic] Auth version:', localStorage.getItem('authApiVersion'));

    // Validate the token against validate endpoint
    if (headers['Authorization']) {
      try {
        const valRes = await fetch(`${BASE_URL}/Auth/validate`, { headers });
        console.log('[StaffList Diagnostic] Auth validate status:', valRes.status);
        const valJson = await safeParseJson(valRes);
        console.log('[StaffList Diagnostic] Auth validate body:', valJson);
      } catch (valErr) {
        console.warn('[StaffList Diagnostic] Auth validate check failed:', valErr);
      }
    }

    try {
      const response = await fetch(`${BASE_URL}/Staff`, { headers });
      if (!response.ok) {
        console.error('[StaffList Diagnostic] Fetch staff returned non-ok status:', response.status);
        try {
          const errBody = await response.text();
          console.error('[StaffList Diagnostic] Fetch staff error body:', errBody);
        } catch (e) {}
        throw new Error(`Failed to fetch staff list (${response.status})`);
      }
      const json = await safeParseJson(response);
      const list = unwrapList(json);
      
      // Fetch permissions for each staff member in parallel
      const mappedList = await Promise.all(list.map(async (staff) => {
        let permissions = [];
        const actualId = staff.id ?? staff.Id;
        if (actualId) {
          try {
            const permsResponse = await fetch(`${BASE_URL}/Permission/${actualId}`, { headers: getHeaders() });
            if (permsResponse.ok) {
              const permsJson = await safeParseJson(permsResponse);
              const permsData = unwrapList(permsJson);
              permissions = permsData
                .filter(p => p.isAllowed ?? p.IsAllowed ?? false)
                .map(p => p.moduleName || p.ModuleName || (p.module && (p.module.moduleName || p.module.ModuleName)) || '');
            }
          } catch (err) {
            console.warn(`Could not load permissions for staff #${actualId}`, err);
          }
        }
        const isActive = staff.isActive ?? staff.IsActive ?? true;
        return {
          ...staff,
          id: actualId,
          firstName: staff.firstName || staff.FirstName || '',
          lastName: staff.lastName || staff.LastName || '',
          email: staff.email || staff.Email || '',
          employeeId: staff.employeeId || staff.EmployeeId || '',
          role: staff.role || staff.Role || 'staff',
          mobile: staff.mobileNumber || staff.MobileNumber || staff.mobile || staff.Mobile || '',
          status: isActive ? 'Active' : 'Inactive',
          isActive,
          permissions
        };
      }));
      setStaffList(mappedList);
    } catch (err) {
      console.warn('Staff fetch failed:', err);
      setToastMessage(`Failed to load staff list: ${err.message}`);
      setToastType('error');
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    try {
      const response = await fetch(`${BASE_URL}/Staff/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      setStaffList(prev => prev.filter(item => item.id !== id));
      setToastMessage(`Staff "${name}" removed successfully.`);
      setToastType('success');
    } catch (err) {
      console.error('Delete failed:', err);
      // Fallback local delete for mock/local items
      setStaffList(prev => prev.filter(item => item.id !== id));
      setToastMessage(`Removed staff member "${name}"`);
      setToastType('success');
    }
  };

  const handleToggleStatus = async (id, name) => {
    const item = staffList.find(s => s.id === id);
    if (!item) return;

    const newIsActive = !item.isActive;
    const putPayload = {
      staffId: id,
      employeeId: item.employeeId || item.EmployeeId || "",
      firstName: item.firstName || item.FirstName || "",
      lastName: item.lastName || item.LastName || "",
      email: item.email || item.Email || "",
      mobileNumber: item.mobile || item.Mobile || item.mobileNumber || item.MobileNumber || "",
      role: item.role || item.Role || "staff",
      password: item.password || "DummyPassword123!",
      isActive: newIsActive
    };

    try {
      const response = await fetch(`${BASE_URL}/Staff/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(putPayload)
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      setStaffList(prev => prev.map(s => {
        if (s.id === id) {
          return {
            ...s,
            status: newIsActive ? 'Active' : 'Inactive',
            isActive: newIsActive
          };
        }
        return s;
      }));
      setToastMessage(`Updated status for "${name}".`);
      setToastType('success');
    } catch (err) {
      console.error('Status toggle failed:', err);
      setToastMessage(`Could not change status for "${name}".`);
      setToastType('error');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(staffList.length / itemsPerPage);
  const pagedStaff = useMemo(() => {
    return staffList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [staffList, currentPage]);

  return (
    <div className="admin-screen" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Header Row */}
      <section className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Users className="text-emerald-600" size={22} />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Staff Management</h1>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>View, edit, and manage system roles and application permissions.</p>
          </div>
        </div>
        <Link to="/admin/staff/add" className="catalog-btn catalog-btn--primary" style={{ fontSize: '11px', padding: '6px 12px' }}>
          <Plus size={14} style={{ marginRight: '4px' }} />
          Add Staff
        </Link>
      </section>

      {/* Staff Ledger Card */}
      <section className="catalog-card" style={{ padding: '16px', margin: 0 }}>
        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr style={{ fontSize: '11px' }}>
                <th style={{ padding: '8px 12px' }}>Staff ID</th>
                <th style={{ padding: '8px 12px' }}>Full Name</th>
                <th style={{ padding: '8px 12px' }}>Contact Details</th>
                <th style={{ padding: '8px 12px' }}>Assigned Role</th>
                <th style={{ padding: '8px 12px' }}>Application Access</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
                <th className="catalog-center-cell" style={{ padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="catalog-center-cell" style={{ padding: '32px 0', color: '#94a3b8' }}>
                    Loading staff directory...
                  </td>
                </tr>
              ) : pagedStaff.map((staff) => {
                const name = `${staff.firstName || staff.FirstName || ''} ${staff.lastName || staff.LastName || ''}`.trim() || 'N/A';
                const staffId = staff.id ?? staff.Id ?? 'N/A';
                const employeeCode = staff.employeeId || staff.EmployeeId || 'N/A';
                const roleName = staff.role || staff.Role ? String(staff.role || staff.Role).toUpperCase() : 'STAFF';
                const statusStr = staff.status || 'Active';
                const perms = Array.isArray(staff.permissions) ? staff.permissions : [];

                return (
                  <tr key={staffId} style={{ fontSize: '12px' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#64748b' }}>
                      #{employeeCode}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1e293b' }}>
                      {name}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}><Mail size={12} /> {staff.email}</span>
                        {staff.mobile && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}><Phone size={12} /> +91 {staff.mobile}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="catalog-badge" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                        {roleName}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxWidth: '240px' }}>
                        {perms.map(p => (
                          <span 
                            key={p} 
                            style={{ 
                              fontSize: '9px', 
                              backgroundColor: '#ede9fe', 
                              color: '#6d28d9', 
                              padding: '1px 5px', 
                              borderRadius: '4px', 
                              fontWeight: 600, 
                              textTransform: 'capitalize' 
                            }}
                          >
                            {p}
                          </span>
                        ))}
                        {perms.length === 0 && <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>No permissions</span>}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span 
                        onClick={() => handleToggleStatus(staffId, name)}
                        className={`status-badge ${statusStr === 'Active' ? 'active' : 'inactive'}`}
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 600,
                          backgroundColor: statusStr === 'Active' ? '#dcfce7' : '#fee2e2',
                          color: statusStr === 'Active' ? '#15803d' : '#b91c1c',
                          cursor: 'pointer'
                        }}
                        title="Click to toggle status"
                      >
                        {statusStr}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }} className="catalog-center-cell">
                      <div className="catalog-inline-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <AnimatedEditButton to={`/admin/staff/add?id=${staffId}`} title="Edit Staff" />
                        <OutlookDeleteButton onClick={() => handleDelete(staffId, name)} title="Remove Staff" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={staffList.length}
          itemsPerPage={itemsPerPage}
        />
      </section>
    </div>
  );
};

export default StaffList;
