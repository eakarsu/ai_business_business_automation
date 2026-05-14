import express from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { paginationMeta } from '../lib/exportUtils';

const router = express.Router();

// GET /api/notifications — list notifications for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const skip = (page - 1) * limit;

    const where: any = { userId: req.user!.id };
    if (unreadOnly) where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });

    return res.json({
      success: true,
      notifications,
      unreadCount,
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read — mark one notification as read
router.patch('/:id/read', async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });
    if (!notification || notification.userId !== req.user!.id) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });
    return res.json({ success: true, notification: updated });
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return res.status(500).json({ success: false, error: 'Failed to update notifications' });
  }
});

// DELETE /api/notifications/:id — delete a notification
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });
    if (!notification || notification.userId !== req.user!.id) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    await prisma.notification.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

export default router;
