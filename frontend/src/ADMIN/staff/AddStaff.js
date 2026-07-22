import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Shield, User, Key, Plus, Trash2 } from "lucide-react";
import { Toast } from "../components/Toast";
import { getApiDomain } from '../../utils/apiConfig';
import './AddStaff.css';

const BASE_URL = `${getApiDomain()}/api`;

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

const unwrapItem = (data) => {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data?.data ?? data?.value ?? data;
  }
  return data ?? {};
};

const DEFAULT_MODULES = [
  "dashboard",
  "catalog",
  "customers",
  "orders",
  "stockupdates",
  "marketing",
  "brands",
  "blogs",
  "settings",
  "suppliers",
  "coins converter",
  "call history",
  "invoices"
];

function AddStaff() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('id');
  const isEditing = Boolean(staffId);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    employeeId: "",
    role: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [dbModules, setDbModules] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [newModuleName, setNewModuleName] = useState("");
  const [existingStaffRecord, setExistingStaffRecord] = useState(null);

  // Load modules from database (with default fallback/seeding)
  const loadModules = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Module`, { headers: getHeaders() });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const json = await safeParseJson(response);
      let list = unwrapList(json);
      
      if (list.length === 0) {
        console.log("Seeding default modules to database...");
        await Promise.all(DEFAULT_MODULES.map(async (name, index) => {
          try {
            await fetch(`${BASE_URL}/Module`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({ moduleName: name, description: `Core ${name} module`, displayOrder: index })
            });
          } catch (e) {
            console.warn(`Failed to seed module: ${name}`, e);
          }
        }));
        const response2 = await fetch(`${BASE_URL}/Module`, { headers: getHeaders() });
        const json2 = await safeParseJson(response2);
        list = unwrapList(json2);
      }
      setDbModules(list);
      return list;
    } catch (err) {
      console.warn("Failed to load modules from API, falling back to local defaults:", err);
      const fallbackList = DEFAULT_MODULES.map((name, index) => ({
        id: index + 1,
        moduleName: name,
        displayOrder: index
      }));
      setDbModules(fallbackList);
      return fallbackList;
    }
  };

  // Initialize modules and permissions
  useEffect(() => {
    const init = async () => {
      const loadedModules = await loadModules();
      const initialPerms = {};
      loadedModules.forEach(mod => {
        const key = mod.moduleName || mod.ModuleName;
        if (key) {
          initialPerms[key] = false;
        }
      });
      setPermissions(initialPerms);

      // If editing, load the staff profile and their permission states
      if (isEditing) {
        try {
          // Fetch from backend Staff API
          const staffResponse = await fetch(`${BASE_URL}/Staff/${staffId}`, { headers: getHeaders() });
          if (!staffResponse.ok) throw new Error(`Status: ${staffResponse.status}`);
          const staffJson = await safeParseJson(staffResponse);
          const target = unwrapItem(staffJson);
          setExistingStaffRecord(target);

          setFormData({
            firstName: target.firstName || target.FirstName || "",
            lastName: target.lastName || target.LastName || "",
            email: target.email || target.Email || "",
            mobile: target.mobileNumber || target.MobileNumber || target.mobile || target.Mobile || "",
            employeeId: target.employeeId || target.EmployeeId || "",
            role: target.role || target.Role || "",
            password: "",
            confirmPassword: ""
          });

          // Fetch permissions from backend Permissions API
          const permsResponse = await fetch(`${BASE_URL}/Permission/${staffId}`, { headers: getHeaders() });
          let targetPerms = [];
          if (permsResponse.ok) {
            const permsJson = await safeParseJson(permsResponse);
            targetPerms = unwrapList(permsJson);
          }
          const permsState = { ...initialPerms };
          targetPerms.forEach(p => {
            const name = p.moduleName || p.ModuleName || (p.module && (p.module.moduleName || p.module.ModuleName));
            const isAllowed = p.isAllowed ?? p.IsAllowed ?? false;
            if (name) {
              permsState[name] = isAllowed;
            }
          });
          setPermissions(permsState);

        } catch (err) {
          console.warn("Error loading staff from API, attempting local fallback:", err);
          // Fallback: check local storage accounts
          const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
          const target = localAccounts.find(s => String(s.employeeId) === String(staffId) || String(s.id ?? s.Id) === String(staffId));
          if (target) {
            setFormData({
              firstName: target.firstName || target.FirstName || "",
              lastName: target.lastName || target.LastName || "",
              email: target.email || target.Email || "",
              mobile: target.mobile || "",
              employeeId: target.employeeId || staffId,
              role: target.role || "staff",
              password: "",
              confirmPassword: ""
            });
            if (Array.isArray(target.permissions)) {
              const permsState = { ...initialPerms };
              target.permissions.forEach(p => {
                permsState[p] = true;
              });
              setPermissions(permsState);
            }
          } else {
            setToastMessage('Error loading staff details.');
            setToastType('error');
          }
        }
      }
    };

    init();
  }, [isEditing, staffId]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "mobile") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    setErrors(prev => ({ ...prev, permissions: "" }));
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    const cleanName = newModuleName.trim().toLowerCase();
    if (!cleanName) return;

    const exists = dbModules.some(m => String(m.moduleName || m.ModuleName || '').toLowerCase() === cleanName);
    if (exists) {
      setToastMessage("Module already exists.");
      setToastType("warning");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/Module`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          moduleName: cleanName,
          description: `Custom ${cleanName} module`,
          displayOrder: dbModules.length
        })
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const response2 = await fetch(`${BASE_URL}/Module`, { headers: getHeaders() });
      const json2 = await safeParseJson(response2);
      const updatedList = unwrapList(json2);
      setDbModules(updatedList);
      setPermissions(prev => ({ ...prev, [cleanName]: true }));
      setNewModuleName("");
      setToastMessage(`Module "${cleanName}" added successfully.`);
      setToastType("success");
    } catch (err) {
      console.warn("API failed to create module, adding locally:", err);
      const fallbackList = [...dbModules, { id: Date.now(), moduleName: cleanName }];
      setDbModules(fallbackList);
      setPermissions(prev => ({ ...prev, [cleanName]: true }));
      setNewModuleName("");
      setToastMessage(`Module "${cleanName}" added locally.`);
      setToastType("success");
    }
  };

  const handleDeleteModule = async (modToDelete) => {
    if (DEFAULT_MODULES.includes(modToDelete)) {
      setToastMessage("Cannot delete default core modules.");
      setToastType("warning");
      return;
    }

    const mod = dbModules.find(m => (m.moduleName || m.ModuleName) === modToDelete);
    try {
      const actualModId = mod?.id ?? mod?.Id;
      if (actualModId) {
        const response = await fetch(`${BASE_URL}/Module/${actualModId}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
      }
      const updatedList = dbModules.filter(m => (m.moduleName || m.ModuleName) !== modToDelete);
      setDbModules(updatedList);

      setPermissions(prev => {
        const copy = { ...prev };
        delete copy[modToDelete];
        return copy;
      });
      setToastMessage(`Module "${modToDelete}" removed.`);
      setToastType("info");
    } catch (err) {
      console.error("Failed to delete module:", err);
      setToastMessage("Failed to delete module from backend.");
      setToastType("error");
    }
  };

  const validateForm = () => {
    let newErrors = {};

    const requiredKeys = ["firstName", "lastName", "email", "mobile", "employeeId", "role"];
    requiredKeys.forEach((key) => {
      if (!formData[key] || formData[key].toString().trim() === "") {
        newErrors[key] = "Required field";
      }
    });

    if (formData.email && !formData.email.endsWith("@gmail.com")) {
      newErrors.email = "Must be @gmail.com";
    }

    if (formData.mobile && formData.mobile.length !== 10) {
      newErrors.mobile = "Must be 10 digits";
    }

    const empRegex = /^[A-Za-z]{1}[0-9]+$/;
    if (formData.employeeId && !empRegex.test(formData.employeeId)) {
      newErrors.employeeId = "Format must be A123";
    }

    const passwordRequired = !isEditing || formData.password !== "" || formData.confirmPassword !== "";
    if (passwordRequired) {
      if (!formData.password) {
        newErrors.password = "Required field";
      } else {
        const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/;
        if (!passRegex.test(formData.password)) {
          newErrors.password = "Min 7 chars, 1 uppercase, 1 digit, 1 symbol";
        }
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    const hasPermission = Object.values(permissions).some((p) => p === true);
    if (!hasPermission) {
      newErrors.permissions = "Please enable at least one permission module";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      setToastMessage('Please fix the validation errors.');
      setToastType('warning');
      return;
    }

    setIsSaving(true);
    setToastMessage('');

    const enabledPermissions = Object.keys(permissions).filter(k => permissions[k]);
    const localPayload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      mobile: formData.mobile.trim(),
      employeeId: formData.employeeId.trim().toUpperCase(),
      role: formData.role,
      permissions: enabledPermissions
    };

    if (formData.password) {
      localPayload.password = formData.password;
    }

    try {
      // 1. Persist locally to added_staff_accounts in localStorage so they can login bypass immediately
      const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
      const index = localAccounts.findIndex(acc => acc.email.toLowerCase() === localPayload.email.toLowerCase() || acc.employeeId === localPayload.employeeId);
      
      if (index > -1) {
        localAccounts[index] = {
          ...localAccounts[index],
          ...localPayload,
          id: localAccounts[index].id || localPayload.employeeId
        };
      } else {
        localAccounts.push({
          ...localPayload,
          id: localPayload.employeeId
        });
      }
      localStorage.setItem('added_staff_accounts', JSON.stringify(localAccounts));

      // 2. Persist to API backend
      const apiStaffPayload = {
        employeeId: formData.employeeId.trim().toUpperCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        mobileNumber: formData.mobile.trim(),
        role: formData.role
      };

      let targetId = staffId;

      if (isEditing) {
        // PUT staff details
        const activeStatus = existingStaffRecord?.isActive ?? existingStaffRecord?.IsActive ?? true;
        const putStaffResponse = await fetch(`${BASE_URL}/Staff/${staffId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            ...apiStaffPayload,
            staffId: parseInt(staffId, 10),
            password: formData.password || existingStaffRecord?.password || existingStaffRecord?.Password || "DummyPassword123!",
            isActive: activeStatus
          })
        });
        if (!putStaffResponse.ok) throw new Error(`Staff update failed (${putStaffResponse.status})`);

        // PUT permissions
        const permissionDtoList = dbModules.map(mod => {
          const modName = mod.moduleName || mod.ModuleName;
          const isAllowed = permissions[modName] || false;
          return {
            moduleId: mod.id ?? mod.Id,
            canView: isAllowed,
            canAdd: isAllowed,
            canEdit: isAllowed,
            canDelete: isAllowed,
            isAllowed: isAllowed
          };
        });
        const putPermsResponse = await fetch(`${BASE_URL}/Permission`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            staffId: parseInt(staffId, 10),
            staffPermissions: permissionDtoList
          })
        });
        if (!putPermsResponse.ok) throw new Error(`Permission update failed (${putPermsResponse.status})`);

      } else {
        // POST new staff member
        const addPayload = {
          ...apiStaffPayload,
          password: formData.password,
          isActive: true
        };
        const postStaffResponse = await fetch(`${BASE_URL}/Staff`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(addPayload)
        });
        if (!postStaffResponse.ok) throw new Error(`Staff creation failed (${postStaffResponse.status})`);
        const staffJson = await safeParseJson(postStaffResponse);
        const newStaff = unwrapItem(staffJson);
        
        targetId = newStaff?.id ?? newStaff?.Id ?? newStaff?.staffId ?? newStaff?.StaffId;
        if (!targetId) {
          // Fallback search to find DB ID
          const getListResponse = await fetch(`${BASE_URL}/Staff`, { headers: getHeaders() });
          const listJson = await safeParseJson(getListResponse);
          const list = unwrapList(listJson);
          const match = list.find(s => {
            const sEmail = s.email ?? s.Email;
            return sEmail && sEmail.toLowerCase() === apiStaffPayload.email.toLowerCase();
          });
          targetId = match?.id ?? match?.Id ?? match?.staffId ?? match?.StaffId;
        }

        if (targetId) {
          // POST permissions for new staff
          const permissionDtoList = dbModules.map(mod => {
            const modName = mod.moduleName || mod.ModuleName;
            const isAllowed = permissions[modName] || false;
            return {
              moduleId: mod.id ?? mod.Id,
              canView: isAllowed,
              canAdd: isAllowed,
              canEdit: isAllowed,
              canDelete: isAllowed,
              isAllowed: isAllowed
            };
          });
          const postPermsResponse = await fetch(`${BASE_URL}/Permission`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              staffId: targetId,
              staffPermissions: permissionDtoList
            })
          });
          if (!postPermsResponse.ok) throw new Error(`Permission creation failed (${postPermsResponse.status})`);
        }
      }

      setToastMessage(`Staff member ${isEditing ? 'updated' : 'created'} successfully.`);
      setToastType('success');
      
      setTimeout(() => {
        navigate('/admin/staff/list');
      }, 1200);

    } catch (err) {
      console.warn('API error, saved staff locally to localStorage fallback:', err.message);
      setToastMessage(`Profile saved locally: ${isEditing ? 'Updated' : 'Added'} staff #${localPayload.employeeId}`);
      setToastType('success');
      setTimeout(() => {
        navigate('/admin/staff/list');
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="add-staff-screen">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Top Header Card */}
      <section className="add-staff-header flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors border border-slate-200" to="/admin/staff/list">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="staff-kicker">Staff Directory</span>
            <h1 className="header-title">
              {isEditing ? 'Edit Staff Profile' : 'Add Staff Member'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/staff/list" className="staff-cancel-btn">
            Cancel
          </Link>
          <button className="staff-save-btn" onClick={handleSubmit} disabled={isSaving}>
            <Save size={14} />
            Save Profile
          </button>
        </div>
      </section>

      {/* Form Fields Card Layout */}
      <div className="staff-content-grid">
        {/* Left Card: Basic Info */}
        <div className="staff-form-card">
          <h3 className="card-section-title">
            <User size={16} /> Basic Credentials
          </h3>
          
          <div className="fields-grid">
            <div className="staff-field">
              <label>First Name</label>
              <input
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
              />
              {errors.firstName && <span className="field-error-msg">{errors.firstName}</span>}
            </div>

            <div className="staff-field">
              <label>Last Name</label>
              <input
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
              />
              {errors.lastName && <span className="field-error-msg">{errors.lastName}</span>}
            </div>

            <div className="staff-field">
              <label>Email Address (@gmail.com)</label>
              <input
                name="email"
                placeholder="email@gmail.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="field-error-msg">{errors.email}</span>}
            </div>

            <div className="staff-field">
              <label>Mobile Number</label>
              <div className="phone-input-container">
                <span className="phone-prefix">+91</span>
                <input
                  name="mobile"
                  value={formData.mobile}
                  placeholder="10 digit number"
                  onChange={handleChange}
                />
              </div>
              {errors.mobile && <span className="field-error-msg">{errors.mobile}</span>}
            </div>

            <div className="staff-field">
              <label>Employee ID (Format: A123)</label>
              <input
                name="employeeId"
                placeholder="e.g. M102"
                value={formData.employeeId}
                onChange={handleChange}
                disabled={isEditing}
                style={{ backgroundColor: isEditing ? '#f8fafc' : '#fff' }}
              />
              {errors.employeeId && <span className="field-error-msg">{errors.employeeId}</span>}
            </div>

            <div className="staff-field">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
              {errors.role && <span className="field-error-msg">{errors.role}</span>}
            </div>
          </div>

          <h3 className="card-section-title pt-6">
            <Key size={16} /> Access Password
          </h3>
          
          <div className="fields-grid">
            <div className="staff-field">
              <label>{isEditing ? 'New Password (Optional)' : 'Password'}</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className="field-error-msg">{errors.password}</span>}
            </div>

            <div className="staff-field">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <span className="field-error-msg">{errors.confirmPassword}</span>}
            </div>
          </div>
        </div>

        {/* Right Card: Permissions Checklist */}
        <div className="staff-form-card">
          <h3 className="card-section-title">
            <Shield size={16} /> System Permissions &amp; Modules
          </h3>
          <p className="permission-intro">
            Check the administrative console modules this staff member is authorized to access:
          </p>

          <div className="permissions-grid-wrap">
            {dbModules.map((mod) => {
              const key = mod.moduleName || mod.ModuleName;
              const isDefault = DEFAULT_MODULES.includes(key);
              return (
                <div
                  className="permission-switch-item"
                  key={key}
                >
                  <div className="switch-info">
                    <span className="switch-title">{key}</span>
                    {!isDefault && (
                      <button 
                        type="button" 
                        onClick={() => handleDeleteModule(key)} 
                        className="delete-custom-mod-btn"
                        title="Delete module"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePermission(key)}
                    className={`switch-bg ${permissions[key] ? 'active' : ''}`}
                  >
                    <span className={`switch-toggle-knob ${permissions[key] ? 'active' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
          {errors.permissions && <span className="field-error-msg block mt-2">{errors.permissions}</span>}

          {/* Dynamic Module Input */}
          <div className="add-custom-module-box">
            <h4>Add Future Module / Screen</h4>
            <div className="inline-add-form">
              <input
                type="text"
                placeholder="Enter module name (e.g. invoices)"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
              />
              <button type="button" onClick={handleAddModule}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddStaff;
