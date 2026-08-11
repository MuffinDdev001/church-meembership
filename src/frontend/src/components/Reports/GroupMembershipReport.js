import React from 'react';

const GroupMembershipReport = ({ reportData }) => {
    if (!reportData || !reportData.groups || reportData.groups.length === 0) {
        return <div className="text-center p-8 text-gray-500">No group membership data found.</div>;
    }

    const { groups } = reportData;

    // Flatten data to a single array of memberships with groupName attached
    const flatMemberships = groups.flatMap((group) => {
        if (!group.members) return [];
        return group.members.map((membership) => ({
            groupName: group.name,
            memberId: membership.member.id,
            member: membership.member || membership
        }));
    });

    if (flatMemberships.length === 0) {
        return <div className="text-center p-8 text-gray-500">No members found in selected groups.</div>;
    }

    return (
        <div className="p-6">
            {/* <div className="text-center mb-8">
                <h2 className="text-lg text-gray-600 font-medium">Group Membership Report</h2>
            </div> */}

            <div className="bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-gray-600 text-sm">
                                <th className="py-1 px-4 font-normal text-left w-[15%]">Group Name</th>
                                <th className="py-1 px-4 font-normal text-left w-[20%]">Name</th>
                                <th className="py-1 px-4 font-normal text-left w-[35%]">Address</th>
                                <th className="py-1 px-4 font-normal text-center w-[15%] min-w-[120px]">Phone Number</th>
                                <th className="py-1 px-4 font-normal text-center w-[15%]">Email</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {flatMemberships.map((item, idx) => {
                                const { groupName, member } = item;
                                return (
                                    <tr key={`${groupName}-${member.id || idx}`} className="text-gray-800 hover:bg-gray-50">
                                        <td className="py-1 px-4 text-left font-medium">{groupName}</td>
                                        <td className="py-1 px-4 text-left">
                                            {member.firstName} {member.middleName ? `${member.middleName[0]}.` : ''} {member.lastName}
                                        </td>
                                        <td className="py-1 px-4 text-left">
                                            {member.address ? `${member.address}, ${member.city}, ${member.state} ${member.zipCode}` : ''}
                                        </td>
                                        <td className="py-1 px-4 text-center">{member.cellPhone || ''}</td>
                                        <td className="py-1 px-4 text-center text-blue-500 hover:underline">
                                            <a href={`mailto:${member.email}`}>{member.email || ''}</a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GroupMembershipReport;
