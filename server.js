const express = require('express');
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.use(protect);

router.get('/', catchAsync(async (req, res) => {
  const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks,
    },
  });
}));

router.post('/', catchAsync(async (req, res, next) => {
  const { title, description, completed } = req.body;

  if (!title || !title.trim()) {
    return next(new AppError('Task title is required.', 400));
  }

  const task = await Task.create({
    title,
    description: description || '',
    completed: Boolean(completed),
    user: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: {
      task,
    },
  });
}));

router.delete('/:id', catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new AppError('Task not found.', 404));
  }

  if (task.user.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not allowed to delete this task.', 403));
  }

  await task.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null,
  });
}));

module.exports = router;
