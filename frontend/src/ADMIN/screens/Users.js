import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Trash2, RefreshCw } from 'lucide-react';

const API_BASE = "https://shyamagrotools.com/api/Auth";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/users`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setUsers(response.data);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setError("Failed to fetch users list.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await axios.delete(`${API_BASE}/delete-user/${id}`);
      setUsers(users.filter(u => u.id !== id));
      alert("User deleted successfully.");
    } catch (err) {
      console.error("Delete User Error:", err);
      alert("Failed to delete user.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="admin-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">User Management</h1>
          <p className="text-gray-500">View and manage all registered platform users.</p>
        </div>
        <button 
          onClick={fetchUsers} 
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-[#5eaa28] transition-colors"
          disabled={isLoading}
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">{error}</div>}

      <div className="bg-white border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-light border-b border-border">
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">User ID</th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Phone / Email</th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium">#{user.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User size={16} />
                    </div>
                    <span className="text-sm font-bold text-dark">{user.name || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-dark">{user.phoneNumber}</div>
                  <div className="text-xs text-gray-400">{user.email || 'No Email'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded">Active</span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => deleteUser(user.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-2"
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                  {isLoading ? 'Loading users...' : 'No users found in the system.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
