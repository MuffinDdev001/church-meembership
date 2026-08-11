import CloseButton from '../common/CloseButton';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import MaskedDateInput from '../common/MaskedDateInput';
import { ButtonLoader, PageLoader } from '../common/Loader';
import Modal from '../../common/Modal';

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderColor: 'black',
    boxShadow: 'none',
    '&:hover': { borderColor: 'black' },
    width: '250px',
  }),
};

const DonationForm = ({ donation, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [donorType, setDonorType] = useState('member'); // 'member' | 'visitor' | 'supporter'
  const [members, setMembers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [supporters, setSupporters] = useState([]);
  const [donationTypes, setDonationTypes] = useState([]);
  const [formData, setFormData] = useState({
    member_id: '',
    visitor_id: '',
    supporter_id: '',
    amount: '',
    donation_type: '',
    donation_date: new Date(),
    notes: ''
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        await Promise.all([fetchMembers(), fetchVisitors(), fetchSupporters(), fetchDonationTypes()]);
        if (donation) {
          const isVisitor = !!donation.visitorId;
          const isSupporter = !!donation.supporterId;
          setDonorType(isSupporter ? 'supporter' : isVisitor ? 'visitor' : 'member');
          setFormData({
            member_id: !isVisitor && !isSupporter && donation.memberId
              ? { value: donation.memberId, label: `${donation.member.lastName}, ${donation.member.firstName}` }
              : '',
            visitor_id: isVisitor && donation.visitorId
              ? { value: donation.visitorId, label: `${donation.visitor.lastName}, ${donation.visitor.firstName}` }
              : '',
            supporter_id: isSupporter && donation.supporterId
              ? { value: donation.supporterId, label: `${donation.supporter.lastName}, ${donation.supporter.firstName}` }
              : '',
            amount: donation.amount || '',
            donation_type: donation.donationType ? { value: donation.donationType, label: donation.donationType } : '',
            donation_date: donation.donationDate ? new Date(donation.donationDate) : null,
            notes: donation.notes || ''
          });
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setFormLoading(false);
      }
    };
    loadFormData();
  }, [donation]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/members`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMembers(response.data.map(m => ({ value: m.id, label: `${m.lastName}, ${m.firstName}` })));
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchVisitors = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/visitors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVisitors(response.data.map(v => ({ value: v.id, label: `${v.lastName}, ${v.firstName}` })));
    } catch (error) {
      console.error('Error fetching visitors:', error);
    }
  };

  const fetchSupporters = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/supporters`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSupporters(response.data.map(s => ({ value: s.id, label: `${s.lastName}, ${s.firstName}` })));
    } catch (error) {
      console.error('Error fetching supporters:', error);
    }
  };

  const fetchDonationTypes = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/donation-types`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDonationTypes(response.data.map(t => ({ value: t.name, label: t.name })));
    } catch (error) {
      console.error('Error fetching donation types:', error);
    }
  };

  const handleDonorTypeChange = (type) => {
    setDonorType(type);
    setFormData(prev => ({ ...prev, member_id: '', visitor_id: '', supporter_id: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (donorType === 'member' && (!formData.member_id || !formData.member_id.value)) {
      alert('Please select a valid member.');
      setLoading(false);
      return;
    }
    if (donorType === 'visitor' && (!formData.visitor_id || !formData.visitor_id.value)) {
      alert('Please select a valid visitor.');
      setLoading(false);
      return;
    }
    if (donorType === 'supporter' && (!formData.supporter_id || !formData.supporter_id.value)) {
      alert('Please select a valid supporter.');
      setLoading(false);
      return;
    }

    try {
      const url = `${process.env.REACT_APP_API_URL}/donations${donation ? `/${donation.id}` : ''}`;
      const method = donation ? 'put' : 'post';

      const donationData = {
        amount: formData.amount,
        donation_type: formData.donation_type.value.toString(),
        donation_date: formData.donation_date,
        notes: formData.notes,
        member_id: donorType === 'member' ? formData.member_id.value : null,
        visitor_id: donorType === 'visitor' ? formData.visitor_id.value : null,
        supporter_id: donorType === 'supporter' ? formData.supporter_id.value : null,
      };

      const response = await axios[method](url, donationData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (!donation) {
        setShowModal(true);
      } else {
        onSubmit(response.data?.id || donation.id);
      }
    } catch (error) {
      console.error('Error saving donation:', error);
      alert('Error saving donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAdding = () => {
    setFormData({ member_id: '', visitor_id: '', supporter_id: '', amount: '', donation_type: '', donation_date: new Date(), notes: '' });
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    onClose();
  };

  const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return value;
    return number.toFixed(2);
  };

  return (
    <div className="px-2 py-4 max-w-4xl mx-auto relative">
      <CloseButton onClick={onClose} />
      <h2 className="text-xl font-bold mb-4 text-center">
        {donation ? 'Edit Donation' : 'Add Donation Form'}
      </h2>

      {formLoading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <PageLoader />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-x-4 gap-y-2">

            {/* Donor Type Toggle */}
            <div className="col-span-3 flex items-center">
              <label className="block text-sm font-medium text-gray-700">Donor Type</label>
            </div>
            <div className="col-span-9 flex gap-2">
              <button
                type="button"
                onClick={() => handleDonorTypeChange('member')}
                className={`px-4 py-1 rounded border text-sm font-medium transition-colors ${
                  donorType === 'member'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100'
                }`}
              >
                Member
              </button>
              <button
                type="button"
                onClick={() => handleDonorTypeChange('visitor')}
                className={`px-4 py-1 rounded border text-sm font-medium transition-colors ${
                  donorType === 'visitor'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100'
                }`}
              >
                Visitor
              </button>
              <button
                type="button"
                onClick={() => handleDonorTypeChange('supporter')}
                className={`px-4 py-1 rounded border text-sm font-medium transition-colors ${
                  donorType === 'supporter'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100'
                }`}
              >
                Supporter
              </button>
            </div>

            {/* Member / Visitor / Supporter selector */}
            <div className="col-span-3 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                {donorType === 'member' ? 'Member' : donorType === 'visitor' ? 'Visitor' : 'Supporter'}
              </label>
            </div>
            <div className="col-span-9">
              {donorType === 'member' ? (
                <Select
                  options={members}
                  value={formData.member_id}
                  onChange={(selected) => setFormData({ ...formData, member_id: selected })}
                  placeholder=""
                  isSearchable
                  styles={customStyles}
                  required
                />
              ) : donorType === 'visitor' ? (
                <Select
                  options={visitors}
                  value={formData.visitor_id}
                  onChange={(selected) => setFormData({ ...formData, visitor_id: selected })}
                  placeholder=""
                  isSearchable
                  styles={customStyles}
                  required
                />
              ) : (
                <Select
                  options={supporters}
                  value={formData.supporter_id}
                  onChange={(selected) => setFormData({ ...formData, supporter_id: selected })}
                  placeholder=""
                  isSearchable
                  styles={customStyles}
                  required
                />
              )}
            </div>

            <div className="col-span-3 flex items-center">
              <label className="block text-sm font-medium text-gray-700">Donation Type</label>
            </div>
            <div className="col-span-9">
              <Select
                options={donationTypes}
                value={formData.donation_type}
                onChange={(selected) => setFormData({ ...formData, donation_type: selected })}
                placeholder=""
                isSearchable
                styles={customStyles}
                required
              />
            </div>

            <div className="col-span-3 flex items-center">
              <label className="block text-sm font-medium text-gray-700">Amount</label>
            </div>
            <div className="col-span-9">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.includes('.')) {
                      const parts = val.split('.');
                      if (parts[1].length > 2) val = parts[0] + '.' + parts[1].substring(0, 2);
                    }
                    setFormData({ ...formData, amount: val });
                  }}
                  onBlur={() => setFormData({ ...formData, amount: formatCurrency(formData.amount) })}
                  required
                  placeholder=""
                  step="0.01"
                  className="w-34 px-2 py-1 pl-7 border border-gray-600"
                />
              </div>
            </div>

            <div className="col-span-3 flex items-center">
              <label className="block text-sm font-medium text-gray-700">Donation Date</label>
            </div>
            <div className="col-span-9">
              <MaskedDateInput
                value={formData.donation_date}
                onChange={(date) => setFormData({ ...formData, donation_date: date })}
                required
                inputClassName="w-full px-2 py-1 pl-7 border border-gray-600"
              />
            </div>

            <div className="col-span-3 flex items-center">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
            </div>
            <div className="col-span-3">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-2 py-1 border border-gray-600"
                rows="2"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading ? <ButtonLoader text={donation ? "Updating..." : "Saving..."} /> : (donation ? "Update" : "Save")}
            </button>
          </div>
        </form>
      )}

      {showModal && (
        <Modal onClose={handleCloseModal}>
          <h2 className="text-lg font-bold">Success!</h2>
          <p>Donation added successfully! Do you want to add another?</p>
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

export default DonationForm;
