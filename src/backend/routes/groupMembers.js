const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { checkAccess, checkDeleteAccess } = require('../middleware/accessControl');

module.exports = (app) => {
    const prisma = app.get('prisma');

    // Add a member to a group directly
    router.post('/', authenticateToken, async (req, res) => {
        const { groupId, memberId, joinedDate } = req.body;

        if (!groupId || !memberId) {
            return res.status(400).json({ message: 'groupId and memberId are required' });
        }

        try {
            const groupMember = await prisma.groupMember.upsert({
                where: {
                    groupId_memberId: {
                        groupId: parseInt(groupId),
                        memberId: parseInt(memberId)
                    }
                },
                update: {
                    joinedDate: joinedDate ? new Date(joinedDate) : null
                },
                create: {
                    groupId: parseInt(groupId),
                    memberId: parseInt(memberId),
                    joinedDate: joinedDate ? new Date(joinedDate) : null
                },
                include: {
                    group: true,
                    member: true
                }
            });
            res.status(201).json(groupMember);
        } catch (error) {
            console.error('Error adding member to group:', error);
            res.status(500).json({ message: 'Error adding member to group' });
        }
    });

    // Update a group membership
    router.put('/:groupId/:memberId', authenticateToken, async (req, res) => {
        const { joinedDate } = req.body;
        const groupId = parseInt(req.params.groupId);
        const memberId = parseInt(req.params.memberId);

        try {
            const updatedGroupMember = await prisma.groupMember.update({
                where: {
                    groupId_memberId: {
                        groupId,
                        memberId
                    }
                },
                data: {
                    joinedDate: joinedDate ? new Date(joinedDate) : null
                },
                include: {
                    group: true,
                    member: true
                }
            });
            res.json(updatedGroupMember);
        } catch (error) {
            console.error('Error updating group membership:', error);
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Group membership not found' });
            }
            res.status(500).json({ message: 'Error updating group membership' });
        }
    });

    // Remove a member from a group (Delete group membership)
    router.delete('/:groupId/:memberId', authenticateToken, checkAccess('group'), checkDeleteAccess('group'), async (req, res) => {
        const groupId = parseInt(req.params.groupId);
        const memberId = parseInt(req.params.memberId);

        try {
            await prisma.groupMember.delete({
                where: {
                    groupId_memberId: {
                        groupId,
                        memberId
                    }
                }
            });

            res.json({ message: 'Member removed from group successfully' });
        } catch (error) {
            console.error('Error deleting group membership:', error);
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Group membership not found' });
            }
            res.status(500).json({ message: 'Error deleting group membership' });
        }
    });

    return router;
};
