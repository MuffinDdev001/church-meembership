import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PageLoader } from '../common/Loader';
import SupporterForm from './SupporterForm';
import { useAuth } from '../../contexts/AuthContext';

const SupporterDropdown = () => {
  const [supporters, setSupporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupporter, setSelectedSupporter] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const dropdownRef = useRef(null);
  const { hasDeleteAccess, hasAddAccess, currentUser, shouldSeeOnlyOwnData } = useAuth();

  useEffect(() => {
    fetchSupporters();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const fetchSupporters = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/supporters`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          ownDataOnly: shouldSeeOnlyOwnData('supporter') ? 'true' : 'false',
          userId: currentUser?.id
        }
      });
      setSupporters(response.data);

      // If user can only see their own data and has data, auto-select it
      if (shouldSeeOnlyOwnData('supporter') && response.data.length === 1) {
        setSelectedSupporter(response.data[0]);
        setSearchTerm(`${response.data[0].lastName} ${response.data[0].firstName}`);
      }
    } catch (error) {
      console.error('Error fetching supporters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSupporters = supporters.filter(supporter => {
    const fullName = `${supporter.lastName} ${supporter.firstName}`.toLowerCase();
    const supporterNumber = supporter.supporterNumber?.toString() || '';
    return fullName.includes(searchTerm.toLowerCase()) || supporterNumber.includes(searchTerm);
  });

  const handleSelectSupporter = (supporter) => {
    setSelectedSupporter(supporter);
    setShowDropdown(false);
    setSearchTerm(`${supporter.lastName} ${supporter.firstName}`);
  };

  const handleInputClick = () => {
    setShowDropdown(true);
  };

  const handleAddSupporter = () => {
    setSelectedSupporter(null);
    setShowForm(true);
  };

  const handleSupporterAdded = async (newSupporterId) => {
    try {
      // Refresh the supporters list
      await fetchSupporters();

      // Get the newly added supporter details
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/supporters/${newSupporterId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const newSupporter = response.data;

      // Select the new supporter
      setSelectedSupporter(newSupporter);
      setSearchTerm(`${newSupporter.lastName} ${newSupporter.firstName}`);

      // Show success notification
      setNotification({
        show: true,
        message: `${newSupporter.lastName} ${newSupporter.firstName} was successfully added!`,
        type: 'success'
      });

      // Close the form
      setShowForm(false);
    } catch (error) {
      console.error('Error fetching new supporter details:', error);
      setNotification({
        show: true,
        message: 'Supporter was added but could not display details.',
        type: 'warning'
      });
      await fetchSupporters();
      setShowForm(false);
    }
  };

  const handleEditSupporter = () => {
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeleteSupporter = async () => {
    if (window.confirm('Are you sure you want to delete this supporter?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/supporters/${selectedSupporter.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        // Show success notification
        setNotification({
          show: true,
          message: `${selectedSupporter.lastName} ${selectedSupporter.firstName} was successfully deleted!`,
          type: 'success'
        });

        // Clear selection and refresh list
        setSelectedSupporter(null);
        setSearchTerm('');
        await fetchSupporters();
      } catch (error) {
        console.error('Error deleting supporter:', error);
        setNotification({
          show: true,
          message: 'Error deleting supporter.',
          type: 'error'
        });
      }
    }
  };

  const handleFormSubmit = async (supporterId) => {
    try {
      await fetchSupporters();
      if (isEditing) {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/supporters/${supporterId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const updatedSupporter = response.data;
        setSelectedSupporter(updatedSupporter);
        setSearchTerm(`${updatedSupporter.lastName} ${updatedSupporter.firstName}`);
        setNotification({
          show: true,
          message: `${updatedSupporter.lastName} was successfully updated!`,
          type: 'success'
        });
      } else {
        await handleSupporterAdded(supporterId);
      }
      setShowForm(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating supporter details:', error);
      setNotification({
        show: true,
        message: 'Error updating supporter details.',
        type: 'error'
      });
    }
  };

  const handleCancel = () => {
    setSearchTerm('');
    setSelectedSupporter(null);
    setShowDropdown(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {notification.show && (
        <div className={`mb-4 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Supporter Lookup</h1>

        {shouldSeeOnlyOwnData('supporter') && (
          <div className="mb-4 bg-purple-50 border-l-4 border-purple-500 p-4 text-purple-700">
            <p>You are viewing your supporter data only. Contact an administrator if you need access to other records.</p>
          </div>
        )}

        {loading ? (
          <PageLoader />
        ) : (
          <>
            <div className="flex mb-8 items-end gap-2 w-full justify-center">
              <div className="relative" ref={dropdownRef} style={{ width: '300px' }}>
                <div className="flex">
                  <input
                    type="text"
                    className="w-full p-2 border border-black focus:outline-none"
                    placeholder=""
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={handleInputClick}
                  />
                </div>

                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 border border-gray-300 rounded-sm py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                    {filteredSupporters.length > 0 ? (
                      filteredSupporters.map((supporter) => (
                        <div
                          key={supporter.id}
                          className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectSupporter(supporter)}
                        >
                          <div>
                            {supporter.lastName}, {supporter.firstName}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">No supporters found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="bg-white text-black px-4 py-2 border border-black hover:bg-gray-100 focus:outline-none"
                >
                  Cancel
                </button>
                {hasAddAccess('supporter') && (
                  <button
                    onClick={handleAddSupporter}
                    className="bg-white text-black px-4 py-2 border border-black hover:bg-gray-100 focus:outline-none"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>

            {selectedSupporter && (
              <div className="w-full mt-4">
                <div className="bg-gray-50 p-6 rounded-lg text-center border border-gray-200">
                  <h2 className="text-xl font-bold mb-4">
                    {selectedSupporter.lastName}, {selectedSupporter.firstName}
                  </h2>

                  <div className="text-left max-w-md mx-auto">
                    <p className="mb-1"><span className="font-medium">Supporter #:</span> {selectedSupporter.supporterNumber}</p>
                    <p className="mb-1"><span className="font-medium">Email:</span> {selectedSupporter.email || 'N/A'}</p>
                    <p className="mb-1"><span className="font-medium">Phone:</span> {selectedSupporter.phone || 'N/A'}</p>
                    <p className="mb-1">
                      <span className="font-medium">Address:</span>{' '}
                      {[
                        selectedSupporter.address,
                        selectedSupporter.city,
                        selectedSupporter.state,
                        selectedSupporter.zipCode
                      ].filter(Boolean).join(', ') || 'N/A'}
                    </p>
                  </div>

                  <div className="flex justify-center space-x-3 mt-6">
                    {/* Show Edit button if user has add access OR if it's their own record */}
                    {(hasAddAccess('supporter') || (currentUser && currentUser.supporterId === selectedSupporter.id)) && (
                      <button
                        onClick={handleEditSupporter}
                        className="px-6 py-2 bg-white text-black border border-black hover:bg-gray-100 font-medium"
                      >
                        Edit
                      </button>
                    )}

                    {/* Show Delete button if user has delete access OR if it's their own record */}
                    {(hasDeleteAccess('supporter') || (currentUser && currentUser.supporterId === selectedSupporter.id)) && (
                      <button
                        onClick={handleDeleteSupporter}
                        className="px-6 py-2 bg-white text-red-600 border border-red-600 hover:bg-red-50 font-medium"
                      >
                        Delete
                      </button>
                    )}

                    {/* Show "Your record" indicator if it's the user's own record */}
                    {currentUser && currentUser.supporterId === selectedSupporter.id && (
                      <span className="ml-2 inline-flex items-center px-3 py-1 text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        Your record
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 border shadow-lg rounded-md bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <SupporterForm
              supporter={isEditing ? selectedSupporter : null}
              onClose={() => {
                setShowForm(false);
                setIsEditing(false);
                fetchSupporters();
              }}
              onSubmit={handleFormSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SupporterDropdown;
