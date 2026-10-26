import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../common/Loader';
import UserForm from './UserForm';
import UserList from './UserList';
import AssignUserModal from './AssignUserModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { currentUser, hasAddAccess, hasDeleteAccess } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      try {
        setLoading(true);
        await axios.delete(`${process.env.REACT_APP_API_URL}/admin/users/${user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">System Administrator</h1>
            <div className="flex items-center space-x-2">
              {hasAddAccess('admin') && (
                <>
                  {/* Quick Assign System User button */}
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Assign System User
                  </button>
                  {/* Full Add User button */}
                  <button
                    onClick={handleAddUser}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add User
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading && !showUserForm ? (
            <div className="flex justify-center items-center h-64">
              <PageLoader />
            </div>
          ) : showUserForm ? (
            <UserForm
              user={selectedUser}
              onClose={() => setShowUserForm(false)}
              onSubmit={() => {
                setShowUserForm(false);
                fetchUsers();
              }}
            />
          ) : (
            <UserList
              users={users}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              showEditButton={hasAddAccess('admin')}
              showDeleteButton={hasDeleteAccess('admin')}
            />
          )}
        </div>
      </div>

      {/* Assign System User Modal */}
      {showAssignModal && (
        <AssignUserModal
          onClose={() => setShowAssignModal(false)}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};

export default UserManagement;