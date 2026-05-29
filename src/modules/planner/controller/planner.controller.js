const Planner = require('../model/planner.model');

const getPlanner = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let planner = await Planner.findOne({ user: userId }).populate('tasks.booking');

    if (!planner) {
      // Create a default planner for the user
      planner = await Planner.create({
        user: userId,
        totalBudget: 0,
        tasks: [
          { category: 'banquet', name: 'Book Banquet Hall', estimatedCost: 0, actualCost: 0, isCompleted: false },
          { category: 'catering', name: 'Book Catering Service', estimatedCost: 0, actualCost: 0, isCompleted: false },
          { category: 'photo', name: 'Book Photographer', estimatedCost: 0, actualCost: 0, isCompleted: false },
          { category: 'parlor', name: 'Book Bridal Parlor / Groom Salon', estimatedCost: 0, actualCost: 0, isCompleted: false }
        ]
      });
    }

    res.status(200).json({
      success: true,
      planner,
    });
  } catch (error) {
    next(error);
  }
};

const updatePlanner = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { totalBudget, eventDate, eventType } = req.body;

    let planner = await Planner.findOne({ user: userId });

    if (!planner) {
      planner = new Planner({ user: userId });
    }

    if (totalBudget !== undefined) planner.totalBudget = totalBudget;
    if (eventDate !== undefined) planner.eventDate = eventDate;
    if (eventType !== undefined) planner.eventType = eventType;

    await planner.save();
    await planner.populate('tasks.booking');

    res.status(200).json({
      success: true,
      planner,
    });
  } catch (error) {
    next(error);
  }
};

const addTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category, name, estimatedCost, actualCost } = req.body;

    if (!name) {
      const error = new Error('Task name is required');
      error.statusCode = 422;
      throw error;
    }

    let planner = await Planner.findOne({ user: userId });

    if (!planner) {
      planner = await Planner.create({ user: userId });
    }

    planner.tasks.push({
      category: category || 'other',
      name,
      estimatedCost: estimatedCost || 0,
      actualCost: actualCost || 0,
      isCompleted: false,
    });

    await planner.save();
    await planner.populate('tasks.booking');

    res.status(201).json({
      success: true,
      planner,
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const { name, estimatedCost, actualCost, isCompleted, booking } = req.body;

    const planner = await Planner.findOne({ user: userId });
    if (!planner) {
      const error = new Error('Planner not found');
      error.statusCode = 404;
      throw error;
    }

    const task = planner.tasks.id(taskId);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (name !== undefined) task.name = name;
    if (estimatedCost !== undefined) task.estimatedCost = estimatedCost;
    if (actualCost !== undefined) task.actualCost = actualCost;
    if (isCompleted !== undefined) task.isCompleted = isCompleted;
    if (booking !== undefined) task.booking = booking;

    await planner.save();
    await planner.populate('tasks.booking');

    res.status(200).json({
      success: true,
      planner,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    const planner = await Planner.findOne({ user: userId });
    if (!planner) {
      const error = new Error('Planner not found');
      error.statusCode = 404;
      throw error;
    }

    const task = planner.tasks.id(taskId);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    task.deleteOne();
    await planner.save();
    await planner.populate('tasks.booking');

    res.status(200).json({
      success: true,
      planner,
    });
  } catch (error) {
    next(error);
  }
};

const linkBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const { bookingId } = req.body;

    const planner = await Planner.findOne({ user: userId });
    if (!planner) {
      const error = new Error('Planner not found');
      error.statusCode = 404;
      throw error;
    }

    const task = planner.tasks.id(taskId);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    task.booking = bookingId || null;
    await planner.save();
    await planner.populate('tasks.booking');

    res.status(200).json({
      success: true,
      planner,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlanner,
  updatePlanner,
  addTask,
  updateTask,
  deleteTask,
  linkBooking,
};
