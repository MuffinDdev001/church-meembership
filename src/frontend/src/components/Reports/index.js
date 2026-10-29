import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DonationReport from './DonationReport';
import MembershipReport from './MembershipReport';
import GroupReport from './GroupReport';
import GroupMembershipReport from './GroupMembershipReport';
import TotalDonationReport from './TotalDonationReport';
import DonationTypeSummaryReport from './DonationTypeSummaryReport';
import VisitorDonationReport from './VisitorDonationReport';
import SupporterDonationReport from './SupporterDonationReport';
import MaskedDateInput from '../common/MaskedDateInput';
import { PageLoader } from '../common/Loader';
import VendorsReport from './VendorsReport';
import ExpensesReport from './ExpensesReport';
import ChargesReport from './ChargesReport';
import DepositReport from './DepositReport';
import Select from 'react-select';

const Reports = ({ initialReport }) => {
  // ── All state declarations first ──
  const [activeReport, setActiveReport] = useState('');
  const [activeReport2, setActiveReport2] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [reportData, setReportData] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberStatus, setMemberStatus] = useState('all');
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [supporters, setSupporters] = useState([]);
  const [selectedSupporter, setSelectedSupporter] = useState(null);
  const [loadingSupporters, setLoadingSupporters] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [donationTypes, setDonationTypes] = useState([]);
  const [selectedDonationType, setSelectedDonationType] = useState(null);
  const [loadingDonationTypes, setLoadingDonationTypes] = useState(false);
  const [selectedRightOption, setSelectedRightOption] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // ── Static option lists ──
  // LEFT dropdown: report category
  const leftOptions = [
    { value: '', label: 'None' },
    { value: 'donation', label: 'Donation Type' },
    { value: 'group', label: 'Group Type' },
    { value: 'expenses', label: 'Expenses Type' },
    { value: 'deposits', label: 'Deposits' },
    { value: 'charges', label: 'Charges' },
  ];

  // Full list used by renderReportContent for defining filters
  const reportOptions = [
    { value: 'donationTypeSummary', label: 'Donation Type' },
    { value: 'groupMembership', label: 'Group Type', hasGroupFilter: true },
    { value: 'expenses', label: 'Expenses Type' },
    { value: 'deposits', label: 'Deposits' },
    { value: 'membership', label: 'Members', hasMemberStatusFilter: true },
    { value: 'visitorDonations', label: 'Visitors', hasVisitorFilter: true },
    { value: 'supporterDonations', label: 'Supporters', hasSupporterFilter: true },
    { value: 'vendors', label: 'Vendors', hasVendorFilter: true },
    { value: 'memberDonations', label: 'Member Donations', hasMemberFilter: true },
    { value: 'groups', label: 'Groups' },
    { value: 'charges', label: 'Charges' },
    { value: 'bankReport', label: 'Banks' },
  ];

  // MIDDLE dropdown: Members/Visitors/Vendors/Banks report types
  const middleOptions = [
    { value: '', label: 'None' },
    { value: 'member', label: 'Members' },
    { value: 'supporter', label: 'Supporters' },
    { value: 'visitor', label: 'Visitors' },
    { value: 'vendor', label: 'Vendors' },
    { value: 'bank', label: 'Banks' },
  ];

  // Resolve active report based on combinations
  let effectiveReport = '';
  if (activeReport === 'donation') {
    if (activeReport2 === 'member') effectiveReport = 'memberDonations';
    else if (activeReport2 === 'visitor') effectiveReport = 'visitorDonations';
    else if (activeReport2 === 'supporter') effectiveReport = 'supporterDonations';
    else effectiveReport = 'donationTypeSummary';
  } else if (activeReport === 'group') {
    if (activeReport2 === 'member') effectiveReport = 'groupMembership';
    else effectiveReport = 'groups';
  } else if (activeReport === 'expenses') {
    effectiveReport = 'expenses';
  } else if (activeReport === 'deposits') {
    effectiveReport = 'deposits';
  } else if (activeReport === 'charges') {
    effectiveReport = 'charges';
  } else if (activeReport === '') {
    if (activeReport2 === 'member') effectiveReport = 'membership';
    else if (activeReport2 === 'supporter') effectiveReport = 'supporterDonations';
    else if (activeReport2 === 'visitor') effectiveReport = 'visitorDonations';
    else if (activeReport2 === 'vendor') effectiveReport = 'vendors';
    else if (activeReport2 === 'bank') effectiveReport = 'bankReport';
  }

  const currentReportType = reportOptions.find(option => option.value === effectiveReport) || {};
  const showMemberFilter = !!currentReportType.hasMemberFilter;
  const showVendorFilter = !!currentReportType.hasVendorFilter;
  const showVisitorFilter = !!currentReportType.hasVisitorFilter;
  const showSupporterFilter = !!currentReportType.hasSupporterFilter;
  const showGroupFilter = !!currentReportType.hasGroupFilter;

  const isDonationReport = activeReport === 'donation' || ['memberDonations', 'visitorDonations', 'supporterDonations', 'donations', 'donationTypeSummary'].includes(effectiveReport);

  const handleReportChange = (e) => {
    setActiveReport(e.target.value);
    setSelectedMember(null);
    setSelectedVendor(null);
    setSelectedVisitor(null);
    setSelectedSupporter(null);
    setSelectedGroup(null);
    setSelectedDonationType(null);
  };

  const handleReport2Change = (e) => {
    setActiveReport2(e.target.value);
    setSelectedMember(null);
    setSelectedVendor(null);
    setSelectedVisitor(null);
    setSelectedSupporter(null);
    setSelectedGroup(null);
    setSelectedDonationType(null);
  };

  const handleRightOptionChange = (e) => {
    setSelectedRightOption(e.target.value);
    setSelectedMember(null);
    setSelectedVendor(null);
    setSelectedVisitor(null);
    setSelectedSupporter(null);
    setSelectedGroup(null);
    setSelectedDonationType(null);
  };

  // Sync when initialReport prop changes (navigation)
  useEffect(() => {
    if (initialReport) {
      if (initialReport === 'memberDonations') {
        setActiveReport('donation');
        setActiveReport2('member');
      } else if (initialReport === 'visitorDonations') {
        setActiveReport('donation');
        setActiveReport2('visitor');
      } else if (initialReport === 'supporterDonations') {
        setActiveReport('donation');
        setActiveReport2('supporter');
      } else if (initialReport === 'donationTypeSummary' || initialReport === 'donations') {
        setActiveReport('donation');
        setActiveReport2('');
      } else if (initialReport === 'groups') {
        setActiveReport('group');
        setActiveReport2('');
      } else if (initialReport === 'groupMembership') {
        setActiveReport('group');
        setActiveReport2('member');
      } else if (['membership'].includes(initialReport)) {
        setActiveReport('');
        setActiveReport2('member');
      } else if (['vendors'].includes(initialReport)) {
        setActiveReport('');
        setActiveReport2('vendor');
      } else if (['bankReport'].includes(initialReport)) {
        setActiveReport('');
        setActiveReport2('bank');
      } else if (initialReport === 'expenses') {
        setActiveReport('expenses');
        setActiveReport2('');
      } else if (initialReport === 'deposits') {
        setActiveReport('deposits');
        setActiveReport2('');
      } else if (initialReport === 'charges') {
        setActiveReport('charges');
        setActiveReport2('');
      }
      setSelectedMember(null);
      setSelectedVisitor(null);
      setSelectedSupporter(null);
      setSelectedVendor(null);
      setSelectedGroup(null);
      setSelectedDonationType(null);
    }
  }, [initialReport]);

  const handleDateChange = (type, date) => {
    setDateRange(prev => ({
      ...prev,
      [type]: date
    }));
  };

  const clearDates = () => {
    setDateRange({
      startDate: null,
      endDate: null
    });
    setSelectedDonationType(null);
    setReportData(null);
  };

  const fetchMembers = async () => {
    if (members.length > 0) return; // Don't fetch if we already have members

    try {
      setLoadingMembers(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/members`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setMembers(response.data.map(member => ({
        value: member.id,
        label: `${member.lastName}, ${member.firstName}`
      })));
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch members when needed
  useEffect(() => {
    if (showMemberFilter) {
      fetchMembers();
    }
  }, [showMemberFilter]);

  const handleMemberStatusChange = (e) => {
    setMemberStatus(e.target.value);
  };

  const fetchVendors = async () => {
    if (vendors.length > 0) return; // Don't fetch if we already have vendors

    try {
      setLoadingVendors(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/vendors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setVendors(response.data.map(vendor => ({
        value: vendor.id,
        label: vendor.lastName
      })));
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoadingVendors(false);
    }
  };

  // Fetch vendors when needed
  useEffect(() => {
    if (showVendorFilter) {
      fetchVendors();
    }
  }, [showVendorFilter]);

  const fetchVisitors = async () => {
    if (visitors.length > 0) return;
    try {
      setLoadingVisitors(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/visitors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVisitors(response.data.map(v => ({
        value: v.id,
        label: `${v.lastName}, ${v.firstName}`
      })));
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoadingVisitors(false);
    }
  };

  useEffect(() => {
    if (showVisitorFilter) {
      fetchVisitors();
    }
  }, [showVisitorFilter]);

  const fetchSupporters = async () => {
    if (supporters.length > 0) return;
    try {
      setLoadingSupporters(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/supporters`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSupporters(response.data.map(s => ({
        value: s.id,
        label: `${s.lastName}, ${s.firstName}`
      })));
    } catch (error) {
      console.error('Error fetching supporters:', error);
    } finally {
      setLoadingSupporters(false);
    }
  };

  useEffect(() => {
    if (showSupporterFilter) {
      fetchSupporters();
    }
  }, [showSupporterFilter]);

  const fetchGroups = async () => {
    if (groups.length > 0) return;
    try {
      setLoadingGroups(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/groups`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGroups(response.data.map(g => ({
        value: g.id,
        label: g.name
      })));
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (showGroupFilter) {
      fetchGroups();
    }
  }, [showGroupFilter]);

  const fetchDonationTypes = async () => {
    if (donationTypes.length > 0) return;
    try {
      setLoadingDonationTypes(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/donation-types`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDonationTypes(response.data.map(dt => ({
        value: dt.name,
        label: dt.name
      })));
    } catch (error) {
      console.error('Error fetching donation types:', error);
    } finally {
      setLoadingDonationTypes(false);
    }
  };

  useEffect(() => {
    if (isDonationReport) {
      fetchDonationTypes();
    }
  }, [isDonationReport]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const endpoint = `/reports/${effectiveReport}`;
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      if (selectedMember) params.append('memberId', selectedMember.value);
      if (selectedVendor) params.append('vendorId', selectedVendor.value);
      if (selectedVisitor) params.append('visitorId', selectedVisitor.value);
      if (selectedSupporter) params.append('supporterId', selectedSupporter.value);
      if (selectedGroup) params.append('groupId', selectedGroup.value);
      // NOTE: We do not restrict donationType in the backend request so that the
      // full data is always retrieved and filtered client-side instantly by selectedDonationType.
      // This prevents "No donations found" errors when a type is pre-selected before clicking View.
      if (effectiveReport === 'membership') {
        params.append('memberStatus', memberStatus);
      }
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}${endpoint}?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setReportData(response.data);
      return response.data;
    } catch (error) {
      console.error(`Error generating ${effectiveReport} report:`, error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const printableReportRef = useRef(null);

  const printReport = async () => {
    let currentData = reportData;
    if (!currentData) {
      currentData = await generateReport();
      if (!currentData) return;
    }

    setTimeout(() => {
      const container = printableReportRef.current;
      if (!container) return;

      const reportTitle = reportOptions.find(option => option.value === effectiveReport)?.label || 'Report';

      const oldFrame = document.getElementById('report-print-iframe');
      if (oldFrame) {
        oldFrame.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'report-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${reportTitle}</title>
            <style>
              @page {
                size: letter portrait;
                margin: 12mm 10mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                color: #111827;
                margin: 0;
                padding: 10px;
                font-size: 11pt;
              }
              h2 {
                font-size: 18pt;
                font-weight: 700;
                color: #111827;
                margin: 0;
              }
              .badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 9pt;
                font-weight: 600;
                margin-right: 6px;
                background-color: #f3f4f6;
                color: #374151;
                border: 1px solid #e5e7eb;
              }
              .badge-type {
                background-color: #dbeafe !important;
                color: #1e40af !important;
                border-color: #bfdbfe !important;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 10pt;
              }
              thead th {
                background-color: #f3f4f6 !important;
                color: #374151;
                font-weight: 700;
                text-transform: uppercase;
                font-size: 8.5pt;
                letter-spacing: 0.05em;
                padding: 8px 10px;
                border-bottom: 2px solid #d1d5db;
                text-align: left;
              }
              thead th:last-child {
                text-align: right;
              }
              tbody tr {
                border-bottom: 1px solid #e5e7eb;
              }
              tbody tr:nth-child(even) {
                background-color: #f9fafb;
              }
              tbody td {
                padding: 6px 10px;
                color: #374151;
              }
              .text-right {
                text-align: right;
              }
              tfoot {
                display: table-row-group !important;
              }
              /* Subtotal rows: clean, unshaded text */
              tr.subtotal-row, tr.bg-blue-50, tr.bg-purple-50, tr.bg-indigo-50, tr[class*="bg-blue"], tr[class*="bg-purple"], tr[class*="bg-indigo"] {
                background-color: transparent !important;
                border: none !important;
              }
              tr.subtotal-row td, tr.bg-blue-50 td, tr.bg-purple-50 td, tr.bg-indigo-50 td, tr[class*="bg-blue"] td, tr[class*="bg-purple"] td, tr[class*="bg-indigo"] td {
                color: #111827 !important;
                font-weight: 700 !important;
                background-color: transparent !important;
                border: none !important;
                padding: 6px 10px !important;
              }
              /* Grand total row: clean text at end of report */
              tfoot tr, tfoot td, tr.total-row, tr.total-row td {
                background-color: transparent !important;
                color: #111827 !important;
                font-weight: 700 !important;
                font-size: 10.5pt !important;
                border-top: 1px solid #d1d5db !important;
                border-bottom: none !important;
                padding: 8px 10px !important;
              }
              .truncate {
                overflow: visible !important;
                white-space: normal !important;
              }
            </style>
          </head>
          <body>
            ${container.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 350);
    }, 150);
  };

  // Clear report data when either report type changes
  useEffect(() => { setReportData(null); }, [activeReport, activeReport2]);

  const renderReportContent = () => {
    switch (effectiveReport) {
      case 'memberDonations':
        return <DonationReport reportData={reportData} sortOrder={sortOrder} selectedDonationType={selectedDonationType} />;
      case 'visitorDonations':
        return <VisitorDonationReport reportData={reportData} sortOrder={sortOrder} selectedDonationType={selectedDonationType} />;
      case 'supporterDonations':
        return <SupporterDonationReport reportData={reportData} sortOrder={sortOrder} selectedDonationType={selectedDonationType} />;
      case 'donations':
        return <DonationReport reportData={reportData} sortOrder={sortOrder} selectedDonationType={selectedDonationType} />;
      case 'membership':
        return <MembershipReport reportData={reportData} sortOrder={sortOrder} />;
      case 'groups':
        return <GroupReport reportData={reportData} sortOrder={sortOrder} />;
      case 'groupMembership':
        return <GroupMembershipReport reportData={reportData} sortOrder={sortOrder} />;
      case 'totalDonations':
        return <TotalDonationReport reportData={reportData} sortOrder={sortOrder} />;
      case 'donationTypeSummary':
        return <DonationTypeSummaryReport reportData={reportData} sortOrder={sortOrder} selectedDonationType={selectedDonationType} />;
      case 'vendors':
        return <VendorsReport reportData={reportData} sortOrder={sortOrder} />;
      case 'expenses':
        return <ExpensesReport reportData={reportData} sortOrder={sortOrder} />;
      case 'charges':
        return <ChargesReport reportData={reportData} sortOrder={sortOrder} />;
      case 'deposits':
        return <DepositReport reportData={reportData} sortOrder={sortOrder} />;
      default:
        return <div className="p-6 text-center text-gray-500">Select a report type</div>;
    }
  };

  return (
    <div className="container reports-container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Reports</h1>

      {/* Compact layout with dates and buttons in a single row */}
      <div className="mb-6">
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <MaskedDateInput
              value={dateRange.startDate}
              onChange={(date) => handleDateChange('startDate', date)}
              inputClassName="rounded-md px-3 py-2"
              useCurrentDateAsDefault={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <MaskedDateInput
              value={dateRange.endDate}
              onChange={(date) => handleDateChange('endDate', date)}
              inputClassName="rounded-md px-3 py-2"
              useCurrentDateAsDefault={true}
            />
          </div>

          <button
            onClick={clearDates}
            className="h-10 px-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={generateReport}
            className="h-10 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View
          </button>

          <button
            onClick={printReport}
            className="h-10 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Print
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Date</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-md text-sm"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <Select
              options={leftOptions}
              value={leftOptions.find(o => o.value === activeReport) || null}
              onChange={(selected) => handleReportChange({ target: { value: selected ? selected.value : '' } })}
              placeholder=""
              isSearchable
              className="w-48"
              styles={{
                control: (base) => ({
                  ...base,
                  height: '40px',
                  minHeight: '40px'
                })
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <Select
              options={middleOptions}
              value={middleOptions.find(o => o.value === activeReport2) || null}
              onChange={(selected) => handleReport2Change({ target: { value: selected ? selected.value : '' } })}
              placeholder=""
              isSearchable
              className="w-48"
              styles={{
                control: (base) => ({
                  ...base,
                  height: '40px',
                  minHeight: '40px'
                })
              }}
            />
          </div>

          {isDonationReport && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donation Type (Optional)</label>
              <Select
                options={donationTypes}
                value={selectedDonationType}
                onChange={setSelectedDonationType}
                placeholder="All Types"
                isClearable
                isSearchable
                isLoading={loadingDonationTypes}
                className="w-56"
                styles={{
                  control: (base) => ({
                    ...base,
                    height: '40px',
                    minHeight: '40px'
                  })
                }}
              />
            </div>
          )}

          {showMemberFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member (Optional)</label>
              <Select
                options={members}
                value={selectedMember}
                onChange={setSelectedMember}
                placeholder=""
                isClearable
                isSearchable
                isLoading={loadingMembers}
                className="w-64"
                styles={{
                  control: (base) => ({
                    ...base,
                    height: '40px',
                    minHeight: '40px'
                  })
                }}
              />
            </div>
          )}

          {effectiveReport === 'membership' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Status</label>
              <Select
                options={[
                  { value: 'all', label: 'All Members' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive Only' }
                ]}
                value={[
                  { value: 'all', label: 'All Members' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive Only' }
                ].find(o => o.value === memberStatus) || { value: 'all', label: 'All Members' }}
                onChange={(selected) => handleMemberStatusChange({ target: { value: selected.value } })}
                placeholder=""
                isSearchable={false}
                className="w-48"
                styles={{
                  control: (base) => ({
                    ...base,
                    height: '40px',
                    minHeight: '40px'
                  })
                }}
              />
            </div>
          )}

          {showVendorFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor (Optional)</label>
              <Select
                options={vendors}
                value={selectedVendor}
                onChange={setSelectedVendor}
                placeholder=""
                isClearable
                isSearchable
                isLoading={loadingVendors}
                className="w-64"
                styles={{
                  control: (base) => ({
                    ...base,
                    height: '40px',
                    minHeight: '40px'
                  })
                }}
              />
            </div>
          )}

          {showVisitorFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visitor (Optional)</label>
              <Select
                options={visitors}
                value={selectedVisitor}
                onChange={setSelectedVisitor}
                placeholder=""
                isClearable
                isSearchable
                isLoading={loadingVisitors}
                className="w-64"
                styles={{
                  control: (base) => ({
                    ...base,
                    height: '40px',
                    minHeight: '40px'
                  })
                }}
              />
            </div>
          )}

          {showSupporterFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supporter (Optional)</label>
              <Select
                options={supporters}
                value={selectedSupporter}
                onChange={setSelectedSupporter}
                placeholder=""
                isClearable
                isSearchable
                isLoading={loadingSupporters}
                className="w-64"
                styles={{
                  control: (base) => ({
                    ...base,
                    height: '40px',
                    minHeight: '40px'
                  })
                }}
              />
            </div>
          )}

          {showGroupFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group (Optional)</label>
              <Select
                options={groups}
                value={selectedGroup}
                onChange={setSelectedGroup}
                placeholder=""
                isClearable
                isSearchable
                isLoading={loadingGroups}
                className="w-64"
                styles={{
                  control: (base) => ({
                    ...base,
                    height: '40px',
                    minHeight: '40px'
                  })
                }}
              />
            </div>
          )}

        </div>
      </div>

      {/* Report Content */}
      <div ref={printableReportRef} className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {reportOptions.find(option => option.value === effectiveReport)?.label || 'Report'}
            </h2>
            <div className="text-xs text-gray-500">
              {new Date().toLocaleDateString()}
            </div>
          </div>
          {/* Active filter summary badges */}
          {(selectedDonationType || selectedMember || selectedVisitor || selectedSupporter || dateRange.startDate || dateRange.endDate) && (
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              {selectedDonationType && (
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                  Donation Type: {selectedDonationType.label || selectedDonationType.value}
                </span>
              )}
              {selectedMember && (
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  Member: {selectedMember.label}
                </span>
              )}
              {selectedVisitor && (
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  Visitor: {selectedVisitor.label}
                </span>
              )}
              {selectedSupporter && (
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  Supporter: {selectedSupporter.label}
                </span>
              )}
              {(dateRange.startDate || dateRange.endDate) && (
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  Period: {dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString() : 'Start'} – {dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString() : 'Present'}
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <PageLoader />
          </div>
        ) : reportData ? (
          renderReportContent()
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="text-lg font-medium">No Report Generated</p>
            <p className="text-sm mt-1">Select your filters and click &quot;View&quot; to display the report.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;