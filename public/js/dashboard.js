// ─── Dashboard JS ──────────────────────────────────────────────────────────────
let currentUser = null;
let selectedUserId = null;

// ─── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { window.location.href = '/login.html'; return; }
        const data = await res.json();
        currentUser = data.user;
        initUI();
    } catch {
        window.location.href = '/login.html';
    }
});

function initUI() {
    const { tgId, role } = currentUser;

    // Set user info in sidebar
    document.getElementById('userTgId').textContent = tgId;
    document.getElementById('userRoleLabel').textContent =
        role === 'superAdmin' ? '⭐ Super Admin' : role === 'admin' ? '🛡️ Admin' : '👤 User';
    document.getElementById('userAvatar').textContent = tgId[0];

    // Show relevant nav sections
    if (role === 'admin' || role === 'superAdmin') {
        document.getElementById('navAdmin').style.display = '';
        document.getElementById('adminStats').style.display = '';
        document.getElementById('recentLogsCard').style.display = '';
        loadAdminDashboard();
    } else {
        document.getElementById('userAccessCard').style.display = '';
        loadUserDashboard();
    }

    if (role === 'superAdmin') {
        document.getElementById('navSuperAdmin').style.display = '';
        document.getElementById('statAdminCard').style.display = '';
    }

    // Update title
    const titles = { superAdmin: '⭐ Super Admin Dashboard', admin: '🛡️ Admin Dashboard', user: '👋 Welcome' };
    document.getElementById('dashTitle').textContent = titles[role] || 'Dashboard';
    document.getElementById('dashSub').textContent =
        role === 'user'
            ? 'Your access is active and verified.'
            : 'Here\'s a summary of your panel.';
}

// ─── Page navigation ─────────────────────────────────────────────────────────
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const loaders = { users: loadUsers, admins: loadAdmins, logs: loadLogs };
    if (loaders[name]) loaders[name]();

    // Highlight nav
    const navMap = { dashboard: 0, users: 1, logs: 2, admins: 0 };
    const items = document.querySelectorAll('.nav-item');
    // Simple approach: match by text
    items.forEach(btn => {
        const txt = btn.textContent.toLowerCase();
        if (name === 'dashboard' && txt.includes('dashboard')) btn.classList.add('active');
        if (name === 'users' && txt.includes('users')) btn.classList.add('active');
        if (name === 'logs' && txt.includes('logs')) btn.classList.add('active');
        if (name === 'admins' && txt.includes('admins')) btn.classList.add('active');
    });
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function openModal(id) {
    document.getElementById(id).classList.add('open');
    // Clear alerts
    const alertEl = document.querySelector('#' + id + ' .alert');
    if (alertEl) { alertEl.className = 'alert'; alertEl.textContent = ''; }
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}
// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal(overlay.id);
    });
});

