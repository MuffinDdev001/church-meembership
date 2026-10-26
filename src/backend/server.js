require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: ['https://newlightxyz.com', 'https://www.newlightxyz.com', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}));
app.use(express.json());

// Make Prisma available to route.  s
app.set('prisma', prisma);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Apply authentication middleware to protected routes
app.use('/uploads', express.static('public/uploads'));
// Create member

// Add this helper function at the top of your file
const generateMemberNumber = async (prisma) => {
  // Find the highest member number
  const lastMember = await prisma.member.findFirst({
    orderBy: {
      memberNumber: 'desc'
    }
  });

  // Start with 00101 if no members exist
  if (!lastMember || !lastMember.memberNumber) {
    return '00101';
  }

  // If the last member has a formatted number, parse it and increment
  const numericPart = parseInt(lastMember.memberNumber, 10);
  const nextNumber = numericPart + 1;

  // Format to 5 digits with leading zeros
  return nextNumber.toString().padStart(5, '0');
};

app.post('/public/members', async (req, res) => {
  try {
    // console.log('Received member data:', req.body);

    // Generate the next member number
    const memberNumber = await generateMemberNumber(prisma);

    const member = await prisma.member.create({
      data: {
        firstName: req.body.first_name,
        middleName: req.body.middle_name,
        lastName: req.body.last_name,
        memberNumber: memberNumber, // Use the generated number
        isActive: req.body.is_active,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zip_code,
        birthday: req.body.birthday,
        gender: req.body.gender,
        cellPhone: req.body.cell_phone,
        email: req.body.email,
        membershipDate: req.body.membership_date,
        baptismalDate: req.body.baptismal_date,
        profileImage: req.body.profile_image,
        pastChurch: req.body.past_church,
        groups: {
          create: req.body.groups.map(groupId => ({
            group: {
              connect: { id: parseInt(groupId) }
            }
          }))
        }
      },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    });

    console.log('Created member:', member);
    res.json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ message: 'Error creating member', error: error.message });
  }
});


// Create visitor
// Add this helper function at the top of your file
const generateVisitorNumber = async (prisma) => {
  // Find the highest visitor number
  const lastVisitor = await prisma.visitor.findFirst({
    orderBy: {
      visitorNumber: 'desc'
    }
  });

  // Start with V00101 if no visitors exist
  if (!lastVisitor || !lastVisitor.visitorNumber) {
    return 'V00101';
  }

  // If the last visitor has a formatted number, parse it and increment
  const numericPart = parseInt(lastVisitor.visitorNumber.substring(1), 10);
  const nextNumber = numericPart + 1;

  // Format to 5 digits with leading zeros and prepend 'V'
  return 'V' + nextNumber.toString().padStart(5, '0');
};

app.post('/public/visitors', async (req, res) => {
  try {
    console.log('Received visitor data:', req.body);

    // Generate the next visitor number
    const visitorNumber = await generateVisitorNumber(prisma);

    const visitor = await prisma.visitor.create({
      data: {
        firstName: req.body.first_name,
        lastName: req.body.last_name,
        middleInitial: req.body.middle_initial,
        visitorNumber: visitorNumber, // Use the generated number
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zip_code,
        cellPhone: req.body.cell_phone,
        email: req.body.email,
        homeChurch: req.body.home_church,
        profileImage: req.body.profile_image,
      }
    });

    console.log('Created visitor:', visitor);
    res.json(visitor);
  } catch (error) {
    console.error('Error creating visitor:', error);
    res.status(500).json({ message: 'Error creating visitor', error: error.message });
  }
});
app.use(['/members', '/groups', '/donations', '/reports', '/dashboard', '/visitors', '/supporters', '/vendors', '/expense-categories', '/charges', '/admin', '/program-owner', '/events', '/backup'], authenticateToken);

// Make authenticateToken available to routes
app.set('authenticateToken', authenticateToken);

// Routes
require('./routes/auth')(app);
require('./routes/members')(app);
const groupsRouter = require('./routes/groups')(app);
app.use('/groups', groupsRouter);
const groupMembersRouter = require('./routes/groupMembers')(app);
app.use('/group-members', groupMembersRouter);
require('./routes/donations')(app);
const reportsRouter = require('./routes/reports')(app);
app.use('/reports', reportsRouter);
require('./routes/dashboard')(app);
require('./routes/visitors')(app);
require('./routes/supporters')(app);
require('./routes/vendors')(app);
require('./routes/expenseCategories')(app);
require('./routes/charges')(app);
require('./routes/admin')(app);
require('./routes/programOwner')(app);

const bankRoutes = require('./routes/banks');
const depositRoutes = require('./routes/deposits');
const eventRoutes = require('./routes/events');
const communicationRoutes = require('./routes/communication');
app.use('/banks', bankRoutes);
app.use('/deposits', depositRoutes);
app.use('/events', eventRoutes);
app.use('/communication', communicationRoutes);

const backupRoutes = require('./routes/backup');
app.use('/backup', backupRoutes);

const { initCronJobs } = require('./services/communicationService');
const { initAutomatedBackup } = require('./services/backupService');

async function start() {
  await prisma.$connect();
  console.log('Connected to database');

  // Initialize background cron jobs
  initCronJobs();
  initAutomatedBackup();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();

