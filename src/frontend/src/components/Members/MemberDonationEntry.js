import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import MaskedDateInput from '../common/MaskedDateInput';
import { ButtonLoader, PageLoader } from '../common/Loader';

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderColor: '#d1d5db',
    boxShadow: 'none',
    '&:hover': { borderColor: '#9ca3af' },
  }),
};

const MemberDonationEntry = () => {
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [donationTypes, setDonationTypes] = useState([]);
  const [donationDate, setDonationDate] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState(null);
  const [donationRows, setDonationRows] = useState([{ amount: '', type: '' }]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchMembers(), fetchDonationTypes()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setFormLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/members`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMembers(response.data.map(m => ({
        value: m.id,
        label: `${m.lastName}, ${m.firstName}`
      })));
    } catch (error) {
      console.error('Error fetching members:', error);
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

  const addDonationRow = () => {
    setDonationRows([...donationRows, { amount: '', type: '' }]);
  };

  const removeDonationRow = (index) => {
    if (donationRows.length > 1) {
      setDonationRows(donationRows.filter((_, i) => i !== index));
    }
  };

  const updateDonationRow = (index, field, value) => {
    const updated = [...donationRows];
    updated[index][field] = value;
    setDonationRows(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedMember) {
      alert('Please select a member.');
      setLoading(false);
      return;
    }

    // Validate all rows have both amount and type
    const invalidRows = donationRows.filter(row => !row.amount || !row.type);
    if (invalidRows.length > 0) {
      alert('Please fill in all amount and type fields.');
      setLoading(false);
      return;
    }

    try {
      // Create multiple donations
      const promises = donationRows.map(row =>
        axios.post(
          `${process.env.REACT_APP_API_URL}/donations`,
          {
            member_id: selectedMember.value,
            amount: parseFloat(row.amount),
            donation_type: row.type.value,
            donation_date: donationDate,
            notes: ''
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )
      );

      await Promise.all(promises);
      alert(`Successfully added ${donationRows.length} donation(s) for ${selectedMember.label}`);

      // Reset form
      setSelectedMember(null);
      setDonationDate(new Date());
      setDonationRows([{ amount: '', type: '' }]);
    } catch (error) {
      console.error('Error saving donations:', error);
      alert('Error saving donations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedMember(null);
    setDonationDate(new Date());
    setDonationRows([{ amount: '', type: '' }]);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Member Donation Entry</h1>

      {formLoading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <PageLoader />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <MaskedDateInput
              value={donationDate}
              onChange={setDonationDate}
              required
              inputClassName="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Member Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Member Name</label>
            <Select
              options={members}
              value={selectedMember}
              onChange={setSelectedMember}
              placeholder="Select Member"
              isSearchable
              styles={customStyles}
              required
              className="w-full"
            />
          </div>

          {/* Donation Rows */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Donations</label>
            </div>

            <div className="space-y-3">
              {donationRows.map((row, index) => (
                <div key={index} className="flex items-center gap-3">
                  {/* Amount */}
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => updateDonationRow(index, 'amount', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  {/* Plus/Minus Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (index === donationRows.length - 1) {
                        addDonationRow();
                      } else {
                        removeDonationRow(index);
                      }
                    }}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === donationRows.length - 1
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {index === donationRows.length - 1 ? '+' : '−'}
                  </button>

                  {/* Type */}
                  <div className="flex-1">
                    <Select
                      options={donationTypes}
                      value={row.type}
                      onChange={(selected) => updateDonationRow(index, 'type', selected)}
                      placeholder="Select Type"
                      isSearchable
                      styles={customStyles}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Amount & Type Button */}
          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={addDonationRow}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Add Amount & Type
            </button>
          </div>

          {/* Cancel/Add Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? <ButtonLoader text="Adding..." /> : 'Add'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MemberDonationEntry;
