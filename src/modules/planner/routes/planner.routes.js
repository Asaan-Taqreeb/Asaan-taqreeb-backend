const express = require('express');
const { protect } = require('../../../shared/middleware/auth.middleware');
const plannerController = require('../controller/planner.controller');

const router = express.Router();

// All planner routes require authentication
router.use(protect);

router.get('/', plannerController.getPlanner);
router.put('/', plannerController.updatePlanner);
router.post('/tasks', plannerController.addTask);
router.put('/tasks/:taskId', plannerController.updateTask);
router.delete('/tasks/:taskId', plannerController.deleteTask);
router.post('/tasks/:taskId/link-booking', plannerController.linkBooking);

module.exports = router;
