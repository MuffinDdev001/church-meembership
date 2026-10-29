import React from 'react';

const SupporterDonationReport = ({ reportData, sortOrder = 'desc', selectedDonationType }) => {
  if (!reportData || !reportData.donations) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  const { donations } = reportData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(amount || 0));
  };

  // Sort donations by date (desc), then name, then amount
  const sortedDonations = [...(donations || [])].sort((a, b) => {
    const ad = a.donationDate ? new Date(a.donationDate).getTime() : 0;
    const bd = b.donationDate ? new Date(b.donationDate).getTime() : 0;
    if (bd !== ad) return sortOrder === 'asc' ? ad - bd : bd - ad;
    const an = a.supporter ? `${a.supporter.lastName || ''} ${a.supporter.firstName || ''}`.trim().toLowerCase() : '';
    const bn = b.supporter ? `${b.supporter.lastName || ''} ${b.supporter.firstName || ''}`.trim().toLowerCase() : '';
    if (an !== bn) return an.localeCompare(bn);
    const aa = parseFloat(a.amount || 0);
    const ba = parseFloat(b.amount || 0);
    return ba - aa;
  });

  const filterType = selectedDonationType?.value?.trim().toLowerCase();
  const filteredDonations = filterType
    ? sortedDonations.filter(d => (d.donationType || '').trim().toLowerCase() === filterType)
    : sortedDonations;

  const grandTotal = filteredDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  if (filteredDonations.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No donations found {filterType ? `for type "${selectedDonationType.label || selectedDonationType.value}"` : ''}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-3 py-1 w-3/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-3 py-1 w-4/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supporter
              </th>
              <th scope="col" className="px-3 py-1 w-3/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-3 py-1 w-2/12 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredDonations.map(donation => (
              <tr key={donation.id} className="hover:bg-gray-50">
                <td className="px-3 py-1 whitespace-nowrap w-3/12 text-sm text-gray-500">
                  <div className="truncate">
                    {donation.donationDate ? new Date(donation.donationDate).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 whitespace-nowrap w-4/12 text-sm text-gray-500">
                  <div className="truncate">
                    {donation.supporter ? `${donation.supporter.lastName.trim()}, ${donation.supporter.firstName.trim()}` : 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 whitespace-nowrap w-3/12 text-sm text-gray-500">
                  <div className="truncate">
                    {(donation.donationType || 'N/A').trim()}
                  </div>
                </td>
                <td className="px-3 py-1 whitespace-nowrap w-2/12 text-sm text-gray-500 text-right">
                  <div className="truncate">
                    {formatCurrency(donation.amount)}
                  </div>
                </td>
              </tr>
            ))}
            {selectedDonationType && (
              <tr className="subtotal-row">
                <td colSpan="3" className="px-3 py-1 text-right text-sm font-semibold text-gray-800">
                  {(selectedDonationType.label || selectedDonationType.value).trim()} Subtotal:
                </td>
                <td className="px-3 py-1 text-right text-sm font-semibold text-gray-800">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="total-row border-t border-gray-300">
              <td colSpan="3" className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                Total:
              </td>
              <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default SupporterDonationReport;
