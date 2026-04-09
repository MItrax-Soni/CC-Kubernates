async function requestJson(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options && options.headers ? options.headers : {}),
    },
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = typeof data === 'object' && data && data.error
      ? data.error
      : `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';

  let createdId = null;
  try {
    const beforeTasks = await requestJson(`${base}/tasks`);
    const before = Array.isArray(beforeTasks) ? beforeTasks.length : null;

    const created = await requestJson(`${base}/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        title: '__smoke_temp__',
        description: 'temporary task for API smoke test',
        priority: 'low',
        dueDate: null,
      }),
    });

    createdId = created && created.id;
    if (!createdId) throw new Error('Create did not return an id');

    const afterCreateTasks = await requestJson(`${base}/tasks`);
    const afterCreate = Array.isArray(afterCreateTasks) ? afterCreateTasks.length : null;

    const updated = await requestJson(`${base}/tasks/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'done' }),
    });

    await requestJson(`${base}/tasks/${createdId}`, { method: 'DELETE' });
    createdId = null;

    const afterDeleteTasks = await requestJson(`${base}/tasks`);
    const afterDelete = Array.isArray(afterDeleteTasks) ? afterDeleteTasks.length : null;

    const summary = {
      base,
      before,
      afterCreate,
      afterDelete,
      updatedStatus: updated && updated.status,
    };

    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } catch (err) {
    // Best-effort cleanup if create succeeded but later steps failed
    if (createdId) {
      try {
        await requestJson(`${base}/tasks/${createdId}`, { method: 'DELETE' });
      } catch {
        // ignore cleanup errors
      }
    }

    console.error('Smoke test failed:', err && err.message ? err.message : err);
    if (err && err.body) console.error('Response body:', JSON.stringify(err.body, null, 2));
    process.exitCode = 1;
  }
})();
