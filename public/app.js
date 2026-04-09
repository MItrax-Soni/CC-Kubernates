/* ============================================================
   TASKFLOW — app.js
   All API calls use relative paths so the frontend works
   unchanged in local, Docker, and EKS environments.
   ============================================================ */

// ── State ────────────────────────────────────────────────────
let allTasks = [];   // canonical list from the server
let filterStatus = 'all';
let filterPriority = 'all';
let searchQuery = '';

// ── DOM refs ─────────────────────────────────────────────────
const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-desc');
const priorityInput = document.getElementById('task-priority');
const dueDateInput = document.getElementById('task-due');
const addBtn = document.getElementById('add-btn');
const formError = document.getElementById('form-error');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('filter-status');
const priorityFilter = document.getElementById('filter-priority');
const taskCountEl = document.getElementById('task-count');

// ── API helpers ───────────────────────────────────────────────

async function fetchTasks() {
  showLoading();
  try {
    const res = await fetch('/tasks');
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    allTasks = await res.json();
    renderTasks();
  } catch (err) {
    showError('Could not load tasks. Is the server running?');
    console.error(err);
  }
}

async function createTask(payload) {
  const res = await fetch('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create task');
  }
  return res.json();
}

async function updateTask(id, changes) {
  const res = await fetch(`/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

async function deleteTask(id) {
  const res = await fetch(`/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
}

// ── Event: Add Task ───────────────────────────────────────────

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideFormError();

  const title = titleInput.value.trim();
  if (!title) {
    showFormError('Task title is required.');
    titleInput.focus();
    return;
  }

  setLoading(addBtn, true);
  try {
    await createTask({
      title,
      description: descInput.value.trim(),
      priority: priorityInput.value,
      dueDate: dueDateInput.value || null,
    });
    taskForm.reset();
    await fetchTasks();
  } catch (err) {
    showFormError(err.message);
  } finally {
    setLoading(addBtn, false);
  }
});

// ── Event: Filters ────────────────────────────────────────────

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.toLowerCase().trim();
  renderTasks();
});

statusFilter.addEventListener('change', () => {
  filterStatus = statusFilter.value;
  renderTasks();
});

priorityFilter.addEventListener('change', () => {
  filterPriority = priorityFilter.value;
  renderTasks();
});

// ── Event Delegation: Done / Delete buttons ───────────────────

taskList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const { action, id } = btn.dataset;
  btn.disabled = true;

  try {
    if (action === 'done') {
      await updateTask(id, { status: 'done' });
    } else if (action === 'inprogress') {
      await updateTask(id, { status: 'in-progress' });
    } else if (action === 'delete') {
      if (!confirm('Delete this task?')) { btn.disabled = false; return; }
      await deleteTask(id);
    }
    await fetchTasks();
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
  }
});

// ── Rendering ─────────────────────────────────────────────────

function renderTasks() {
  const visible = allTasks.filter(applyFilters);
  updateTaskCount(visible.length, allTasks.length);

  if (visible.length === 0) {
    taskList.innerHTML = `
      <div class="state-msg">
        <span class="icon">🗂️</span>
        ${allTasks.length === 0 ? 'No tasks yet. Add your first task above!' : 'No tasks match your filters.'}
      </div>`;
    return;
  }

  taskList.innerHTML = visible.map(taskCardHTML).join('');
}

function applyFilters(task) {
  const matchStatus = filterStatus === 'all' || task.status === filterStatus;
  const matchPriority = filterPriority === 'all' || task.priority === filterPriority;
  const matchSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery);
  return matchStatus && matchPriority && matchSearch;
}

function taskCardHTML(task) {
  const priorityDot = { high: '🔴', medium: '🟠', low: '🟢' }[task.priority] || '';
  const statusLabel = task.status === 'in-progress' ? 'In Progress' : capitalize(task.status);
  const dueDateStr = formatDue(task.dueDate);
  const isOverdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();

  const doneBtn = task.status !== 'done'
    ? `<button class="btn btn--done" data-action="done" data-id="${task.id}">✔ Mark Done</button>`
    : '';
  const inProgBtn = task.status === 'pending'
    ? `<button class="btn btn--inprog" data-action="inprogress" data-id="${task.id}">▶ In Progress</button>`
    : '';

  return `
    <article class="task-card priority-${task.priority} status-${task.status}" aria-label="${escHtml(task.title)}">
      <div class="card-header">
        <h3 class="task-title">${escHtml(task.title)}</h3>
      </div>
      ${task.description ? `<p class="task-desc">${escHtml(task.description)}</p>` : ''}
      <div class="card-meta">
        <span class="badge badge-priority ${task.priority}">${priorityDot} ${capitalize(task.priority)}</span>
        <span class="badge badge-status ${task.status}">${statusLabel}</span>
        ${dueDateStr ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">📅 ${dueDateStr}${isOverdue ? ' (overdue)' : ''}</span>` : ''}
      </div>
      <div class="card-actions">
        ${inProgBtn}
        ${doneBtn}
        <button class="btn btn--delete" data-action="delete" data-id="${task.id}">✕ Delete</button>
      </div>
    </article>`;
}

// ── UI Helpers ────────────────────────────────────────────────

function showLoading() {
  taskList.innerHTML = `
    <div class="state-msg">
      <span class="loading-spinner"></span>
      Loading tasks...
    </div>`;
}

function showError(msg) {
  taskList.innerHTML = `
    <div class="state-msg">
      <span class="icon">⚠️</span>
      ${escHtml(msg)}
    </div>`;
}

function showFormError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
}

function hideFormError() {
  formError.textContent = '';
  formError.hidden = true;
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('span').textContent = loading ? 'Adding...' : '+ Add Task';
}

function updateTaskCount(visible, total) {
  taskCountEl.textContent = visible === total
    ? `${total} task${total !== 1 ? 's' : ''}`
    : `${visible} of ${total} tasks`;
}

// ── Utility ───────────────────────────────────────────────────

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDue(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ── Boot ──────────────────────────────────────────────────────
// app.js is loaded at the bottom of <body>, so the DOM is
// already ready — call fetchTasks() directly, no window.onload needed.
fetchTasks();