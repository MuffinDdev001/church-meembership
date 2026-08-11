import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PageLoader, ButtonLoader } from '../common/Loader';
import Select from 'react-select';

const GroupMembershipForm = () => {
    const [members, setMembers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [formData, setFormData] = useState({
        memberId: '',
        groupId: '',
        joinedDate: new Date().toISOString().split('T')[0]
    });
    const [selectedMember, setSelectedMember] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [groupMembers, setGroupMembers] = useState([]);
    const [groupMembersLoading, setGroupMembersLoading] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setPageLoading(true);
            try {
                const [membersRes, groupsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/members`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                    axios.get(`${process.env.REACT_APP_API_URL}/groups`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    })
                ]);
                setMembers(membersRes.data.filter(m => m.isActive));
                setGroups(groupsRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchGroupMembers = useCallback(async (groupId) => {
        if (!groupId) { setGroupMembers([]); return; }
        setGroupMembersLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/groups/${groupId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setGroupMembers(res.data.members || []);
        } catch (error) {
            console.error('Error fetching group members:', error);
            setGroupMembers([]);
        } finally {
            setGroupMembersLoading(false);
        }
    }, []);

    const handleMemberChange = (selected) => {
        const memberId = selected ? selected.value : '';
        setFormData(prev => ({ ...prev, memberId }));
        const member = members.find(m => m.id.toString() === memberId.toString());
        setSelectedMember(member || null);
        setMessage('');
    };

    const handleGroupChange = (selected) => {
        const groupId = selected ? selected.value : '';
        setFormData(prev => ({ ...prev, groupId }));
        setMessage('');
        fetchGroupMembers(groupId);
    };

    const handleDateChange = (e) => {
        setFormData(prev => ({ ...prev, joinedDate: e.target.value }));
        setMessage('');
    };

    const showMsg = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!formData.memberId || !formData.groupId) {
            showMsg('Please select both a member and a group.', 'error');
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/group-members`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            showMsg('Member added to group successfully.', 'success');
            fetchGroupMembers(formData.groupId);
        } catch (error) {
            console.error('Error saving group membership:', error);
            showMsg(error.response?.data?.message || 'Error adding member to group.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId, memberName) => {
        if (!formData.groupId) return;
        if (!window.confirm(`Remove "${memberName}" from this group?`)) return;
        setRemovingId(memberId);
        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/group-members/${formData.groupId}/${memberId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            showMsg(`"${memberName}" removed from group.`, 'success');
            fetchGroupMembers(formData.groupId);
        } catch (error) {
            console.error('Error removing group member:', error);
            showMsg(error.response?.status === 404 ? 'Membership not found.' : 'Error removing member.', 'error');
        } finally {
            setRemovingId(null);
        }
    };

    const handleDeleteByForm = async () => {
        if (!formData.memberId || !formData.groupId) {
            showMsg('Please select both a member and a group to remove.', 'error');
            return;
        }
        if (!window.confirm('Remove this member from the selected group?')) return;
        setLoading(true);
        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/group-members/${formData.groupId}/${formData.memberId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            showMsg('Group membership removed successfully.', 'success');
            setFormData({ memberId: '', groupId: '', joinedDate: new Date().toISOString().split('T')[0] });
            setSelectedMember(null);
            fetchGroupMembers(formData.groupId);
        } catch (error) {
            showMsg(error.response?.status === 404 ? 'Membership not found.' : 'Error removing membership.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <PageLoader />;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Group Member Management</h2>

            {message && (
                <div className={`p-3 mb-4 rounded-md text-sm font-medium ${
                    messageType === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message}
                </div>
            )}

            {/* ── Add Member Form ── */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Add Member to Group</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium text-gray-600">Group</label>
                        <div className="col-span-3">
                            <Select
                                options={groups.map(group => ({
                                    value: group.id.toString(),
                                    label: group.name
                                }))}
                                value={formData.groupId
                                    ? { value: formData.groupId, label: groups.find(g => g.id.toString() === formData.groupId)?.name || '' }
                                    : null
                                }
                                onChange={handleGroupChange}
                                isSearchable
                                isClearable
                                placeholder=""
                                className="w-full text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium text-gray-600">Member</label>
                        <div className="col-span-3">
                            <Select
                                options={members.map(member => ({
                                    value: member.id.toString(),
                                    label: `${member.lastName}, ${member.firstName}${member.middleName ? ' ' + member.middleName : ''}`
                                }))}
                                value={formData.memberId
                                    ? { value: formData.memberId, label: (() => { const m = members.find(x => x.id.toString() === formData.memberId.toString()); return m ? `${m.lastName}, ${m.firstName}`.trim() : ''; })() }
                                    : null
                                }
                                onChange={handleMemberChange}
                                isSearchable
                                isClearable
                                placeholder=""
                                className="w-full text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium text-gray-600">Joined Date</label>
                        <div className="col-span-3 lg:col-span-1">
                            <input
                                type="date"
                                value={formData.joinedDate}
                                onChange={handleDateChange}
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {selectedMember && (
                        <div className="col-span-4 ml-[calc(25%+1rem)] text-sm text-gray-500 bg-gray-50 rounded-md p-3 border border-gray-100">
                            <span className="font-medium text-gray-700">{selectedMember.firstName} {selectedMember.lastName}</span>
                            {selectedMember.cellPhone && <span className="ml-3">{selectedMember.cellPhone}</span>}
                            {selectedMember.email && <span className="ml-3">{selectedMember.email}</span>}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2 border-t justify-end">
                        <button
                            type="button"
                            onClick={handleDeleteByForm}
                            disabled={loading || !formData.memberId || !formData.groupId}
                            className="px-4 py-2 border border-red-400 text-red-600 rounded-md text-sm hover:bg-red-50 disabled:opacity-40 font-medium"
                        >
                            Remove Selected
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-300 font-medium flex items-center gap-2"
                        >
                            {loading ? <ButtonLoader /> : null}
                            Add to Group
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Current Group Members List ── */}
            {formData.groupId && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center justify-between">
                        <span>Current Members in Group</span>
                        {groupMembersLoading && <span className="text-xs text-gray-400 font-normal">Loading...</span>}
                        <span className="text-xs font-normal text-gray-400">{groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}</span>
                    </h3>

                    {!groupMembersLoading && groupMembers.length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-4">No members in this group yet.</p>
                    )}

                    {groupMembers.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {groupMembers.map(gm => {
                                        const m = gm.member || gm;
                                        const fullName = `${m.lastName || ''}, ${m.firstName || ''}`.trim();
                                        const joined = gm.joinedDate ? new Date(gm.joinedDate).toLocaleDateString() : 'N/A';
                                        return (
                                            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-800 font-medium">{fullName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{m.cellPhone || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{m.email || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{joined}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleRemoveMember(m.id, fullName)}
                                                        disabled={removingId === m.id}
                                                        className="text-xs px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 font-medium"
                                                    >
                                                        {removingId === m.id ? 'Removing...' : 'Remove'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GroupMembershipForm;
