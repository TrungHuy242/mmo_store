import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import prisma from '../../database/prisma.js';

const router = Router();

// Get all tickets (admin)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority, assignedTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedToId = assignedTo;
    
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, username: true } },
          assignedTo: { select: { id: true, email: true, fullName: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);
    
    res.json({ success: true, data: tickets, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
});

// Get user's tickets
router.get('/my-tickets', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { userId: req.user.userId },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.count({ where: { userId: req.user.userId } }),
    ]);
    
    res.json({ success: true, data: tickets, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
});

// Get ticket by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, username: true } },
        assignedTo: { select: { id: true, email: true, fullName: true } },
        replies: { include: { user: { select: { id: true, email: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        notes: true,
      },
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Check access
    if (req.user.role === 'CUSTOMER' && ticket.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// Create ticket
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { subject, content, priority = 'MEDIUM' } = req.body;
    
    const ticketNumber = `TKT${Date.now().toString(36).toUpperCase()}`;
    
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        userId: req.user.userId,
        subject,
        content,
        priority,
      },
    });
    
    res.status(201).json({ success: true, message: 'Ticket created', data: ticket });
  } catch (error) {
    next(error);
  }
});

// Reply to ticket
router.post('/:id/reply', authenticate, async (req, res, next) => {
  try {
    const { content, isInternal = false } = req.body;
    
    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: req.params.id,
        userId: req.user.userId,
        content,
        isInternal,
      },
    });
    
    // Update ticket
    await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: isInternal ? 'IN_PROGRESS' : 'PENDING' },
    });
    
    res.status(201).json({ success: true, message: 'Reply added', data: reply });
  } catch (error) {
    next(error);
  }
});

// Assign ticket
router.patch('/:id/assign', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { assignedToId } = req.body;
    
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { assignedToId, status: 'IN_PROGRESS' },
    });
    
    res.json({ success: true, message: 'Ticket assigned', data: ticket });
  } catch (error) {
    next(error);
  }
});

// Close ticket
router.patch('/:id/close', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: 'CLOSED', isResolved: true, closedAt: new Date() },
    });
    
    res.json({ success: true, message: 'Ticket closed', data: ticket });
  } catch (error) {
    next(error);
  }
});

// Rate ticket (customer feedback)
router.post('/:id/rate', authenticate, async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Only ticket owner can rate
    if (ticket.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Only ticket owner can rate' });
    }
    
    // Ticket must be closed
    if (ticket.status !== 'CLOSED') {
      return res.status(400).json({ error: 'Can only rate closed tickets' });
    }
    
    // Update ticket with rating
    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        rating: parseInt(rating),
        feedback: feedback || null,
      },
    });
    
    res.json({ success: true, message: 'Rating submitted', data: updatedTicket });
  } catch (error) {
    next(error);
  }
});

export default router;
