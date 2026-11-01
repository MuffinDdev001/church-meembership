import React, { useState } from 'react';
import ResizableTh from '../common/ResizableTh';

const ExpensesReport = ({ reportData, sortOrder = 'desc', sortField = 'date' }) => {
  const [colWidths, setColWidths] = useState({ date: 140, vendor: 160, category: 160, amount: 120 });
  const setCol = (key) => (w) => setColWidths(prev => ({ ...prev, [key]: w }));

  if (!reportData || !reportData.expenses) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  const { expenses, total } = reportData;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
      .format(parseFloat(amount || 0));

  const rows = [...(expenses || [])].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'vendor') {
      const an = a.vendor ? (a.vendor.lastName || '').toLowerCase() : '';
      const bn = b.vendor ? (b.vendor.lastName || '').toLowerCase() : '';
      return dir * an.localeCompare(bn);
    }
    if (sortField === 'category') {
      const an = (a.expenseCategory?.name || '').toLowerCase();
      const bn = (b.expenseCategory?.name || '').toLowerCase();
      return dir * an.localeCompare(bn);
    }
    if (sortField === 'amount') return dir * (parseFloat(a.amount || 0) - parseFloat(b.amount || 0));
    // date (default)
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    if (ad !== bd) return dir * (ad - bd);
    const an2 = a.vendor ? (a.vendor.lastName || '').toLowerCase() : '';
    const bn2 = b.vendor ? (b.vendor.lastName || '').toLowerCase() : '';
    return an2.localeCompare(bn2);
  });

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <ResizableTh width={colWidths.date} onResize={setCol('date')}>Due Date</ResizableTh>
              <ResizableTh width={colWidths.vendor} onResize={setCol('vendor')}>Vendor</ResizableTh>
              <ResizableTh width={colWidths.category} onResize={setCol('category')}>Category</ResizableTh>
              <ResizableTh width={colWidths.amount} onResize={setCol('amount')} className="text-right">Amount</ResizableTh>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map(expense => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.date }}>
                  <div className="truncate">
                    {expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.vendor }}>
                  <div className="truncate">
                    {expense.vendor ? `${expense.vendor.lastName.trim()}` : 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.category }}>
                  <div className="truncate">
                    {(expense.expenseCategory?.name || 'N/A').trim()}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 text-right whitespace-nowrap" style={{ width: colWidths.amount }}>
                  <div className="truncate">
                    {formatCurrency(expense.amount)}
                  </div>
                </td>
              </tr>
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

export default ExpensesReport;