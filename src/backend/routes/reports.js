const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

module.exports = (app) => {
  const prisma = app.get('prisma');

  // Donation Report Route
  app.get('/reports/donations', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, memberId, donationType } = req.query;

      let whereClause = {};

      if (startDate && endDate) {
        whereClause.donationDate = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.donationDate = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.donationDate = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      if (memberId) {
        whereClause.memberId = parseInt(memberId); // Filter by member ID
      }

      if (donationType) {
        whereClause.donationType = { equals: donationType.trim(), mode: 'insensitive' };
      }

      const donations = await prisma.donation.findMany({
        where: whereClause,
        include: {
          member: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          donationDate: 'desc'
        }
      });

      const total = donations.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);

      res.json({
        donations,
        total
      });
    } catch (error) {
      console.error('Error generating donation report:', error);
      res.status(500).json({ message: 'Error generating donation report' });
    }
  });

  // Membership Report Route
  app.get('/reports/membership', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, memberStatus } = req.query;

      let whereClause = {};

      // Date filtering
      if (startDate && endDate) {
        whereClause.membershipDate = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.membershipDate = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.membershipDate = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      // Member status filtering
      if (memberStatus === 'active') {
        whereClause.isActive = true;
      } else if (memberStatus === 'inactive') {
        whereClause.isActive = false;
      }
      // If memberStatus is 'all' or undefined, don't filter by status

      const members = await prisma.member.findMany({
        where: whereClause,
        include: {
          groups: {
            include: {
              group: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          lastName: 'asc'
        }
      });

      // Transform the data to include group names
      const formattedMembers = members.map(member => ({
        ...member,
        groups: member.groups.map(membership => membership.group.name)
      }));

      res.json({
        members: formattedMembers,
        total: formattedMembers.length
      });
    } catch (error) {
      console.error('Error generating membership report:', error);
      res.status(500).json({ message: 'Error generating membership report' });
    }
  });

  // Group Report Route
  app.get('/reports/groups', authenticateToken, async (req, res) => {
    try {
      const groups = await prisma.group.findMany({
        include: {
          members: {
            include: {
              member: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Transform the data to a more usable format
      const formattedGroups = groups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        members: group.members.map(membership => ({
          firstName: membership.member.firstName,
          lastName: membership.member.lastName
        }))
      }));

      res.json({
        groups: formattedGroups,
        total: groups.length
      });
    } catch (error) {
      console.error('Error generating group report:', error);
      res.status(500).json({ message: 'Error generating group report' });
    }
  });

  // Group Membership Report Route
  app.get('/reports/groupMembership', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.query;

      let whereClause = {};
      if (groupId) {
        whereClause.id = parseInt(groupId);
      }

      const groups = await prisma.group.findMany({
        where: whereClause,
        include: {
          members: {
            include: {
              member: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json({
        groups,
        total: groups.length
      });
    } catch (error) {
      console.error('Error generating group membership report:', error);
      res.status(500).json({ message: 'Error generating group membership report' });
    }
  });

  // Group Membership Report PDF Route
  app.post('/reports/groupMembership/pdf', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.body;

      let whereClause = {};
      if (groupId) {
        whereClause.id = parseInt(groupId);
      }

      const groups = await prisma.group.findMany({
        where: whereClause,
        include: {
          members: {
            include: {
              member: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=group-membership-report.pdf');

      doc.pipe(res);

      doc.moveDown(0.5)
        .fontSize(18)
        .font('Helvetica')
        .text('Group Membership Report', { align: 'center' });

      doc.moveDown(2);

      let yPosition = doc.y;

      const flatMemberships = groups.flatMap((group) => {
        if (!group.members) return [];
        return group.members.map((membership) => ({
          groupName: group.name,
          member: membership.member || membership
        }));
      });

      if (flatMemberships.length === 0) {
        doc.font('Helvetica')
          .fontSize(12)
          .text('No members found in selected groups.', { align: 'center' });
        doc.end();
        return;
      }

      // Draw table headers
      const columns = {
        groupName: { x: 50, width: 90 },
        name: { x: 140, width: 100 },
        address: { x: 240, width: 130 },
        phone: { x: 370, width: 85 },
        email: { x: 455, width: 90 }
      };

      // Header background
      doc.rect(50, yPosition - 5, 495, 20).fill('#f3f4f6');

      // Header text
      doc.fillColor('#000000') // text-black
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Group Name', columns.groupName.x, yPosition, { align: 'center', width: columns.groupName.width })
        .text('Name', columns.name.x, yPosition, { align: 'center', width: columns.name.width })
        .text('Address', columns.address.x, yPosition, { align: 'center', width: columns.address.width })
        .text('Phone Number', columns.phone.x, yPosition, { align: 'center', width: columns.phone.width })
        .text('Email', columns.email.x, yPosition, { align: 'center', width: columns.email.width });

      yPosition += 20;

      doc.font('Helvetica').fontSize(9);

      flatMemberships.forEach((item, i) => {
        const { groupName, member } = item;

        if (yPosition > 750) {
          doc.addPage();
          yPosition = 50;

          // Redraw headers on new page
          doc.rect(50, yPosition - 5, 495, 20).fill('#f3f4f6');
          doc.fillColor('#000000')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Group Name', columns.groupName.x, yPosition, { align: 'center', width: columns.groupName.width })
            .text('Name', columns.name.x, yPosition, { align: 'center', width: columns.name.width })
            .text('Address', columns.address.x, yPosition, { align: 'center', width: columns.address.width })
            .text('Phone Number', columns.phone.x, yPosition, { align: 'center', width: columns.phone.width })
            .text('Email', columns.email.x, yPosition, { align: 'center', width: columns.email.width });

          yPosition += 20;
          doc.font('Helvetica').fontSize(9);
        }

        // Alternate row background
        if (i % 2 === 0) {
          doc.rect(50, yPosition - 5, 495, 16).fill('#f9fafb');
        }

        const name = `${member.firstName} ${member.middleName ? member.middleName[0] + '.' : ''} ${member.lastName}`.trim();
        const address = member.address ? `${member.address}, ${member.city}, ${member.state} ${member.zipCode}` : '';

        doc.fillColor('#1f2937') // gray-800
          .text(groupName, columns.groupName.x, yPosition, { align: 'center', width: columns.groupName.width })
          .text(name, columns.name.x, yPosition, { align: 'center', width: columns.name.width })
          .text(address, columns.address.x, yPosition, { align: 'center', width: columns.address.width })
          .text(member.cellPhone || '', columns.phone.x, yPosition, { align: 'center', width: columns.phone.width })
          .fillColor('#3b82f6') // blue-500
          .text(member.email || '', columns.email.x, yPosition, { align: 'center', width: columns.email.width, link: `mailto:${member.email}` });

        const rowHeight = Math.max(
          doc.heightOfString(groupName, { width: columns.groupName.width }),
          doc.heightOfString(name, { width: columns.name.width }),
          doc.heightOfString(address, { width: columns.address.width })
        );

        yPosition += rowHeight + 10;
      });

      doc.end();
    } catch (error) {
      console.error('Error generating group membership PDF report:', error);
      res.status(500).json({ message: 'Error generating group membership PDF report' });
    }
  });

  // Total Donation Report Route
  app.get('/reports/totalDonations', authenticateToken, async (req, res) => {
    try {
      const donations = await prisma.donation.findMany({
        include: {
          member: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      const totalAmount = donations.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);

      res.json({
        totalAmount,
        donations
      });
    } catch (error) {
      console.error('Error generating total donation report:', error);
      res.status(500).json({ message: 'Error generating total donation report' });
    }
  });

  // Donation Type Summary Report Route
  app.get('/reports/donationTypeSummary', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, memberId, donationType } = req.query;

      let whereClause = {};
      if (startDate && endDate) {
        whereClause.donationDate = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.donationDate = { gte: new Date(startDate) };
      } else if (endDate) {
        whereClause.donationDate = { lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      }

      if (memberId) whereClause.memberId = parseInt(memberId);
      // Case-insensitive, trimmed match so "Tithe", "tithe", " Tithe " all work
      if (donationType) whereClause.donationType = { equals: donationType.trim(), mode: 'insensitive' };

      const donations = await prisma.donation.findMany({
        where: whereClause,
        include: {
          member: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      const summary = donations.reduce((acc, donation) => {
        const key = (donation.donationType || 'N/A').trim();
        acc[key] = (acc[key] || 0) + parseFloat(donation.amount);
        return acc;
      }, {});

      res.json({
        summary
      });
    } catch (error) {
      console.error('Error generating donation type summary report:', error);
      res.status(500).json({ message: 'Error generating donation type summary report' });
    }
  });

  // Donation Type Summary PDF Route
  app.post('/reports/donationTypeSummary/pdf', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, memberId, donationType } = req.body;

      let whereClause = {};

      if (startDate && endDate) {
        whereClause.donationDate = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.donationDate = { gte: new Date(startDate) };
      } else if (endDate) {
        whereClause.donationDate = { lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      }

      if (memberId) whereClause.memberId = parseInt(memberId);
      // Case-insensitive trimmed match
      if (donationType) whereClause.donationType = { equals: donationType.trim(), mode: 'insensitive' };

      const donations = await prisma.donation.findMany({
        where: whereClause,
        include: {
          member: { select: { firstName: true, lastName: true } },
          visitor: { select: { firstName: true, lastName: true } },
          supporter: { select: { firstName: true, lastName: true } }
        },
        orderBy: { donationDate: 'desc' }
      });

      // Build summary grouped by type
      const summary = donations.reduce((acc, donation) => {
        const key = (donation.donationType || 'N/A').trim();
        acc[key] = (acc[key] || 0) + parseFloat(donation.amount);
        return acc;
      }, {});

      const totalAmount = Object.values(summary).reduce((sum, amount) => sum + amount, 0);
      // Sort descending by amount (same as on-screen)
      const sortedEntries = Object.entries(summary).sort((a, b) => b[1] - a[1]);

      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=donation-type-summary-report.pdf');
      doc.pipe(res);

      // ── Title ────────────────────────────────────────────────────────────────
      doc.fontSize(18).font('Helvetica-Bold').text('Donation Type Summary', { align: 'center' });
      if (donationType) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
          .text(`Filtered by Type: ${donationType}`, { align: 'center' });
        doc.fillColor('#000000');
      }
      if (startDate || endDate) {
        doc.fontSize(10).font('Helvetica')
          .text(`Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
      }
      doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1.2);

      // ── Table header ────────────────────────────────────────────────────────
      const cols = { type: 50, amount: 390, pct: 470 };
      const printHeaders = () => {
        const hY = doc.y;
        doc.rect(50, hY - 3, 500, 18).fill('#f3f4f6');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10)
          .text('Donation Type', cols.type, hY)
          .text('Amount', cols.amount, hY, { width: 70, align: 'right' })
          .text('%', cols.pct, hY, { width: 50, align: 'right' });
        doc.moveDown(0.4);
      };
      printHeaders();

      // ── Rows ────────────────────────────────────────────────────────────────
      sortedEntries.forEach(([type, amount], i) => {
        if (doc.y > 680) { doc.addPage(); printHeaders(); }
        const y = doc.y;
        if (i % 2 === 0) doc.rect(50, y - 2, 500, 16).fill('#f9fafb');
        const pct = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(2) : '0.00';
        doc.fillColor('#000000').font('Helvetica').fontSize(9)
          .text(type, cols.type, y, { width: 330 })
          .text(formatCurrency(amount), cols.amount, y, { width: 70, align: 'right' })
          .text(`${pct}%`, cols.pct, y, { width: 50, align: 'right' });
        doc.moveDown(0.2);
      });

      // ── Grand Total row ─────────────────────────────────────────────────────
      if (doc.y > 680) { doc.addPage(); printHeaders(); }
      doc.moveDown(0.3);
      const totalY = doc.y;
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11)
        .text('Total:', cols.type, totalY + 3, { width: 330, align: 'right' })
        .text(formatCurrency(totalAmount), cols.amount, totalY + 3, { width: 70, align: 'right' })
        .text('100%', cols.pct, totalY + 3, { width: 50, align: 'right' });

      doc.end();
    } catch (error) {
      console.error('Error generating donation type summary PDF:', error);
      res.status(500).json({ message: 'Error generating donation type summary PDF' });
    }
  });

  const generateDonationsPdf = async (req, res) => {
    try {
      const { startDate, endDate, memberId, donationType } = req.body;

      // Create filter
      let whereClause = {};
      if (startDate || endDate) {
        whereClause.donationDate = {};
        if (startDate) {
          whereClause.donationDate.gte = new Date(startDate);
        }
        if (endDate) {
          whereClause.donationDate.lte = new Date(new Date(endDate).setHours(23, 59, 59));
        }
      }

      if (memberId) {
        whereClause.memberId = parseInt(memberId);
      }

      if (donationType) {
        whereClause.donationType = { equals: donationType.trim(), mode: 'insensitive' };
      }

      const donations = await prisma.donation.findMany({
        where: whereClause,
        include: {
          member: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          donationDate: 'desc'
        }
      });

      const totalAmount = donations.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);

      const doc = new PDFDocument({
        margin: 50,
        size: 'LETTER'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=donations-report.pdf');

      doc.pipe(res);

      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('Donations Report', { align: 'center' });

      if (donationType) {
        doc.fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(`Donation Type: ${donationType}`, { align: 'center' });
        doc.fillColor('#000000');
      }

      if (startDate || endDate) {
        doc.fontSize(10)
          .font('Helvetica')
          .text(`From    ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'}    To    ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
      }

      doc.fontSize(9)
        .font('Helvetica')
        .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

      doc.moveDown(1.5);

      const cols = {
        date: 50,
        member: 150,
        type: 320,
        amount: 460
      };

      const printHeaders = () => {
        const hY = doc.y;
        doc.rect(50, hY - 3, 500, 18).fill('#f3f4f6');
        doc.fillColor('#000000')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('Date', cols.date, hY)
          .text('Person', cols.member, hY)
          .text('Type', cols.type, hY)
          .text('Amount', cols.amount, hY, { width: 90, align: 'right' });
        doc.moveDown(0.4);
      };

      printHeaders();

      let rowIndex = 0;
      donations.forEach((donation) => {
        if (doc.y > 690) {
          doc.addPage();
          printHeaders();
        }

        const y = doc.y;
        if (rowIndex % 2 === 0) {
          doc.rect(50, y - 2, 500, 16).fill('#f9fafb');
        }

        doc.fillColor('#000000').font('Helvetica').fontSize(9)
          .text(donation.donationDate ? new Date(donation.donationDate).toLocaleDateString() : 'N/A', cols.date, y)
          .text(donation.member ? `${donation.member.lastName || ''}, ${donation.member.firstName || ''}` : 'N/A', cols.member, y)
          .text(donation.donationType || 'N/A', cols.type, y)
          .text(formatCurrency(donation.amount), cols.amount, y, { width: 90, align: 'right' });

        doc.moveDown(0.2);
        rowIndex++;
      });

      // Show subtotal row ONLY if a specific category was selected
      if (donationType) {
        if (doc.y > 690) {
          doc.addPage();
          printHeaders();
        }
        const subtotalY = doc.y;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9.5)
          .text(`${donationType} Subtotal:`, cols.date, subtotalY + 2, { width: 400, align: 'right' })
          .text(formatCurrency(totalAmount), cols.amount, subtotalY + 2, { width: 90, align: 'right' });
        doc.fillColor('#000000');
        doc.moveDown(0.5);
      }

      // Grand Total row
      if (doc.y > 680) {
        doc.addPage();
        printHeaders();
      }
      doc.moveDown(0.3);
      const totalY = doc.y;
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11)
        .text('Total:', cols.date, totalY + 3, { width: 400, align: 'right' })
        .text(formatCurrency(totalAmount), cols.amount, totalY + 3, { width: 90, align: 'right' });

      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error generating PDF report', error: error.message });
      }
    }
  };

  router.post('/donations/pdf', authenticateToken, generateDonationsPdf);
  app.post('/reports/donations/pdf', authenticateToken, generateDonationsPdf);

  // Vendors Report Route
  app.get('/reports/vendors', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, vendorId } = req.query;

      let whereClause = {};

      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.createdAt = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.createdAt = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      // Add vendor ID filter if provided
      if (vendorId) {
        whereClause.id = parseInt(vendorId);
      }

      const vendors = await prisma.vendor.findMany({
        where: whereClause,
        orderBy: {
          lastName: 'asc'
        }
      });

      // Get total charges for each vendor
      const vendorsWithCharges = await Promise.all(
        vendors.map(async (vendor) => {
          const charges = await prisma.charge.findMany({
            where: {
              vendorId: vendor.id
            }
          });

          const totalCharges = charges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);

          return {
            ...vendor,
            totalCharges
          };
        })
      );

      res.json({
        vendors: vendorsWithCharges,
        total: vendorsWithCharges.length
      });
    } catch (error) {
      console.error('Error generating vendors report:', error);
      res.status(500).json({ message: 'Error generating vendors report' });
    }
  });

  // Vendors PDF Report
  app.post('/reports/vendors/pdf', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, vendorId } = req.body;

      let whereClause = {};

      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.createdAt = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.createdAt = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      // Add vendor ID filter if provided
      if (vendorId) {
        whereClause.id = parseInt(vendorId);
      }

      const vendors = await prisma.vendor.findMany({
        where: whereClause,
        orderBy: {
          lastName: 'asc'
        }
      });

      // Get total charges for each vendor
      const vendorsWithCharges = await Promise.all(
        vendors.map(async (vendor) => {
          const charges = await prisma.charge.findMany({
            where: {
              vendorId: vendor.id
            }
          });

          const totalCharges = charges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);

          return {
            ...vendor,
            totalCharges
          };
        })
      );

      const totalAmount = vendorsWithCharges.reduce((sum, v) => sum + v.totalCharges, 0);

      // Create PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=vendors-report.pdf');

      // Pipe PDF to response
      doc.pipe(res);

      doc.moveDown(0.5)
        .fontSize(18)
        .font('Helvetica')
        .text('Vendors Report', { align: 'center' });

      if (startDate || endDate) {
        doc.moveDown(0.5)
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`From    ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'}    To    ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
      }

      if (vendorId) {
        const vendor = vendorsWithCharges.find(v => v.id === parseInt(vendorId));
        if (vendor) {
          doc.moveDown(0.5)
            .fontSize(12)
            .font('Helvetica')
            .text(`Filtered by Vendor: ${vendor.lastName}`, { align: 'center' });
        }
      }

      doc.moveDown(2);

      // Draw table
      const tableTop = 150;
      const columns = {
        name: { x: 50, width: 200 },
        contact: { x: 270, width: 180 },
        amount: { x: 470, width: 100 }
      };

      // Draw header
      doc.font('Helvetica-Bold')
        .fontSize(10);

      // Header background
      doc.rect(50, tableTop - 5, 490, 20)
        .fill('#f3f4f6');

      // Header text
      doc.fillColor('#000000')
        .text('Vendor Name', columns.name.x, tableTop)
        .text('Contact', columns.contact.x, tableTop)
        .text('Total Charges', columns.amount.x, tableTop);

      // Draw rows
      let yPosition = tableTop + 25;
      doc.font('Helvetica').fontSize(10);

      vendorsWithCharges.forEach((vendor, i) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;

          // Repeat header on new page
          doc.rect(50, yPosition - 5, 490, 16)
            .fill('#f3f4f6');

          doc.fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Vendor Name', columns.name.x, yPosition)
            .text('Contact', columns.contact.x, yPosition)
            .text('Total Charges', columns.amount.x, yPosition);

          yPosition += 16;
          doc.font('Helvetica');
        }

        // Alternate row background
        if (i % 2 === 0) {
          doc.rect(50, yPosition - 5, 490, 16)
            .fill('#f9fafb');
        }

        doc.fillColor('#000000')
          .text(vendor.lastName, columns.name.x, yPosition)
          .text(vendor.email || 'N/A', columns.contact.x, yPosition)
          .text(formatCurrency(vendor.totalCharges || 0), columns.amount.x, yPosition);

        yPosition += 16;
      });

      // Add summary section
      doc.moveDown(5)
        .font('Helvetica-Bold')
        .fontSize(12);

      // Calculate the total text
      const totalText = `Total: ${formatCurrency(totalAmount)}`;
      const textWidth = doc.widthOfString(totalText);

      // Center the text by calculating the x position
      const x_Position = (doc.page.width - textWidth) / 2;

      // Set the y position right below the table
      const y_Position = yPosition + 20;

      // Add the total text at the calculated position
      doc.text(totalText, x_Position, y_Position);

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error('Error generating vendors PDF report:', error);
      res.status(500).json({ message: 'Error generating vendors PDF report' });
    }
  });

  // Expenses Report Route
  app.get('/reports/expenses', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let whereClause = {};

      if (startDate && endDate) {
        whereClause.dueDate = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.dueDate = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.dueDate = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      const expenses = await prisma.charge.findMany({
        where: whereClause,
        include: {
          vendor: true,
          expenseCategory: true
        },
        orderBy: {
          dueDate: 'desc'
        }
      });

      const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

      res.json({
        expenses,
        total
      });
    } catch (error) {
      console.error('Error generating expenses report:', error);
      res.status(500).json({ message: 'Error generating expenses report' });
    }
  });

  // Expenses PDF Report
  app.post('/reports/expenses/pdf', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      let whereClause = {};

      if (startDate && endDate) {
        whereClause.dueDate = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.dueDate = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.dueDate = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      const expenses = await prisma.charge.findMany({
        where: whereClause,
        include: {
          vendor: true,
          expenseCategory: true
        },
        orderBy: {
          dueDate: 'desc'
        }
      });

      const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=expenses-report.pdf');

      doc.pipe(res);

      doc.fontSize(20).text('Expenses Report', { align: 'center' });
      doc.moveDown();

      if (startDate || endDate) {
        doc.fontSize(12)
          .text(`Date Range: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
        doc.moveDown();
      }

      // Table headers
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Due Date', 50, 150);
      doc.text('Vendor', 150, 150);
      doc.text('Category', 250, 150);
      doc.text('Amount', 350, 150);
      doc.moveDown();

      let y = 180;
      doc.font('Helvetica');

      expenses.forEach(expense => {
        if (y > 700) {
          doc.addPage();
          y = 50;
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('Due Date', 50, y);
          doc.text('Vendor', 150, y);
          doc.text('Category', 250, y);
          doc.text('Amount', 350, y);
          y += 24;
          doc.font('Helvetica');
        }

        doc.text(new Date(expense.dueDate).toLocaleDateString(), 50, y);
        doc.text(`${expense.vendor.lastName}`, 150, y);
        doc.text(expense.expenseCategory?.name || 'N/A', 250, y);
        doc.text(formatCurrency(expense.amount), 350, y);
        y += 16;
      });

      // Total
      doc.moveDown();
      doc.font('Helvetica-Bold');
      doc.text(`Total: ${formatCurrency(total)}`, 350);

      doc.end();
    } catch (error) {
      console.error('Error generating expenses PDF report:', error);
      res.status(500).json({ message: 'Error generating expenses PDF report' });
    }
  });

  // Charges Report Route
  app.get('/reports/charges', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let whereClause = {};

      if (startDate && endDate) {
        whereClause.dueDate = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.dueDate = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.dueDate = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      const charges = await prisma.charge.findMany({
        where: whereClause,
        include: {
          vendor: true,
          expenseCategory: true
        },
        orderBy: {
          dueDate: 'desc'
        }
      });

      const total = charges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);

      // Group charges by category
      const categorySummary = charges.reduce((acc, charge) => {
        const categoryName = charge.expenseCategory?.name || 'Uncategorized';
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += parseFloat(charge.amount);
        return acc;
      }, {});

      res.json({
        charges,
        total,
        categorySummary
      });
    } catch (error) {
      console.error('Error generating charges report:', error);
      res.status(500).json({ message: 'Error generating charges report' });
    }
  });

  // Charges PDF Report
  app.post('/reports/charges/pdf', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      let whereClause = {};

      if (startDate && endDate) {
        whereClause.dueDate = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.dueDate = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.dueDate = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      const charges = await prisma.charge.findMany({
        where: whereClause,
        include: {
          vendor: true,
          expenseCategory: true
        },
        orderBy: {
          dueDate: 'desc'
        }
      });

      const total = charges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);

      // Group charges by category
      const categorySummary = charges.reduce((acc, charge) => {
        const categoryName = charge.expenseCategory?.name || 'Uncategorized';
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += parseFloat(charge.amount);
        return acc;
      }, {});

      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=charges-report.pdf');

      doc.pipe(res);

      doc.fontSize(20).text('Charges Report', { align: 'center' });
      doc.moveDown();

      if (startDate || endDate) {
        doc.fontSize(12)
          .text(`Date Range: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
        doc.moveDown();
      }

      // Table headers
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Due Date', 50, 150);
      doc.text('Vendor', 150, 150);
      doc.text('Category', 250, 150);
      doc.text('Amount', 350, 150);
      doc.moveDown();

      let y = 180;
      doc.font('Helvetica');

      charges.forEach(charge => {
        if (y > 700) {
          doc.addPage();
          y = 50;
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('Due Date', 50, y);
          doc.text('Vendor', 150, y);
          doc.text('Category', 250, y);
          doc.text('Amount', 350, y);
          y += 24;
          doc.font('Helvetica');
        }

        doc.text(new Date(charge.dueDate).toLocaleDateString(), 50, y);
        doc.text(`${charge.vendor.lastName}`, 150, y);
        doc.text(charge.expenseCategory?.name || 'N/A', 250, y);
        doc.text(formatCurrency(charge.amount), 350, y);
        y += 16;
      });

      // Total
      doc.moveDown();
      doc.font('Helvetica-Bold');
      doc.text(`Total: ${formatCurrency(total)}`, 350);

      // Category Summary
      doc.addPage();
      doc.fontSize(16).text('Category Summary', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Category', 100, 100);
      doc.text('Amount', 300, 100);
      doc.moveDown();

      y = 130;
      doc.font('Helvetica');

      Object.entries(categorySummary).forEach(([category, amount]) => {
        doc.text(category, 100, y);
        doc.text(formatCurrency(amount), 300, y);
        y += 16;
      });

      doc.end();
    } catch (error) {
      console.error('Error generating charges PDF report:', error);
      res.status(500).json({ message: 'Error generating charges PDF report' });
    }
  });

  // Deposits Report Route
  app.get('/reports/deposits', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let whereClause = {};

      if (startDate && endDate) {
        whereClause.date = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.date = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.date = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      const deposits = await prisma.deposit.findMany({
        where: whereClause,
        include: {
          bank: true,
          checks: true
        },
        orderBy: {
          date: 'desc'
        }
      });

      const total = deposits.reduce((sum, deposit) => sum + parseFloat(deposit.totalAmount || 0), 0);

      res.json({
        deposits,
        total
      });
    } catch (error) {
      console.error('Error generating deposits report:', error);
      res.status(500).json({ message: 'Error generating deposits report' });
    }
  });

  // Deposits PDF Report
  app.post('/reports/deposits/pdf', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      let whereClause = {};

      if (startDate && endDate) {
        whereClause.date = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.date = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.date = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      const deposits = await prisma.deposit.findMany({
        where: whereClause,
        include: {
          bank: true,
          checks: true
        },
        orderBy: {
          date: 'desc'
        }
      });

      const total = deposits.reduce((sum, deposit) => sum + parseFloat(deposit.totalAmount || 0), 0);

      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=deposits-report.pdf');

      doc.pipe(res);

      doc.fontSize(20).text('Deposits Report', { align: 'center' });
      doc.moveDown();

      if (startDate || endDate) {
        doc.fontSize(12)
          .text(`Date Range: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
        doc.moveDown();
      }

      // Table headers
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Date', 50, 150);
      doc.text('Bank', 150, 150);
      doc.text('Account #', 250, 150);
      doc.text('Cash', 350, 150);
      doc.text('Check', 430, 150);
      doc.text('Total', 510, 150);
      doc.moveDown();

      let y = 180;
      doc.font('Helvetica');

      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        }).format(parseFloat(amount || 0));
      };

      // Calculate the total check amount from the checks array
      const getCheckAmount = (deposit) => {
        if (!deposit.checks || deposit.checks.length === 0) {
          return 0;
        }
        return deposit.checks.reduce((sum, check) => sum + parseFloat(check.amount || 0), 0);
      };

      deposits.forEach(deposit => {
        if (y > 700) {
          doc.addPage();
          y = 50;
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('Date', 50, y);
          doc.text('Bank', 150, y);
          doc.text('Account #', 250, y);
          doc.text('Cash', 350, y);
          doc.text('Check', 430, y);
          doc.text('Total', 510, y);
          y += 24;
          doc.font('Helvetica');
        }

        doc.text(new Date(deposit.date).toLocaleDateString(), 50, y);
        doc.text(deposit.bank?.name || 'N/A', 150, y);
        doc.text(deposit.accountNumber || 'N/A', 250, y);
        doc.text(formatCurrency(deposit.cashAmount), 350, y);
        doc.text(formatCurrency(getCheckAmount(deposit)), 430, y);
        doc.text(formatCurrency(deposit.totalAmount), 510, y);
        y += 16;
      });

      // Total
      doc.moveDown();
      doc.font('Helvetica-Bold');
      doc.text(`Total: ${formatCurrency(total)}`, 400);

      doc.end();
    } catch (error) {
      console.error('Error generating deposits PDF report:', error);
      res.status(500).json({ message: 'Error generating deposits PDF report' });
    }
  });

  // Membership PDF Report
  app.post('/reports/membership/pdf', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, memberStatus } = req.body;

      let whereClause = {};

      // Date filtering
      if (startDate && endDate) {
        whereClause.membershipDate = {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      } else if (startDate) {
        whereClause.membershipDate = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.membershipDate = {
          lte: new Date(new Date(endDate).setHours(23, 59, 59))
        };
      }

      // Member status filtering
      if (memberStatus === 'active') {
        whereClause.isActive = true;
      } else if (memberStatus === 'inactive') {
        whereClause.isActive = false;
      }
      // If memberStatus is 'all' or undefined, don't filter by status

      const members = await prisma.member.findMany({
        where: whereClause,
        include: {
          groups: {
            include: {
              group: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          lastName: 'asc'
        }
      });

      // Transform the data to include group names
      const formattedMembers = members.map(member => ({
        ...member,
        groups: member.groups.map(membership => membership.group.name)
      }));

      // Create PDF document with landscape orientation for more space
      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'landscape'
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=membership-report.pdf');

      // Pipe PDF to response
      doc.pipe(res);

      // Add title
      doc.fontSize(20).text('Membership Report', { align: 'center' });
      doc.moveDown();

      // Add date range if provided
      if (startDate || endDate) {
        doc.fontSize(12).text(`Date Range: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
        doc.moveDown();
      }

      // Add member status filter info
      if (memberStatus === 'active') {
        doc.fontSize(12).text('Active Members Only', { align: 'center' });
      } else if (memberStatus === 'inactive') {
        doc.fontSize(12).text('Inactive Members Only', { align: 'center' });
      } else {
        doc.fontSize(12).text('All Members', { align: 'center' });
      }
      doc.moveDown();

      // Add total count
      doc.fontSize(14).text(`Total Members: ${formattedMembers.length}`, { align: 'left' });
      doc.moveDown(2);

      // Define column widths with more space for address
      const columnWidths = {
        name: 120,
        phone: 100,
        address: 200,  // Increased width for address
        email: 140,
        date: 80,
        groups: 140
      };

      // Create table headers
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');

      let xPos = 30;
      doc.text('Name', xPos, tableTop);
      xPos += columnWidths.name;

      doc.text('Phone', xPos, tableTop);
      xPos += columnWidths.phone;

      doc.text('Address', xPos, tableTop);
      xPos += columnWidths.address;

      doc.text('Email', xPos, tableTop);
      xPos += columnWidths.email;

      doc.text('Member Date', xPos, tableTop);
      xPos += columnWidths.date;

      doc.text('Groups', xPos, tableTop);

      // Draw a line
      doc.moveDown();
      doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
      doc.moveDown(0.5);

      // Table rows
      let y = doc.y;
      doc.font('Helvetica').fontSize(9);

      formattedMembers.forEach((member) => {
        // Check if we need a new page
        if (y > doc.page.height - 50) {
          doc.addPage({ layout: 'landscape' });
          y = 50;

          // Redraw headers on new page
          doc.fontSize(10).font('Helvetica-Bold');

          xPos = 30;
          doc.text('Name', xPos, y);
          xPos += columnWidths.name;

          doc.text('Phone', xPos, y);
          xPos += columnWidths.phone;

          doc.text('Address', xPos, y);
          xPos += columnWidths.address;

          doc.text('Email', xPos, y);
          xPos += columnWidths.email;

          doc.text('Member Date', xPos, y);
          xPos += columnWidths.date;

          doc.text('Groups', xPos, y);

          // Draw a line
          y += 12;
          doc.moveTo(30, y).lineTo(doc.page.width - 30, y).stroke();
          y += 12;
          doc.font('Helvetica').fontSize(9);
        }

        const name = `${member.lastName}, ${member.firstName}`;
        const address = [member.address, member.city, member.state, member.zipCode]
          .filter(Boolean)
          .join(', ');
        const groups = member.groups.join(', ') || 'None';
        const memberDate = member.membershipDate ? new Date(member.membershipDate).toLocaleDateString() : 'N/A';

        xPos = 30;
        doc.text(name, xPos, y, { width: columnWidths.name - 5 });
        xPos += columnWidths.name;

        doc.text(member.cellPhone || 'N/A', xPos, y);
        xPos += columnWidths.phone;

        doc.text(address || 'N/A', xPos, y, { width: columnWidths.address - 5 });
        xPos += columnWidths.address;

        doc.text(member.email || 'N/A', xPos, y, { width: columnWidths.email - 5 });
        xPos += columnWidths.email;

        doc.text(memberDate, xPos, y);
        xPos += columnWidths.date;

        doc.text(groups, xPos, y, { width: columnWidths.groups - 5 });

        y += 16;
      });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('Error generating membership PDF report:', error);
      res.status(500).json({ message: 'Error generating membership PDF report' });
    }
  });

  // Groups PDF Report
  app.post('/reports/groups/pdf', authenticateToken, async (req, res) => {
    try {
      const groups = await prisma.group.findMany({
        include: {
          _count: {
            select: { members: true }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Create PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=groups-report.pdf');

      // Pipe PDF to response
      doc.pipe(res);

      doc.moveDown(0.5)
        .fontSize(18)
        .font('Helvetica')
        .text('Groups Report', { align: 'center' });

      doc.moveDown(2);

      // Draw table
      const tableTop = 150;
      const columns = {
        name: { x: 50, width: 150 },
        description: { x: 220, width: 230 },
        count: { x: 470, width: 100 }
      };

      // Draw header
      doc.font('Helvetica-Bold')
        .fontSize(10);

      // Header background
      doc.rect(50, tableTop - 5, 490, 20)
        .fill('#f3f4f6');

      // Header text
      doc.fillColor('#000000')
        .text('Group Name', columns.name.x, tableTop)
        .text('Description', columns.description.x, tableTop)
        .text('Member Count', columns.count.x, tableTop);

      // Draw rows
      let yPosition = tableTop + 25;
      doc.font('Helvetica').fontSize(10);

      groups.forEach((group, i) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;

          // Repeat header on new page
          doc.rect(50, yPosition - 5, 490, 16)
            .fill('#f3f4f6');

          doc.fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Group Name', columns.name.x, yPosition)
            .text('Description', columns.description.x, yPosition)
            .text('Member Count', columns.count.x, yPosition);

          yPosition += 16;
          doc.font('Helvetica');
        }

        // Alternate row background
        if (i % 2 === 0) {
          doc.rect(50, yPosition - 5, 490, 16)
            .fill('#f9fafb');
        }

        doc.fillColor('#000000')
          .text(group.name, columns.name.x, yPosition)
          .text(group.description || 'No description', columns.description.x, yPosition)
          .text(group._count.members.toString(), columns.count.x, yPosition);

        yPosition += 16;
      });

      // Add summary section
      doc.moveDown(5)
        .font('Helvetica-Bold')
        .fontSize(12);

      // Calculate the total text
      const totalText = `Total Groups: ${groups.length}`;
      const textWidth = doc.widthOfString(totalText);

      // Center the text by calculating the x position
      const x_Position = (doc.page.width - textWidth) / 2;

      // Set the y position right below the table
      const y_Position = yPosition + 20;

      // Add the total text at the calculated position
      doc.text(totalText, x_Position, y_Position);

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('Error generating groups PDF report:', error);
      res.status(500).json({ message: 'Error generating groups PDF report' });
    }
  });

  // ─── Member Donations Report ──────────────────────────────────────────────

  app.get('/reports/memberDonations', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, memberId, donationType } = req.query;

      let whereClause = { memberId: { not: null } };

      if (startDate && endDate) {
        whereClause.donationDate = { gte: new Date(startDate), lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      } else if (startDate) {
        whereClause.donationDate = { gte: new Date(startDate) };
      } else if (endDate) {
        whereClause.donationDate = { lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      }

      if (memberId) whereClause.memberId = parseInt(memberId);
      if (donationType) whereClause.donationType = { equals: donationType.trim(), mode: 'insensitive' };

      const donations = await prisma.donation.findMany({
        where: whereClause,
        include: { member: { select: { firstName: true, lastName: true } } },
        orderBy: { donationDate: 'desc' }
      });

      const total = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      res.json({ donations, total });
    } catch (error) {
      console.error('Error generating member donations report:', error);
      res.status(500).json({ message: 'Error generating member donations report' });
    }
  });

  app.post('/reports/memberDonations/pdf', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, memberId, donationType } = req.body;

      let whereClause = { memberId: { not: null } };
      if (startDate && endDate) {
        whereClause.donationDate = { gte: new Date(startDate), lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      } else if (startDate) {
        whereClause.donationDate = { gte: new Date(startDate) };
      } else if (endDate) {
        whereClause.donationDate = { lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      }
      if (memberId) whereClause.memberId = parseInt(memberId);
      if (donationType) whereClause.donationType = { equals: donationType.trim(), mode: 'insensitive' };

      const donations = await prisma.donation.findMany({
        where: whereClause,
        include: { member: { select: { firstName: true, lastName: true } } },
        orderBy: { donationDate: 'desc' }
      });

      const total = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=member-donations-report.pdf');
      doc.pipe(res);

      doc.fontSize(18).font('Helvetica-Bold').text('Member Donations Report', { align: 'center' });
      if (donationType) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(`Donation Type: ${donationType}`, { align: 'center' });
        doc.fillColor('#000000');
      }
      if (startDate || endDate) {
        doc.fontSize(10).font('Helvetica').text(`Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
      }
      doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1.2);

      const cols = { date: 50, member: 140, type: 310, amount: 460 };
      const printHeaders = () => {
        const hY = doc.y;
        doc.rect(50, hY - 3, 500, 18).fill('#f3f4f6');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10)
          .text('Date', cols.date, hY)
          .text('Member', cols.member, hY)
          .text('Type', cols.type, hY)
          .text('Amount', cols.amount, hY, { width: 90, align: 'right' });
        doc.moveDown(0.4);
      };

      printHeaders();

      let rowIndex = 0;
      donations.forEach((d) => {
        if (doc.y > 690) {
          doc.addPage();
          printHeaders();
        }
        const y = doc.y;
        if (rowIndex % 2 === 0) doc.rect(50, y - 2, 500, 16).fill('#f9fafb');
        doc.fillColor('#000000').font('Helvetica').fontSize(9)
          .text(d.donationDate ? new Date(d.donationDate).toLocaleDateString() : 'N/A', cols.date, y)
          .text(`${d.member?.lastName || ''}, ${d.member?.firstName || ''}`, cols.member, y)
          .text(d.donationType || 'N/A', cols.type, y)
          .text(formatCurrency(d.amount), cols.amount, y, { width: 90, align: 'right' });
        doc.moveDown(0.2);
        rowIndex++;
      });

      // Show subtotal row ONLY if a specific category was selected
      if (donationType) {
        if (doc.y > 690) {
          doc.addPage();
          printHeaders();
        }
        const subtotalY = doc.y;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9.5)
          .text(`${donationType} Subtotal:`, cols.date, subtotalY + 2, { width: 400, align: 'right' })
          .text(formatCurrency(total), cols.amount, subtotalY + 2, { width: 90, align: 'right' });
        doc.fillColor('#000000');
        doc.moveDown(0.5);
      }

      // Grand Total row
      if (doc.y > 680) {
        doc.addPage();
        printHeaders();
      }
      doc.moveDown(0.3);
      const totalY = doc.y;
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11)
        .text('Total:', cols.date, totalY + 3, { width: 400, align: 'right' })
        .text(formatCurrency(total), cols.amount, totalY + 3, { width: 90, align: 'right' });

      doc.end();
    } catch (error) {
      console.error('Error generating member donations PDF:', error);
      res.status(500).json({ message: 'Error generating member donations PDF' });
    }
  });

  // ─── Visitor Donations Report ─────────────────────────────────────────────

  app.get('/reports/visitorDonations', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, visitorId, donationType } = req.query;

      let whereClause = { visitorId: { not: null } };

      if (startDate && endDate) {
        whereClause.donationDate = { gte: new Date(startDate), lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      } else if (startDate) {
        whereClause.donationDate = { gte: new Date(startDate) };
      } else if (endDate) {
        whereClause.donationDate = { lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      }

      if (visitorId) whereClause.visitorId = parseInt(visitorId);
      if (donationType) whereClause.donationType = { equals: donationType.trim(), mode: 'insensitive' };

      const donations = await prisma.donation.findMany({
        where: whereClause,
        include: { visitor: { select: { firstName: true, lastName: true } } },
        orderBy: { donationDate: 'desc' }
      });

      const total = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      res.json({ donations, total });
    } catch (error) {
      console.error('Error generating visitor donations report:', error);
      res.status(500).json({ message: 'Error generating visitor donations report' });
    }
  });

  app.post('/reports/visitorDonations/pdf', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, visitorId, donationType } = req.body;

      let whereClause = { visitorId: { not: null } };
      if (startDate && endDate) {
        whereClause.donationDate = { gte: new Date(startDate), lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      } else if (startDate) {
        whereClause.donationDate = { gte: new Date(startDate) };
      } else if (endDate) {
        whereClause.donationDate = { lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      }
      if (visitorId) whereClause.visitorId = parseInt(visitorId);
      if (donationType) whereClause.donationType = { equals: donationType.trim(), mode: 'insensitive' };

      const donations = await prisma.donation.findMany({
        where: whereClause,
        include: { visitor: { select: { firstName: true, lastName: true } } },
        orderBy: { donationDate: 'desc' }
      });

      const total = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=visitor-donations-report.pdf');
      doc.pipe(res);

      doc.fontSize(18).font('Helvetica-Bold').text('Visitor Donations Report', { align: 'center' });
      if (donationType) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(`Donation Type: ${donationType}`, { align: 'center' });
        doc.fillColor('#000000');
      }
      if (startDate || endDate) {
        doc.fontSize(10).font('Helvetica').text(`Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
      }
      doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1.2);

      const cols = { date: 50, visitor: 140, type: 310, amount: 460 };
      const printHeaders = () => {
        const hY = doc.y;
        doc.rect(50, hY - 3, 500, 18).fill('#f3f4f6');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10)
          .text('Date', cols.date, hY)
          .text('Visitor', cols.visitor, hY)
          .text('Type', cols.type, hY)
          .text('Amount', cols.amount, hY, { width: 90, align: 'right' });
        doc.moveDown(0.4);
      };

      printHeaders();

      let rowIndex = 0;
      donations.forEach((d) => {
        if (doc.y > 690) {
          doc.addPage();
          printHeaders();
        }
        const y = doc.y;
        if (rowIndex % 2 === 0) doc.rect(50, y - 2, 500, 16).fill('#f9fafb');
        doc.fillColor('#000000').font('Helvetica').fontSize(9)
          .text(d.donationDate ? new Date(d.donationDate).toLocaleDateString() : 'N/A', cols.date, y)
          .text(`${d.visitor?.lastName || ''}, ${d.visitor?.firstName || ''}`, cols.visitor, y)
          .text(d.donationType || 'N/A', cols.type, y)
          .text(formatCurrency(d.amount), cols.amount, y, { width: 90, align: 'right' });
        doc.moveDown(0.2);
        rowIndex++;
      });

      // Show subtotal row ONLY if a specific category was selected
      if (donationType) {
        if (doc.y > 690) {
          doc.addPage();
          printHeaders();
        }
        const subtotalY = doc.y;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9.5)
          .text(`${donationType} Subtotal:`, cols.date, subtotalY + 2, { width: 400, align: 'right' })
          .text(formatCurrency(total), cols.amount, subtotalY + 2, { width: 90, align: 'right' });
        doc.fillColor('#000000');
        doc.moveDown(0.5);
      }

      // Grand Total row
      if (doc.y > 680) {
        doc.addPage();
        printHeaders();
      }
      doc.moveDown(0.3);
      const totalY = doc.y;
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11)
        .text('Total:', cols.date, totalY + 3, { width: 400, align: 'right' })
        .text(formatCurrency(total), cols.amount, totalY + 3, { width: 90, align: 'right' });

      doc.end();
    } catch (error) {
      console.error('Error generating visitor donations PDF:', error);
      res.status(500).json({ message: 'Error generating visitor donations PDF' });
    }
  });

  // ─── Supporter Donations Report ───────────────────────────────────────────

  app.get('/reports/supporterDonations', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, supporterId, donationType } = req.query;

      let whereClause = { supporterId: { not: null } };

      if (startDate && endDate) {
        whereClause.donationDate = { gte: new Date(startDate), lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      } else if (startDate) {
        whereClause.donationDate = { gte: new Date(startDate) };
      } else if (endDate) {
        whereClause.donationDate = { lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      }

      if (supporterId) whereClause.supporterId = parseInt(supporterId);
      if (donationType) whereClause.donationType = { equals: donationType.trim(), mode: 'insensitive' };

      const donations = await prisma.donation.findMany({
        where: whereClause,
        include: { supporter: { select: { firstName: true, lastName: true } } },
        orderBy: { donationDate: 'desc' }
      });

      const total = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      res.json({ donations, total });
    } catch (error) {
      console.error('Error generating supporter donations report:', error);
      res.status(500).json({ message: 'Error generating supporter donations report' });
    }
  });

  app.post('/reports/supporterDonations/pdf', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, supporterId, donationType } = req.body;

      let whereClause = { supporterId: { not: null } };
      if (startDate && endDate) {
        whereClause.donationDate = { gte: new Date(startDate), lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      } else if (startDate) {
        whereClause.donationDate = { gte: new Date(startDate) };
      } else if (endDate) {
        whereClause.donationDate = { lte: new Date(new Date(endDate).setHours(23, 59, 59)) };
      }
      if (supporterId) whereClause.supporterId = parseInt(supporterId);
      if (donationType) whereClause.donationType = { equals: donationType.trim(), mode: 'insensitive' };

      const donations = await prisma.donation.findMany({
        where: whereClause,
        include: { supporter: { select: { firstName: true, lastName: true } } },
        orderBy: { donationDate: 'desc' }
      });

      const total = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=supporter-donations-report.pdf');
      doc.pipe(res);

      doc.fontSize(18).font('Helvetica-Bold').text('Supporter Donations Report', { align: 'center' });
      if (donationType) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(`Donation Type: ${donationType}`, { align: 'center' });
        doc.fillColor('#000000');
      }
      if (startDate || endDate) {
        doc.fontSize(10).font('Helvetica').text(`Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
      }
      doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1.2);

      const cols = { date: 50, supporter: 140, type: 310, amount: 460 };
      const printHeaders = () => {
        const hY = doc.y;
        doc.rect(50, hY - 3, 500, 18).fill('#f3f4f6');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10)
          .text('Date', cols.date, hY)
          .text('Supporter', cols.supporter, hY)
          .text('Type', cols.type, hY)
          .text('Amount', cols.amount, hY, { width: 90, align: 'right' });
        doc.moveDown(0.4);
      };

      printHeaders();

      let rowIndex = 0;
      donations.forEach((d) => {
        if (doc.y > 690) {
          doc.addPage();
          printHeaders();
        }
        const y = doc.y;
        if (rowIndex % 2 === 0) doc.rect(50, y - 2, 500, 16).fill('#f9fafb');
        doc.fillColor('#000000').font('Helvetica').fontSize(9)
          .text(d.donationDate ? new Date(d.donationDate).toLocaleDateString() : 'N/A', cols.date, y)
          .text(`${d.supporter?.lastName || ''}, ${d.supporter?.firstName || ''}`, cols.supporter, y)
          .text(d.donationType || 'N/A', cols.type, y)
          .text(formatCurrency(d.amount), cols.amount, y, { width: 90, align: 'right' });
        doc.moveDown(0.2);
        rowIndex++;
      });

      // Show subtotal row ONLY if a specific category was selected
      if (donationType) {
        if (doc.y > 690) {
          doc.addPage();
          printHeaders();
        }
        const subtotalY = doc.y;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9.5)
          .text(`${donationType} Subtotal:`, cols.date, subtotalY + 2, { width: 400, align: 'right' })
          .text(formatCurrency(total), cols.amount, subtotalY + 2, { width: 90, align: 'right' });
        doc.fillColor('#000000');
        doc.moveDown(0.5);
      }

      // Grand Total row
      if (doc.y > 680) {
        doc.addPage();
        printHeaders();
      }
      doc.moveDown(0.3);
      const totalY = doc.y;
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11)
        .text('Total:', cols.date, totalY + 3, { width: 400, align: 'right' })
        .text(formatCurrency(total), cols.amount, totalY + 3, { width: 90, align: 'right' });

      doc.end();
    } catch (error) {
      console.error('Error generating supporter donations PDF:', error);
      res.status(500).json({ message: 'Error generating supporter donations PDF' });
    }
  });

  return router;
};
