import React from 'react';

const GroupReport = ({ reportData }) => {
  if (!reportData || !reportData.groups) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  const { groups, total } = reportData;

  const rows = [...(groups || [])].sort((a, b) => {
    const an = (a.name || '').toLowerCase();
    const bn = (b.name || '').toLowerCase();
    if (an !== bn) return an.localeCompare(bn);
    const am = (a.members || []).length;
    const bm = (b.members || []).length;
    return bm - am;
  });

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-3 py-1 w-3/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-3 py-1 w-3/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-3 py-1 w-2/12 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Members
              </th>
              <th scope="col" className="px-3 py-1 w-4/12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member List
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map(group => (
              <tr key={group.id} className="hover:bg-gray-50">
                <td className="px-3 py-1 whitespace-nowrap w-3/12 text-sm text-gray-900">
                  <div className="truncate">
                    {(group.name || 'Unnamed Group').trim()}
                  </div>
                </td>
                <td className="px-3 py-1 whitespace-nowrap w-3/12 text-sm text-gray-500">
                  <div className="truncate">
                    {(group.description || 'No description available').trim()}
                  </div>
                </td>
                <td className="px-3 py-1 whitespace-nowrap w-2/12 text-sm text-gray-500 text-right">
                  <div className="truncate">
                    {(group.members || []).length}
                  </div>
                </td>
                <td className="px-3 py-1 whitespace-nowrap w-4/12 text-sm text-gray-500">
                  <div className="truncate">
                    {group.members && group.members.length > 0
                      ? [...group.members]
                        .sort((a, b) => {
                          const an = `${a.lastName || ''} ${a.firstName || ''}`.trim().toLowerCase();
                          const bn = `${b.lastName || ''} ${b.firstName || ''}`.trim().toLowerCase();
                          return an.localeCompare(bn);
                        })
                        .map(m => (m.firstName && m.lastName ? `${m.lastName.trim()}, ${m.firstName.trim()}` : 'Unknown Member'))
                        .join(', ')
                      : 'None'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan="2" className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                Total Groups:
              </td>
              <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                {total || rows.length}
              </td>
              <td className="px-3 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default GroupReport;
