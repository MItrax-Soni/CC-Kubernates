const { readTasks, writeTasks } = require('../utils/fileHelper');
const { v4: uuidv4 }            = require('uuid');

// GET /tasks
exports.getAllTasks = (req, res) => {
  try {
    const tasks = readTasks();
    res.json(tasks);
  } catch (err) {
    console.error('getAllTasks error:', err);
    res.status(500).json({ error: 'Failed to read tasks' });
  }
};

// POST /tasks
exports.createTask = (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const newTask = {
      id:          uuidv4(),
      title:       title.trim(),
      description: (description || '').trim(),
      priority:    priority || 'medium',
      status:      'pending',
      dueDate:     dueDate || null,
      createdAt:   new Date().toISOString(),
    };

    const tasks = readTasks();
    tasks.push(newTask);
    writeTasks(tasks);

    res.status(201).json(newTask);
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// PUT /tasks/:id
exports.updateTask = (req, res) => {
  try {
    const tasks = readTasks();
    const index = tasks.findIndex(t => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Merge changes; protect id and createdAt from being overwritten
    const { id, createdAt, ...changes } = req.body;
    tasks[index] = { ...tasks[index], ...changes };
    writeTasks(tasks);

    res.json(tasks[index]);
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// DELETE /tasks/:id
exports.deleteTask = (req, res) => {
  try {
    let tasks      = readTasks();
    const before   = tasks.length;
    tasks          = tasks.filter(t => t.id !== req.params.id);

    if (tasks.length === before) {
      return res.status(404).json({ error: 'Task not found' });
    }

    writeTasks(tasks);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