function setModalAlert(id, msg, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = `alert alert-${type} show`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function daysLeft(expiresAt) {
    const diff = new Date(expiresAt) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
}

async function apiFetch(url, opts = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...opts
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ─── User Dashboard ───────────────────────────────────────────────────────────
async function loadUserDashboard() {
    try {
        const me = await apiFetch('/api/auth/me');
        const badgeEl = document.getElementById('expiryBadge');
        if (me.user) {
            // The expiry is in the session — for users we show a generic message
            badgeEl.textContent = '✅ Access is Active';
        }
    } catch {
        document.getElementById('expiryBadge').textContent = '✅ Access is Active';
    }
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
async function loadAdminDashboard() {
    try {
        const data = await apiFetch('/api/admin/users');
        const users = data.users || [];
        const active = users.filter(u => u.status === 'active').length;
        const expired = users.filter(u => u.status === 'expired').length;
        document.getElementById('statTotalUsers').textContent = users.length;
        document.getElementById('statActiveUsers').textContent = active;
        document.getElementById('statExpiredUsers').textContent = expired;
    } catch { /* ignore */ }

    if (currentUser.role === 'superAdmin') {
        try {
            const data = await apiFetch('/api/admin/admins');
            document.getElementById('statAdmins').textContent = (data.admins || []).length;
        } catch { /* ignore */ }
    }

    loadRecentLogs();
}

// ─── Users ─────────────────────────────────────────────────────────────────────
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><span class="spinner"></span></div></td></tr>`;
    try {
        const { users } = await apiFetch('/api/admin/users');
        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">👥</div>No users yet. Add one!</div></td></tr>`;
            return;
        }
        tbody.innerHTML = users.map(u => `
      <tr>
        <td><code>${u.tg_id}</code></td>
        <td>${u.username || '<span class="text-muted">—</span>'}</td>
        <td><code>${u.added_by}</code></td>
        <td>${fmtDate(u.activated_at)}</td>
        <td>${fmtDate(u.expires_at)}</td>
        <td><span class="badge badge-${u.status}">${u.status}</span></td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-success btn-sm" onclick="openExtend(${u.id},'${u.tg_id}','${u.expires_at}')">Extend</button>
            <button class="btn btn-danger btn-sm" onclick="removeUser(${u.id},'${u.tg_id}')">Remove</button>
          </div>
        </td>
      </tr>
    `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="color:var(--danger)">${e.message}</div></td></tr>`;
    }
}

async function addUser() {
    const tgId = document.getElementById('newUserTgId').value.trim();
    const username = document.getElementById('newUserName').value.trim();
    const days = parseInt(document.getElementById('newUserDays').value);

    if (!tgId || !/^\d+$/.test(tgId)) return setModalAlert('addUserAlert', 'Enter a valid Telegram User ID.');
    if (!days || days < 1) return setModalAlert('addUserAlert', 'Enter valid number of days (≥ 1).');

    try {
        const data = await apiFetch('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ tgId, username, days })
        });
        setModalAlert('addUserAlert', data.message, 'success');
        // Reset form
        document.getElementById('newUserTgId').value = '';
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserDays').value = '';
        setTimeout(() => { closeModal('addUserModal'); loadUsers(); loadAdminDashboard(); }, 1200);
    } catch (e) {
        setModalAlert('addUserAlert', e.message);
    }
}

function openExtend(id, tgId, expiresAt) {
    selectedUserId = id;
    document.getElementById('extendUserInfo').textContent =
        `User: ${tgId} · Current expiry: ${fmtDate(expiresAt)}`;
    document.getElementById('extendDays').value = '';
    openModal('extendUserModal');
}

async function extendUser() {
    const days = parseInt(document.getElementById('extendDays').value);
    if (!days || days < 1) return setModalAlert('extendAlert', 'Enter valid days.');
    try {
        const data = await apiFetch(`/api/admin/users/${selectedUserId}/extend`, {
            method: 'PATCH',
            body: JSON.stringify({ days })
        });
        setModalAlert('extendAlert', `Access extended! New expiry: ${fmtDate(data.newExpiresAt)}`, 'success');
        setTimeout(() => { closeModal('extendUserModal'); loadUsers(); }, 1200);
    } catch (e) {
        setModalAlert('extendAlert', e.message);
    }
}

async function removeUser(id, tgId) {
    if (!confirm(`Remove user ${tgId}? They will lose access immediately.`)) return;
    try {
        await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        loadUsers();
        loadAdminDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ─── Admins ────────────────────────────────────────────────────────────────────
async function loadAdmins() {
    const tbody = document.getElementById('adminsTableBody');
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><span class="spinner"></span></div></td></tr>`;
    try {
        const { admins } = await apiFetch('/api/admin/admins');
        if (!admins.length) {
            tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="icon">🛡️</div>No admins yet.</div></td></tr>`;
            return;
        }
        tbody.innerHTML = admins.map(a => `
      <tr>
        <td><code>${a.tg_id}</code></td>
        <td><code>${a.added_by}</code></td>
        <td>${fmtDate(a.added_at)}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="removeAdmin(${a.id},'${a.tg_id}')">Remove</button>
        </td>
      </tr>
    `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state" style="color:var(--danger)">${e.message}</div></td></tr>`;
    }
}

async function addAdmin() {
    const tgId = document.getElementById('newAdminTgId').value.trim();
    if (!tgId || !/^\d+$/.test(tgId)) return setModalAlert('addAdminAlert', 'Enter a valid Telegram User ID.');
    try {
        const data = await apiFetch('/api/admin/admins', {
            method: 'POST',
            body: JSON.stringify({ tgId })
        });
        setModalAlert('addAdminAlert', data.message, 'success');
        document.getElementById('newAdminTgId').value = '';
        setTimeout(() => { closeModal('addAdminModal'); loadAdmins(); loadAdminDashboard(); }, 1200);
    } catch (e) {
        setModalAlert('addAdminAlert', e.message);
    }
}

async function removeAdmin(id, tgId) {
    if (!confirm(`Remove admin ${tgId}?`)) return;
    try {
        await apiFetch(`/api/admin/admins/${id}`, { method: 'DELETE' });
        loadAdmins();
        loadAdminDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ─── Logs ──────────────────────────────────────────────────────────────────────
async function loadRecentLogs() {
    const tbody = document.getElementById('recentLogsBody');
    if (!tbody) return;
    try {
        const { logs } = await apiFetch('/api/admin/logs?limit=5');
        tbody.innerHTML = (logs || []).map(l => `
      <tr>
        <td><code>${l.tg_id}</code></td>
        <td>${l.action}</td>
        <td>${l.role || '—'}</td>
        <td>${fmtDate(l.timestamp)}</td>
      </tr>
    `).join('') || `<tr><td colspan="4"><div class="empty-state">No logs yet</div></td></tr>`;
    } catch { /* ignore */ }
}

async function loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><span class="spinner"></span></div></td></tr>`;
    try {
        const { logs } = await apiFetch('/api/admin/logs');
        if (!logs.length) {
            tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="icon">📋</div>No logs yet.</div></td></tr>`;
            return;
        }
        tbody.innerHTML = logs.map(l => `
      <tr>
        <td><code>${l.tg_id}</code></td>
        <td>${l.action}</td>
        <td>${l.role || '—'}</td>
        <td class="text-muted">${l.details || '—'}</td>
        <td>${fmtDate(l.timestamp)}</td>
      </tr>
    `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="color:var(--danger)">${e.message}</div></td></tr>`;
    }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
        window.location.href = '/login.html';
    }
}
