import React from 'react';

const VisitorDonationReport = ({ reportData }) => {
  if (!reportData || !reportData.donations) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  const { donations, total } = reportData;

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
    if (bd !== ad) return bd - ad;
    const an = a.visitor ? `${a.visitor.lastName || ''} ${a.visitor.firstName || ''}`.trim().toLowerCase() : '';
    const bn = b.visitor ? `${b.visitor.lastName || ''} ${b.visitor.firstName || ''}`.trim().toLowerCase() : '';
    if (an !== bn) return an.localeCompare(bn);
    const aa = parseFloat(a.amount || 0);
    const ba = parseFloat(b.amount || 0);
    return ba - aa;
  });

  // Group donations by type
  const donationsByType = sortedDonations.reduce((acc, donation) => {
    const type = donation.donationType || 'N/A';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(donation);
    return acc;
  }, {});

  // Calculate subtotals for each type
  const typeSubtotals = Object.keys(donationsByType).reduce((acc, type) => {
    acc[type] = donationsByType[type].reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 w-3/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 w-4/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visitor
              </th>
              <th scope="col" className="px-6 py-3 w-3/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 w-2/12 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {Object.keys(donationsByType).map((type, typeIndex) => (
              <React.Fragment key={type}>
                {donationsByType[type].map(donation => (
                  <tr key={donation.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-6 py-4 whitespace-nowrap w-3/12 text-sm text-gray-500">
                      {donation.donationDate ? new Date(donation.donationDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-4/12 text-sm text-gray-500">
                      {donation.visitor ? `${donation.visitor.lastName}, ${donation.visitor.firstName}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-3/12 text-sm text-gray-500">
                      {donation.donationType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-2/12 text-sm text-gray-500 text-right">
                      {formatCurrency(donation.amount)}
                    </td>
                  </tr>
                ))}
                {/* Subtotal row for this donation type */}
                <tr className="bg-purple-50 border-b-2 border-purple-200">
                  <td colSpan="3" className="px-6 py-3 text-right text-sm font-semibold text-purple-900">
                    {type} Subtotal:
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-purple-900">
                    {formatCurrency(typeSubtotals[type])}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan="3" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                Total:
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                {formatCurrency(total || 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default VisitorDonationReport;
