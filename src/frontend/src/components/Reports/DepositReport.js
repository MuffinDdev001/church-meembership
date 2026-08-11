import React, { useState } from 'react';
import ResizableTh from '../common/ResizableTh';

const DepositReport = ({ reportData, sortOrder = 'desc' }) => {
  const [colWidths, setColWidths] = useState({ date: 120, bank: 160, account: 140, cash: 110, check: 110, total: 110 });
  const setCol = (key) => (w) => setColWidths(prev => ({ ...prev, [key]: w }));

  if (!reportData || !reportData.deposits) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  const { deposits, total } = reportData;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
      .format(parseFloat(amount || 0));

  const getCheckAmount = (deposit) => {
    if (!deposit.checks || deposit.checks.length === 0) return 0;
    return deposit.checks.reduce((sum, check) => sum + parseFloat(check.amount || 0), 0);
  };

  const rows = [...(deposits || [])].sort((a, b) => {
    const ad = a.date ? new Date(a.date).getTime() : 0;
    const bd = b.date ? new Date(b.date).getTime() : 0;
    if (bd !== ad) return sortOrder === 'asc' ? ad - bd : bd - ad;
    return parseFloat(b.totalAmount || 0) - parseFloat(a.totalAmount || 0);
  });

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <ResizableTh width={colWidths.date} onResize={setCol('date')}>Date</ResizableTh>
              <ResizableTh width={colWidths.bank} onResize={setCol('bank')}>Bank</ResizableTh>
              <ResizableTh width={colWidths.account} onResize={setCol('account')}>Account #</ResizableTh>
              <ResizableTh width={colWidths.cash} onResize={setCol('cash')} className="text-right">Cash</ResizableTh>
              <ResizableTh width={colWidths.check} onResize={setCol('check')} className="text-right">Check</ResizableTh>
              <ResizableTh width={colWidths.total} onResize={setCol('total')} className="text-right">Total</ResizableTh>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map(deposit => (
              <tr key={deposit.id} className="hover:bg-gray-50">
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.date }}>
                  <div className="truncate">
                    {deposit.date ? new Date(deposit.date).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.bank }}>
                  <div className="truncate">
                    {(deposit.bank?.name || 'N/A').trim()}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.account }}>
                  <div className="truncate">
                    {(deposit.accountNumber || 'N/A').trim()}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 text-right whitespace-nowrap" style={{ width: colWidths.cash }}>
                  <div className="truncate">
                    {formatCurrency(deposit.cashAmount)}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 text-right whitespace-nowrap" style={{ width: colWidths.check }}>
                  <div className="truncate">
                    {formatCurrency(getCheckAmount(deposit))}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 text-right whitespace-nowrap" style={{ width: colWidths.total }}>
                  <div className="truncate">
                    {formatCurrency(deposit.totalAmount)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan="5" className="px-3 py-2 text-right text-sm font-medium text-gray-900">Total:</td>
              <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency(total || 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DepositReport;