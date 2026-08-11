const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { checkAccess, checkDeleteAccess } = require('../middleware/accessControl');

// Add this helper function at the top of your file
const generateSupporterNumber = async (prisma) => {
  // Find the highest supporter number
  const lastSupporter = await prisma.supporter.findFirst({
    orderBy: {
      supporterNumber: 'desc'
    }
  });
  
  // Start with S00101 if no supporters exist
  if (!lastSupporter || !lastSupporter.supporterNumber) {
    return 'S00101';
  }
  
  // If the last supporter has a formatted number, parse it and increment
  const numericPart = parseInt(lastSupporter.supporterNumber.substring(1), 10);
  const nextNumber = numericPart + 1;
  
  // Format to 5 digits with leading zeros and prepend 'S'
  return 'S' + nextNumber.toString().padStart(5, '0');
};

module.exports = (app) => {
  const prisma = app.get('prisma');

  // Get all supporters
  app.get('/supporters', authenticateToken, async (req, res) => {
    try {
      const { ownDataOnly, userId } = req.query;
      let whereClause = {};
      
      // If ownDataOnly is true and userId is provided, filter by the user's supporterId
      if (ownDataOnly === 'true' && userId) {
        // Get the user with their supporterId
        const user = await prisma.user.findUnique({
          where: { id: parseInt(userId) },
          select: { supporterId: true }
        });
        
        if (user && user.supporterId) {
          whereClause.id = user.supporterId;
        } else {
          // If user has no supporterId, return empty array
          return res.json([]);
        }
      }
      
      const supporters = await prisma.supporter.findMany({
        where: whereClause,
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      });
      res.json(supporters);
    } catch (error) {
      console.error('Error fetching supporters:', error);
      res.status(500).json({ message: 'Error fetching supporters' });
    }
  });

  // Get single supporter
  app.get('/supporters/:id', authenticateToken, async (req, res) => {
    try {
      const supporter = await prisma.supporter.findUnique({
        where: { id: parseInt(req.params.id) }
      });

      if (!supporter) {
        return res.status(404).json({ message: 'Supporter not found' });
      }

      res.json(supporter);
    } catch (error) {
      console.error('Error fetching supporter:', error);
      res.status(500).json({ message: 'Error fetching supporter' });
    }
  });

  // Create supporter
  app.post('/supporters', authenticateToken, async (req, res) => {
    try {
      console.log('Received supporter data:', req.body);
      
      // Generate the next supporter number
      const supporterNumber = await generateSupporterNumber(prisma);
      
      const supporter = await prisma.supporter.create({
        data: {
          firstName: req.body.first_name,
          lastName: req.body.last_name,
          supporterNumber: supporterNumber, // Use the generated number
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zipCode: req.body.zip_code,
          phone: req.body.phone,
          email: req.body.email,
        }
      });
      
      console.log('Created supporter:', supporter);
      res.json(supporter);
    } catch (error) {
      console.error('Error creating supporter:', error);
      res.status(500).json({ message: 'Error creating supporter', error: error.message });
    }
  });

  // Update supporter
  app.put('/supporters/:id', authenticateToken, async (req, res) => {
    try {
      const supporterId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get the user to check if this is their own supporter record
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          supporterId: true,
          role: true,
          supporterAccess: true 
        }
      });
      
      // If this is not the user's own record and they don't have access, reject the request
      if (user.supporterId !== supporterId && user.role !== 'admin' && !user.supporterAccess) {
        return res.status(403).json({ message: 'You do not have permission to update this supporter' });
      }
      
      const supporter = await prisma.supporter.update({
        where: { id: supporterId },
        data: {
          firstName: req.body.first_name,
          lastName: req.body.last_name,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zipCode: req.body.zip_code,
          phone: req.body.phone,
          email: req.body.email,
        }
      });
      
      console.log('Updated supporter:', supporter);
      res.json(supporter);
    } catch (error) {
      console.error('Error updating supporter:', error);
      res.status(500).json({ message: 'Error updating supporter', error: error.message });
    }
  });

  // Delete supporter
  app.delete('/supporters/:id', authenticateToken, async (req, res) => {
    try {
      const supporterId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get the user to check if this is their own supporter record
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          supporterId: true,
          role: true,
          supporterAccess: true,
          cannotDeleteSupporter: true
        }
      });
      
      // Allow if this is the user's own record OR they have delete access
      const isOwnRecord = user.supporterId === supporterId;
      const hasDeletePermission = user.role === 'admin' || (user.supporterAccess && !user.cannotDeleteSupporter);
      
      if (!isOwnRecord && !hasDeletePermission) {
        return res.status(403).json({ message: 'You do not have permission to delete this supporter' });
      }
      
      await prisma.supporter.delete({
        where: { id: supporterId }
      });
      res.json({ message: 'Supporter deleted successfully' });
    } catch (error) {
      console.error('Error deleting supporter:', error);
      res.status(500).json({ message: 'Error deleting supporter' });
    }
  });
};
