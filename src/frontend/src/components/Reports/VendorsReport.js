import React, { useState } from 'react';
import ResizableTh from '../common/ResizableTh';

const VendorsReport = ({ reportData }) => {
  const [colWidths, setColWidths] = useState({ name: 220, contact: 200, charges: 140 });
  const setCol = (key) => (w) => setColWidths(prev => ({ ...prev, [key]: w }));

  if (!reportData || !reportData.vendors) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  const { vendors, total } = reportData;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
      .format(parseFloat(amount));

  const rows = [...(vendors || [])].sort((a, b) => {
    const an = `${a.lastName || ''}`.toLowerCase();
    const bn = `${b.lastName || ''}`.toLowerCase();
    return an.localeCompare(bn);
  });

  const totalChargesSum = (vendors || []).reduce((sum, v) => sum + parseFloat(v.totalCharges || 0), 0);

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <ResizableTh width={colWidths.name} onResize={setCol('name')}>Vendor Name</ResizableTh>
              <ResizableTh width={colWidths.contact} onResize={setCol('contact')}>Contact</ResizableTh>
              <ResizableTh width={colWidths.charges} onResize={setCol('charges')} className="text-right">Total Charges</ResizableTh>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map(vendor => (
              <tr key={vendor.id} className="hover:bg-gray-50">
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.name }}>
                  <div className="truncate">
                    {`${vendor.lastName.trim()}`}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.contact }}>
                  <div className="truncate">
                    {(vendor.email || 'N/A').trim()}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 text-right whitespace-nowrap" style={{ width: colWidths.charges }}>
                  <div className="truncate">
                    {formatCurrency(vendor.totalCharges || 0)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan="2" className="px-3 py-2 text-right text-sm font-medium text-gray-900">Total:</td>
              <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                {formatCurrency(total || totalChargesSum)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default VendorsReport;