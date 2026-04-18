const express = require('express');
const router = express.Router();
const NoticeController = require('../controllers/Notice.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// List all notices
router.get('/', NoticeController.list);

// Create notice (Admin only)
router.post('/', authorize(['ADMIN', 'SUPER_ADMIN']), NoticeController.create);

// Update notice
router.patch('/:id', authorize(['ADMIN', 'SUPER_ADMIN']), NoticeController.update);

// Delete notice
router.delete('/:id', authorize(['ADMIN', 'SUPER_ADMIN']), NoticeController.delete);

// View tracking
router.post('/:id/view', NoticeController.trackView);

// Get viewer list (Admin only)
router.get('/:id/viewers', authorize(['ADMIN', 'SUPER_ADMIN']), NoticeController.getViewers);

module.exports = router;

