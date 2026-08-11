import CloseButton from '../common/CloseButton';
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ButtonLoader, PageLoader } from '../common/Loader';
import Modal from '../../common/Modal';
import { validateZipCodeInput, formatPhoneNumber } from '../../utils/formValidation';

const SupporterForm = ({ supporter, onClose, onSubmit, isPublicForm = false }) => {
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: supporter?.firstName || '',
    last_name: supporter?.lastName || '',
    address: supporter?.address || '',
    city: supporter?.city || '',
    state: supporter?.state || '',
    zip_code: supporter?.zipCode || '',
    phone: supporter?.phone || '',
    email: supporter?.email || ''
  });

  const firstNameRef = useRef(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (supporter) {
      setFormData({
        first_name: supporter.firstName || '',
        last_name: supporter.lastName || '',
        address: supporter.address || '',
        city: supporter.city || '',
        state: supporter.state || '',
        zip_code: supporter.zipCode || '',
        phone: supporter.phone || '',
        email: supporter.email || ''
      });
    }
    setFormLoading(false);
  }, [supporter]);

  const handlePhoneChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formattedNumber });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = `${process.env.REACT_APP_API_URL}/supporters${supporter ? `/${supporter.id}` : ''}`;
      const method = supporter ? 'put' : 'post';

      let headers = {};
      if (!isPublicForm) {
        headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
      }

      // For public form, we're using a special public endpoint
      const apiUrl = isPublicForm
        ? `${process.env.REACT_APP_API_URL}/public/supporters`
        : url;

      const response = await axios[isPublicForm ? 'post' : method](apiUrl, formData, { headers });

      if (onSubmit) {
        onSubmit(response.data.id);
      }

      if (!supporter && !isPublicForm) {
        setShowModal(true);
      } else if (!isPublicForm) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving supporter:', error);
      alert('Failed to save supporter information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAdding = () => {
    setFormData({
      first_name: '',
      last_name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      email: ''
    });
    setShowModal(false);
    setTimeout(() => {
      if (firstNameRef.current) {
        firstNameRef.current.focus();
      }
    }, 0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    onClose();
  };

  if (formLoading) {
    return <PageLoader />;
  }

  return (
    <div className="px-2 py-4 max-w-2xl mx-auto relative">
      <CloseButton onClick={onClose} />
      <h2 className="text-xl font-bold mb-4 text-center">
        {isPublicForm
          ? 'Church Supporter Registration'
          : (supporter ? 'Edit Supporter' : 'Add Supporter Profile')}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-x-4 gap-y-4">
          {/* Form fields */}
          <div className="col-span-12 md:col-span-3 flex items-center">
            <label className="block text-sm font-medium text-gray-700">Name</label>
          </div>
          <div className="col-span-12 md:col-span-4">
            <input
              type="text"
              required
              placeholder=""
              value={formData.first_name}
              ref={firstNameRef}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-2 py-1 border border-gray-600"
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <input
              type="text"
              required
              placeholder=""
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-2 py-1 border border-gray-600"
            />
          </div>
          <div className="col-span-12 md:col-span-1"></div>

          <div className="col-span-12 md:col-span-3 flex items-center">
            <label className="block text-sm font-medium text-gray-700">Address</label>
          </div>
          <div className="col-span-12 md:col-span-9">
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-2 py-1 border border-gray-600"
            />
          </div>

          <div className="col-span-12 md:col-span-3 flex items-center">
            <label className="block text-sm font-medium text-gray-700">City</label>
          </div>
          <div className="col-span-12 md:col-span-9 flex flex-col md:flex-row md:items-center gap-2">
            <input
              type="text"
              className="flex-grow border border-gray-600 px-2 py-1 w-full md:w-auto"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <div className="flex flex-col md:flex-row md:items-center w-full md:w-auto">
              <span className="text-sm font-medium md:mr-2 mb-1 md:mb-0">State</span>
              <input
                type="text"
                className="w-full md:w-12 border border-gray-600 px-2 py-1"
                value={formData.state}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().slice(0, 2);
                  setFormData({ ...formData, state: value });
                }}
                maxLength={2}
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-center w-full md:w-auto">
              <span className="text-sm font-medium md:mr-2 mb-1 md:mb-0">Zip</span>
              <input
                type="text"
                className="w-full md:w-20 border border-gray-600 px-2 py-1"
                value={formData.zip_code}
                onChange={(e) => {
                  const numericValue = validateZipCodeInput(e.target.value);
                  setFormData({ ...formData, zip_code: numericValue });
                }}
                maxLength={5}
                pattern="[0-9]{5}"
                placeholder=""
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-3 flex items-center">
            <label className="block text-sm font-medium text-gray-700">Phone</label>
          </div>
          <div className="col-span-12 md:col-span-4">
            <input
              type="text"
              className="w-full border border-gray-600 px-2 py-1"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder=""
            />
          </div>
          
          <div className="col-span-12 md:col-span-1 flex items-center justify-end">
             <label className="block text-sm font-medium text-gray-700">Email</label>
          </div>
          <div className="col-span-12 md:col-span-4">
             <input
                type="email"
                className="w-full border border-gray-600 px-2 py-1"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
          </div>

        </div>

        <div className="flex space-x-2 mt-6 justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent text-sm font-medium text-black bg-white hover:bg-gray-100 border-black"
          >
            {loading ? <ButtonLoader /> : (supporter ? 'Edit' : 'Add')}
          </button>
        </div>
      </form>

      {showModal && !isPublicForm && (
        <Modal onClose={handleCloseModal}>
          <h2 className="text-lg font-bold">Success!</h2>
          <p>Supporter added successfully! Do you want to add another?</p>
          <div className="flex justify-end mt-4">
            <button onClick={handleContinueAdding} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add
            </button>
            <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 ml-2">
              Exit
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SupporterForm;
