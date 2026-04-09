const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../data/tasks.json');

// Safety: ensure data directory and tasks.json always exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, '[]', 'utf-8');
}

function readTasks() {
  const raw = fs.readFileSync(FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeTasks(tasks) {
  fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

module.exports = { readTasks, writeTasks };
