import React from 'react';

const TotalDonationReport = ({ reportData, sortOrder = 'desc', sortField = 'date' }) => {
  if (!reportData || !reportData.donations) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  const { donations, totalAmount } = reportData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(amount || 0));
  };

  const rows = [...(donations || [])].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    const getName = (d) => {
      if (d.member) return `${d.member.lastName || ''} ${d.member.firstName || ''}`.trim();
      if (d.visitor) return `${d.visitor.lastName || ''} ${d.visitor.firstName || ''}`.trim();
      if (d.supporter) return `${d.supporter.lastName || ''} ${d.supporter.firstName || ''}`.trim();
      return '';
    };
    if (sortField === 'name') return dir * getName(a).toLowerCase().localeCompare(getName(b).toLowerCase());
    if (sortField === 'type') return dir * (a.donationType || '').toLowerCase().localeCompare((b.donationType || '').toLowerCase());
    if (sortField === 'amount') return dir * (parseFloat(a.amount || 0) - parseFloat(b.amount || 0));
    // date (default)
    const ad = a.donationDate ? new Date(a.donationDate).getTime() : 0;
    const bd = b.donationDate ? new Date(b.donationDate).getTime() : 0;
    if (ad !== bd) return dir * (ad - bd);
    return getName(a).toLowerCase().localeCompare(getName(b).toLowerCase());
  });

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
                Person
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
            {rows.map(donation => (
              <tr key={donation.id} className="hover:bg-gray-50">
                <td className="px-3 py-1 whitespace-nowrap w-3/12 text-sm text-gray-500">
                  <div className="truncate">
                    {donation.donationDate ? new Date(donation.donationDate).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 whitespace-nowrap w-4/12 text-sm text-gray-500">
                  <div className="truncate">
                    {donation.member ? `${donation.member.lastName.trim()}, ${donation.member.firstName.trim()}` : donation.visitor ? `${donation.visitor.lastName.trim()}, ${donation.visitor.firstName.trim()} (Visitor)` : donation.supporter ? `${donation.supporter.lastName.trim()}, ${donation.supporter.firstName.trim()} (Supporter)` : 'N/A'}
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
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan="3" className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                Total:
              </td>
              <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                {formatCurrency(totalAmount || 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TotalDonationReport;
