import React, { useState } from 'react';
import ResizableTh from '../common/ResizableTh';

const MembershipReport = ({ reportData, sortOrder = 'desc' }) => {
  const [colWidths, setColWidths] = useState({ name: 160, phone: 120, address: 200, date: 130, email: 170, groups: 140 });
  const setCol = (key) => (w) => setColWidths(prev => ({ ...prev, [key]: w }));

  if (!reportData || !reportData.members) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  const { members } = reportData;

  const sortedMembers = [...(members || [])].sort((a, b) => {
    const ad = a.membershipDate ? new Date(a.membershipDate).getTime() : 0;
    const bd = b.membershipDate ? new Date(b.membershipDate).getTime() : 0;
    if (bd !== ad) return sortOrder === 'asc' ? ad - bd : bd - ad;
    const an = `${a.lastName || ''} ${a.firstName || ''}`.trim().toLowerCase();
    const bn = `${b.lastName || ''} ${b.firstName || ''}`.trim().toLowerCase();
    return an.localeCompare(bn);
  });

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <ResizableTh width={colWidths.name} onResize={setCol('name')}>Name</ResizableTh>
              <ResizableTh width={colWidths.phone} onResize={setCol('phone')}>Phone</ResizableTh>
              <ResizableTh width={colWidths.address} onResize={setCol('address')}>Address</ResizableTh>
              <ResizableTh width={colWidths.date} onResize={setCol('date')}>Membership Date</ResizableTh>
              <ResizableTh width={colWidths.email} onResize={setCol('email')}>Email</ResizableTh>
              <ResizableTh width={colWidths.groups} onResize={setCol('groups')}>Groups</ResizableTh>
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedMembers.map(member => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.name }}>
                  <div className="truncate">
                    {member.lastName && member.firstName ? `${member.lastName.trim()}, ${member.firstName.trim()}` : 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.phone }}>
                  <div className="truncate">
                    {(member.cellPhone || '').trim() || 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.address }}>
                  <div className="truncate">
                    {[member.address, member.city, member.state, member.zipCode].filter(Boolean).map(s => s.trim()).join(', ') || 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.date }}>
                  <div className="truncate">
                    {member.membershipDate ? new Date(member.membershipDate).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.email }}>
                  <div className="truncate">
                    {(member.email || '').trim() || 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-1 text-sm text-gray-500 whitespace-nowrap" style={{ width: colWidths.groups }}>
                  <div className="truncate">
                    {member.groups && member.groups.length > 0 ? member.groups.map(g => g.trim()).join(', ') : 'None'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembershipReport;
