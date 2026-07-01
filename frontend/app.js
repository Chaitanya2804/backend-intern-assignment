// Point this at your running backend. Change if your backend runs on a different port/host.
const API_BASE = "http://localhost:5001/api/v1";

let state = {
  accessToken: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  user: JSON.parse(localStorage.getItem("user") || "null"),
};

// ---------- DOM refs ----------
const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const userChip = document.getElementById("userChip");
const userLabel = document.getElementById("userLabel");
const authMessage = document.getElementById("authMessage");
const dashMessage = document.getElementById("dashMessage");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const adminPanel = document.getElementById("adminPanel");
const userList = document.getElementById("userList");
const taskListTitle = document.getElementById("taskListTitle");

document.getElementById("apiBaseLabel").textContent = API_BASE;
document.getElementById("swaggerLink").href = API_BASE.replace("/api/v1", "/api-docs");

// ---------- API helper ----------
async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.message || `Request failed (${res.status})`);
    err.details = json.details;
    err.status = res.status;
    throw err;
  }
  return json;
}

function showMessage(el, text, type = "success") {
  el.textContent = text;
  el.className = `message ${type}`;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}

function saveSession({ accessToken, refreshToken, user }) {
  state = { accessToken, refreshToken, user };
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  state = { accessToken: null, refreshToken: null, user: null };
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

// ---------- View switching ----------
function render() {
  if (state.accessToken && state.user) {
    authView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    userChip.classList.remove("hidden");
    userLabel.innerHTML = `${state.user.name} &middot; <code>${state.user.role}</code>`;
    taskListTitle.textContent = state.user.role === "admin" ? "All tasks (admin)" : "Your tasks";
    adminPanel.classList.toggle("hidden", state.user.role !== "admin");
    loadTasks();
    if (state.user.role === "admin") loadUsers();
  } else {
    authView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
    userChip.classList.add("hidden");
  }
}

// ---------- Auth tabs ----------
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
    document.getElementById("registerForm").classList.toggle("hidden", tab !== "register");
  });
});

// ---------- Auth forms ----------
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const res = await api("/auth/login", { method: "POST", body: { email, password }, auth: false });
    saveSession(res.data);
    render();
  } catch (err) {
    showMessage(authMessage, err.message, "error");
  }
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const res = await api("/auth/register", { method: "POST", body: { name, email, password }, auth: false });
    saveSession(res.data);
    render();
  } catch (err) {
    const detail = err.details ? err.details.map((d) => d.message).join(", ") : err.message;
    showMessage(authMessage, detail, "error");
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  render();
});

// ---------- Tasks ----------
async function loadTasks() {
  try {
    const res = await api("/tasks?limit=50");
    renderTasks(res.data.tasks);
  } catch (err) {
    showMessage(dashMessage, err.message, "error");
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = "";
  emptyState.classList.toggle("hidden", tasks.length > 0);

  tasks.forEach((task) => {
    const item = document.createElement("div");
    item.className = "task-item";
    const ownerLine =
      state.user.role === "admin" && task.User
        ? `<div class="task-owner">owner: ${task.User.name} (${task.User.email})</div>`
        : "";
    item.innerHTML = `
      <div class="task-main">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ""}
        ${ownerLine}
      </div>
      <div class="task-actions">
        <span class="status-pill ${task.status}">${task.status}</span>
        <button class="btn-ghost" data-action="cycle" data-id="${task.id}" data-status="${task.status}">↻</button>
        <button class="btn-danger" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    `;
    taskList.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const STATUS_CYCLE = { pending: "in_progress", in_progress: "completed", completed: "pending" };

taskList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;

  try {
    if (btn.dataset.action === "delete") {
      await api(`/tasks/${id}`, { method: "DELETE" });
      showMessage(dashMessage, "Task deleted", "success");
    } else if (btn.dataset.action === "cycle") {
      const next = STATUS_CYCLE[btn.dataset.status];
      await api(`/tasks/${id}`, { method: "PUT", body: { status: next } });
    }
    loadTasks();
  } catch (err) {
    showMessage(dashMessage, err.message, "error");
  }
});

document.getElementById("taskForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const title = document.getElementById("taskTitle").value;
    const description = document.getElementById("taskDescription").value;
    const status = document.getElementById("taskStatus").value;
    await api("/tasks", { method: "POST", body: { title, description, status } });
    document.getElementById("taskForm").reset();
    showMessage(dashMessage, "Task created", "success");
    loadTasks();
  } catch (err) {
    const detail = err.details ? err.details.map((d) => d.message).join(", ") : err.message;
    showMessage(dashMessage, detail, "error");
  }
});

document.getElementById("refreshBtn").addEventListener("click", loadTasks);

// ---------- Admin: list all users ----------
async function loadUsers() {
  try {
    const res = await api("/admin/users");
    userList.innerHTML = res.data.users
      .map(
        (u) => `
      <div class="task-item">
        <div class="task-main">
          <div class="task-title">${escapeHtml(u.name)}</div>
          <div class="task-desc">${escapeHtml(u.email)}</div>
        </div>
        <span class="status-pill ${u.role === "admin" ? "completed" : ""}">${u.role}</span>
      </div>`
      )
      .join("");
  } catch (err) {
    // Non-fatal: admin panel just stays empty if this fails
    console.error(err);
  }
}

render();
