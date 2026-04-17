const prisma = require('../lib/prisma');

class NoticeController {
  static async list(req, res) {
    try {
      const where = {};
      if (req.user.role !== 'SUPER_ADMIN') {
        where.societyId = req.user.societyId;
      }

      // Filter for non-admin users (Residents, Guards, etc.)
      if (!['ADMIN', 'SUPER_ADMIN', 'COMMUNITY_MANAGER'].includes(req.user.role)) {
        where.AND = [
          { status: 'PUBLISHED' },
          {
            startDate: {
              lte: new Date(new Date().getTime() + 60000) // 1 minute buffer for immediate visibility
            }
          },
          {
            OR: [
              { audience: 'ALL' },
              { audience: 'RESIDENTS' },
              { audience: req.user.role }
            ]
          },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ];
      }

      const notices = await prisma.notice.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      res.json(notices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { title, content, audience, type, priority, status, isPinned, startDate, expiresAt } = req.body;

      // Handle empty or invalid dates
      let sDate = startDate ? new Date(startDate) : new Date();
      if (sDate.toString() === 'Invalid Date') sDate = new Date();

      const notice = await prisma.notice.create({
        data: {
          title,
          content,
          audience: audience || 'ALL',
          type: type || 'announcement',
          priority: priority || 'medium',
          status: status || 'PUBLISHED',
          isPinned: isPinned === true || isPinned === 'true',
          societyId: req.user.societyId,
          startDate: sDate,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        }
      });
      res.status(201).json(notice);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await prisma.notice.findUnique({ where: { id: parseInt(id) } });
      if (!existing) return res.status(404).json({ error: 'Notice not found' });
      if (req.user.role !== 'SUPER_ADMIN' && existing.societyId !== req.user.societyId) {
        return res.status(403).json({ error: 'Access denied: notice belongs to another society' });
      }
      const notice = await prisma.notice.update({
        where: { id: parseInt(id) },
        data: req.body
      });
      res.json(notice);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await prisma.notice.findUnique({ where: { id: parseInt(id) } });
      if (!existing) return res.status(404).json({ error: 'Notice not found' });
      if (req.user.role !== 'SUPER_ADMIN' && existing.societyId !== req.user.societyId) {
        return res.status(403).json({ error: 'Access denied: notice belongs to another society' });
      }
      await prisma.notice.delete({ where: { id: parseInt(id) } });
      res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = NoticeController;
