import React from 'react';

const VendorsReport = ({ reportData }) => {
    if (!reportData || !reportData.vendors) {
        return <div className="p-6 text-center text-gray-500">No data available</div>;
    }

    const { vendors, total } = reportData;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(parseFloat(amount));
    };

    const rows = [...(vendors || [])].sort((a, b) => {
        const an = `${a.lastName || ''}`.trim().toLowerCase();
        const bn = `${b.lastName || ''}`.trim().toLowerCase();
        if (an !== bn) return an.localeCompare(bn);
        const aa = parseFloat(a.totalCharges || 0);
        const ba = parseFloat(b.totalCharges || 0);
        return ba - aa;
    });

    const totalChargesSum = (vendors || []).reduce((sum, v) => sum + parseFloat(v.totalCharges || 0), 0);

    return (
        <div className="p-6">

            <div className="overflow-x-auto">
                <table className="min-w-full table-fixed divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-5/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vendor Name
                            </th>
                            <th scope="col" className="px-6 py-3 w-4/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                            </th>
                            <th scope="col" className="px-6 py-3 w-3/12 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Charges
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rows.map(vendor => (
                            <tr key={vendor.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap w-5/12 text-sm text-gray-500">
                                    {`${vendor.lastName}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap w-4/12 text-sm text-gray-500">
                                    {vendor.email || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap w-3/12 text-sm text-gray-500 text-right">
                                    {formatCurrency(vendor.totalCharges || 0)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50">
                            <td colSpan="2" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                Total:
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
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