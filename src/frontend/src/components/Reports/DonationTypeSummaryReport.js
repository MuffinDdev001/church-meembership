import React from 'react';

const DonationTypeSummaryReport = ({ reportData, selectedDonationType }) => {
  if (!reportData || !reportData.summary) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  const { summary: rawSummary } = reportData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(amount || 0));
  };

  const filterType = selectedDonationType?.value?.trim().toLowerCase();
  const summary = filterType
    ? Object.fromEntries(
        Object.entries(rawSummary || {}).filter(([type]) => type.trim().toLowerCase() === filterType)
      )
    : (rawSummary || {});

  const totalAmount = Object.values(summary).reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
  const rows = Object.entries(summary).sort((a, b) => parseFloat(b[1] || 0) - parseFloat(a[1] || 0));

  if (rows.length === 0) {
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
              <th scope="col" className="px-3 py-1 w-6/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Donation Type
              </th>
              <th scope="col" className="px-3 py-1 w-3/12 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-3 py-1 w-3/12 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map(([type, amount]) => (
              <tr key={type} className="hover:bg-gray-50">
                <td className="px-3 py-1 whitespace-nowrap w-6/12 text-sm text-gray-500">
                  {type}
                </td>
                <td className="px-3 py-1 whitespace-nowrap w-3/12 text-sm text-gray-500 text-right">
                  {formatCurrency(amount)}
                </td>
                <td className="px-3 py-1 whitespace-nowrap w-3/12 text-sm text-gray-500 text-right">
                  {totalAmount > 0 ? `${((parseFloat(amount) / totalAmount) * 100).toFixed(2)}%` : '0.00%'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                Total:
              </td>
              <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                {formatCurrency(totalAmount)}
              </td>
              <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DonationTypeSummaryReport;
