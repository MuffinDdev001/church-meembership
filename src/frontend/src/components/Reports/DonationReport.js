import React, { useState } from 'react';
import ResizableTh from '../common/ResizableTh';

const DonationReport = ({ reportData, sortOrder = 'desc' }) => {
  const [colWidths, setColWidths] = useState({ date: 140, person: 200, type: 160, amount: 120 });

  const setCol = (key) => (w) => setColWidths(prev => ({ ...prev, [key]: w }));

  if (!reportData || !reportData.donations) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  const { donations, total } = reportData;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
      .format(parseFloat(amount || 0));

  const sortedDonations = [...(donations || [])].sort((a, b) => {
    const ad = a.donationDate ? new Date(a.donationDate).getTime() : 0;
    const bd = b.donationDate ? new Date(b.donationDate).getTime() : 0;
    if (bd !== ad) return sortOrder === 'asc' ? ad - bd : bd - ad;
    const getSortName = (d) => {
      if (d.member) return `${d.member.lastName || ''} ${d.member.firstName || ''}`;
      if (d.visitor) return `${d.visitor.lastName || ''} ${d.visitor.firstName || ''}`;
      if (d.supporter) return `${d.supporter.lastName || ''} ${d.supporter.firstName || ''}`;
      return '';
    };
    return getSortName(a).toLowerCase().localeCompare(getSortName(b).toLowerCase());
  });

  const donationsByType = sortedDonations.reduce((acc, d) => {
    const type = d.donationType || 'N/A';
    if (!acc[type]) acc[type] = [];
    acc[type].push(d);
    return acc;
  }, {});

  const typeSubtotals = Object.keys(donationsByType).reduce((acc, type) => {
    acc[type] = donationsByType[type].reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <ResizableTh width={colWidths.date} onResize={setCol('date')}>Date</ResizableTh>
              <ResizableTh width={colWidths.person} onResize={setCol('person')}>Person</ResizableTh>
              <ResizableTh width={colWidths.type} onResize={setCol('type')}>Type</ResizableTh>
              <ResizableTh width={colWidths.amount} onResize={setCol('amount')} className="text-right">Amount</ResizableTh>
            </tr>
          </thead>
          <tbody className="bg-white">
            {Object.keys(donationsByType).map((type) => (
              <React.Fragment key={type}>
                {donationsByType[type].map(donation => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.date }}>
                      <div className="truncate">
                        {donation.donationDate ? new Date(donation.donationDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.person }}>
                      <div className="truncate">
                        {donation.member
                          ? `${donation.member.lastName.trim()}, ${donation.member.firstName.trim()}`
                          : donation.visitor
                            ? `${donation.visitor.lastName.trim()}, ${donation.visitor.firstName.trim()} (Visitor)`
                            : donation.supporter
                              ? `${donation.supporter.lastName.trim()}, ${donation.supporter.firstName.trim()} (Supporter)`
                              : 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.type }}>
                      <div className="truncate">
                        {(donation.donationType || 'N/A').trim()}
                      </div>
                    </td>
                    <td className="px-3 py-1 text-sm text-gray-500 text-right whitespace-nowrap" style={{ width: colWidths.amount }}>
                      <div className="truncate">
                        {formatCurrency(donation.amount)}
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 border-y border-blue-200">
                  <td colSpan="3" className="px-3 py-1 text-right text-sm font-semibold text-blue-900">
                    {type} Subtotal:
                  </td>
                  <td className="px-3 py-1 text-right text-sm font-semibold text-blue-900">
                    {formatCurrency(typeSubtotals[type])}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan="3" className="px-3 py-2 text-right text-sm font-medium text-gray-900">Total:</td>
              <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency(total || 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DonationReport;
