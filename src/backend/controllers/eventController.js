const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFDocument = require('pdfkit');
const { sendEmail, sendSMS } = require('../services/notificationService');

const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        group: true,
      },
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

const createEvent = async (req, res) => {
  const { title, description, date, duration, eventType, groupId } = req.body;

  try {
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        duration: duration ? parseInt(duration) : null,
        eventType,
        groupId: groupId ? parseInt(groupId) : null,
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                member: true
              }
            }
          }
        }
      }
    });

    // Handle notifications
    if (newEvent.group && newEvent.group.members && newEvent.group.members.length > 0) {
      const message = `Upcoming event: ${title} on ${new Date(date).toLocaleString()}. Type: ${eventType}.`;
      
      for (const groupMember of newEvent.group.members) {
        const member = groupMember.member;
        if (member) {
          if (member.email) {
            await sendEmail(member.email, `Upcoming Event: ${title}`, message);
          }
          if (member.cellPhone) {
            await sendSMS(member.cellPhone, message);
          }
        }
      }
    }

    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, date, duration, eventType, groupId } = req.body;

  try {
    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        date: new Date(date),
        duration: duration ? parseInt(duration) : null,
        eventType,
        groupId: groupId ? parseInt(groupId) : null,
      },
    });
    res.json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.event.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

const generateEventsPDF = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        group: true,
      },
      orderBy: {
        date: 'asc'
      }
    });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=church-events-calendar.pdf');

    doc.pipe(res);

    doc.moveDown(0.5)
      .fontSize(18)
      .font('Helvetica')
      .text('Church Events Calendar', { align: 'center' });

    doc.moveDown(2);

    const tableTop = 130;
    const columns = {
      date: { x: 50, width: 80 },
      time: { x: 130, width: 60 },
      duration: { x: 195, width: 60 },
      title: { x: 260, width: 135 },
      type: { x: 400, width: 70 },
      group: { x: 480, width: 70 }
    };

    doc.font('Helvetica-Bold').fontSize(10);
    doc.rect(50, tableTop - 5, 495, 20).fill('#f3f4f6');

    doc.fillColor('#000000')
      .text('Date', columns.date.x, tableTop)
      .text('Time', columns.time.x, tableTop)
      .text('Duration', columns.duration.x, tableTop)
      .text('Event Title', columns.title.x, tableTop)
      .text('Type', columns.type.x, tableTop)
      .text('Group', columns.group.x, tableTop);

    let yPosition = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    events.forEach((event, i) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;

        doc.rect(50, yPosition - 5, 495, 20).fill('#f3f4f6');
        doc.fillColor('#000000')
          .font('Helvetica-Bold').fontSize(10)
          .text('Date', columns.date.x, yPosition)
          .text('Time', columns.time.x, yPosition)
          .text('Duration', columns.duration.x, yPosition)
          .text('Event Title', columns.title.x, yPosition)
          .text('Type', columns.type.x, yPosition)
          .text('Group', columns.group.x, yPosition);

        yPosition += 25;
        doc.font('Helvetica').fontSize(9);
      }

      if (i % 2 === 0) {
        doc.rect(50, yPosition - 5, 495, 16).fill('#f9fafb');
      }

      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString();
      const formattedTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const durationText = event.duration ? `${event.duration} min` : 'N/A';
      
      doc.fillColor('#1f2937')
        .text(formattedDate, columns.date.x, yPosition)
        .text(formattedTime, columns.time.x, yPosition)
        .text(durationText, columns.duration.x, yPosition)
        .text(event.title, columns.title.x, yPosition, { width: columns.title.width })
        .text(event.eventType || 'N/A', columns.type.x, yPosition)
        .text(event.group ? event.group.name : 'Church-wide', columns.group.x, yPosition);

      const rowHeight = doc.heightOfString(event.title, { width: columns.title.width });
      yPosition += Math.max(16, rowHeight + 10);
    });

    doc.end();
  } catch (error) {
    console.error('Error generating events PDF:', error);
    res.status(500).json({ error: 'Failed to generate events PDF' });
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  generateEventsPDF,
};
