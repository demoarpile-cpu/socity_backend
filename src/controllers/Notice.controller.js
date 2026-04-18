const prisma = require('../lib/prisma');

class NoticeController {
  static async list(req, res) {
    try {
      const userRole = req.user.role.toUpperCase();
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'COMMUNITY_MANAGER'].includes(userRole);
      
      const societyId = userRole !== 'SUPER_ADMIN' ? req.user.societyId : undefined;
      
      const where = {
        societyId,
        status: 'PUBLISHED'
      };

      let allowedAudiences = ['ALL'];
      if (!isAdmin) {
        if (userRole === 'RESIDENT' || userRole === 'TENANT' || userRole === 'OWNER') {
          allowedAudiences.push('RESIDENTS');
        } else if (userRole === 'GUARD') {
          allowedAudiences.push('GUARD');
        } else {
          allowedAudiences.push(userRole);
        }

        where.audience = { in: allowedAudiences };
        where.startDate = { lte: new Date() };
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ];
      }

      const fs = require('fs');
      try {
        fs.appendFileSync('notice_query_debug.log', `[${new Date().toISOString()}] User: ${req.user.email}, Role: ${userRole}, Allowed: ${JSON.stringify(allowedAudiences)}\n`);
      } catch(e) {}

      let notices = await prisma.notice.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      // Secondary Failsafe: Filter in JavaScript to be 100% sure
      if (!isAdmin) {
        notices = notices.filter(n => allowedAudiences.includes(n.audience));
      }

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

  static async trackView(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await prisma.noticeView.upsert({
        where: {
          noticeId_userId: {
            noticeId: parseInt(id),
            userId: userId
          }
        },
        update: { viewedAt: new Date() },
        create: {
          noticeId: parseInt(id),
          userId: userId
        }
      });

      // Update total views count in notice
      const count = await prisma.noticeView.count({
        where: { noticeId: parseInt(id) }
      });

      await prisma.notice.update({
        where: { id: parseInt(id) },
        data: { viewsCount: count }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getViewers(req, res) {
    try {
      const { id } = req.params;
      
      const views = await prisma.noticeView.findMany({
        where: { noticeId: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              profileImg: true
            }
          }
        },
        orderBy: { viewedAt: 'desc' }
      });

      res.json(views.map(v => ({
        ...v.user,
        viewedAt: v.viewedAt
      })));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = NoticeController;
