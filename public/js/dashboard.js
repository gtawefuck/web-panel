// ── State ──────────────────────────────────────────────────────────────────────
let currentUser = null;
let shopProducts = [];
let shopUrl = '';

// ── Init ───────────────────────────────────────────────────────────────────────
async function init() {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { location.href = '/login.html'; return; }
        const data = await res.json();
        currentUser = data.user;
        setupUI();
    } catch { location.href = '/login.html'; }
}

function setupUI() {
    const { tgId, role } = currentUser;
    document.getElementById('userTgId').textContent = tgId;
    document.getElementById('userAvatar').textContent = String(tgId).charAt(0);
    const roleLabels = { superAdmin: '⭐ Super Admin', admin: '🛡️ Admin', user: '👤 User' };
    document.getElementById('userRoleLabel').textContent = roleLabels[role] || role;

    // Show nav sections based on role
    if (role === 'admin' || role === 'superAdmin') {
        document.getElementById('navAdmin').style.display = '';
        document.getElementById('adminStats').style.display = '';
        document.getElementById('recentLogsCard').style.display = '';
        document.getElementById('dashTitle').textContent = 'Admin Dashboard';
        document.getElementById('dashSub').textContent = 'Manage users, view logs, and monitor activity.';
        loadUsers(); loadLogs();
        if (role === 'superAdmin') {
            document.getElementById('navSuperAdmin').style.display = '';
            document.getElementById('statAdminCard').style.display = '';
            loadAdmins();
        }
    } else {
        document.getElementById('userAccessCard').style.display = '';
        document.getElementById('dashTitle').textContent = 'Welcome';
        document.getElementById('dashSub').textContent = 'Your access status and shop.';
        loadUserAccess();
    }

    // Show My Shop for ALL roles
    document.getElementById('navMyShop').style.display = '';
    loadMyShop();
}

// ── Page Navigation ────────────────────────────────────────────────────────────
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const page = document.getElementById('page-' + name);
    if (page) page.classList.add('active');
    // highlight nav
    const btns = document.querySelectorAll('.nav-item');
    btns.forEach(b => { if (b.textContent.trim().toLowerCase().includes(name === 'myshop' ? 'my shop' : name)) b.classList.add('active'); });
    // load data
    if (name === 'users') loadUsers();
    if (name === 'logs') loadLogs();
    if (name === 'admins') loadAdmins();
    if (name === 'myshop') loadMyShop();
}

// ── Modals ─────────────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ── Users ──────────────────────────────────────────────────────────────────────
async function loadUsers() {
    try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) return;
        const { users } = await res.json();
        const tbody = document.getElementById('usersTableBody');
        if (!users.length) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon">👥</div>No users yet. Add one!</div></td></tr>';
            updateStats(0, 0, 0);
            return;
        }
        const active = users.filter(u => u.status === 'active').length;
        const expired = users.filter(u => u.status === 'expired').length;
        updateStats(users.length, active, expired);

        tbody.innerHTML = users.map(u => `<tr>
      <td><strong>${u.tg_id}</strong></td>
      <td>${u.username || '—'}</td>
      <td>${u.added_by}</td>
      <td>${fmtDate(u.activated_at)}</td>
      <td>${fmtDate(u.expires_at)}</td>
      <td><span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}">${u.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-xs" onclick="openExtend(${u.id},'${u.tg_id}')">⏳ Extend</button>
        <button class="btn btn-danger btn-xs" onclick="removeUser(${u.id})">🗑️</button>
      </td>
    </tr>`).join('');
    } catch { }
}

function updateStats(total, active, expired) {
    document.getElementById('statTotalUsers').textContent = total;
    document.getElementById('statActiveUsers').textContent = active;
    document.getElementById('statExpiredUsers').textContent = expired;
}

async function addUser() {
    const tgId = document.getElementById('newUserTgId').value.trim();
    const username = document.getElementById('newUserName').value.trim();
    const days = document.getElementById('newUserDays').value;
    const alert = document.getElementById('addUserAlert');
    if (!tgId || !days) { showAlert(alert, 'Fill in Telegram ID and days.', 'error'); return; }
    try {
        const res = await fetch('/api/admin/users', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tgId, username, days: parseInt(days) })
        });
        const data = await res.json();
        if (!res.ok) { showAlert(alert, data.error, 'error'); return; }
        showAlert(alert, data.message + (data.shopSlug ? ` | Shop: /shop/${data.shopSlug}` : ''), 'success');
        loadUsers();
        document.getElementById('newUserTgId').value = '';
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserDays').value = '';
    } catch (e) { showAlert(alert, 'Network error.', 'error'); }
}

let extendUserId = null;
function openExtend(id, tgId) {
    extendUserId = id;
    document.getElementById('extendUserInfo').textContent = `Extending access for user ${tgId}`;
    openModal('extendUserModal');
}

async function extendUser() {
    const days = document.getElementById('extendDays').value;
    const alert = document.getElementById('extendAlert');
    if (!days) { showAlert(alert, 'Enter number of days.', 'error'); return; }
    try {
        const res = await fetch(`/api/admin/users/${extendUserId}/extend`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days: parseInt(days) })
        });
        const data = await res.json();
        if (!res.ok) { showAlert(alert, data.error, 'error'); return; }
        showAlert(alert, `Access extended! New expiry: ${fmtDate(data.newExpiresAt)}`, 'success');
        loadUsers();
    } catch (e) { showAlert(alert, 'Network error.', 'error'); }
}

async function removeUser(id) {
    if (!confirm('Remove this user?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    loadUsers();
}

// ── Admins ─────────────────────────────────────────────────────────────────────
async function loadAdmins() {
    try {
        const res = await fetch('/api/admin/admins');
        if (!res.ok) return;
        const { admins } = await res.json();
        document.getElementById('statAdmins').textContent = admins.length;
        const tbody = document.getElementById('adminsTableBody');
        if (!admins.length) {
            tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="icon">🛡️</div>No admins yet</div></td></tr>';
            return;
        }
        tbody.innerHTML = admins.map(a => `<tr>
      <td><strong>${a.tg_id}</strong></td>
      <td>${a.added_by}</td>
      <td>${fmtDate(a.added_at)}</td>
      <td><button class="btn btn-danger btn-xs" onclick="removeAdmin(${a.id})">🗑️</button></td>
    </tr>`).join('');
    } catch { }
}

async function addAdmin() {
    const tgId = document.getElementById('newAdminTgId').value.trim();
    const alert = document.getElementById('addAdminAlert');
    if (!tgId) { showAlert(alert, 'Enter Telegram ID.', 'error'); return; }
    try {
        const res = await fetch('/api/admin/admins', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tgId })
        });
        const data = await res.json();
        if (!res.ok) { showAlert(alert, data.error, 'error'); return; }
        showAlert(alert, data.message, 'success');
        loadAdmins();
        document.getElementById('newAdminTgId').value = '';
    } catch (e) { showAlert(alert, 'Network error.', 'error'); }
}

async function removeAdmin(id) {
    if (!confirm('Remove this admin?')) return;
    await fetch(`/api/admin/admins/${id}`, { method: 'DELETE' });
    loadAdmins();
}

// ── Logs ───────────────────────────────────────────────────────────────────────
async function loadLogs() {
    try {
        const res = await fetch('/api/admin/logs');
        if (!res.ok) return;
        const { logs } = await res.json();
        const logsBody = document.getElementById('logsTableBody');
        const recentBody = document.getElementById('recentLogsBody');
        if (!logs.length) {
            logsBody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">📋</div>No logs yet</div></td></tr>';
            if (recentBody) recentBody.innerHTML = '<tr><td colspan="4">No recent activity</td></tr>';
            return;
        }
        const renderRow = (l, cols) => `<tr>
      <td>${l.tg_id}</td><td>${l.action}</td><td>${l.role || '—'}</td>
      ${cols === 5 ? `<td>${l.details || '—'}</td>` : ''}
      <td>${fmtDate(l.timestamp)}</td>
    </tr>`;
        logsBody.innerHTML = logs.map(l => renderRow(l, 5)).join('');
        if (recentBody) recentBody.innerHTML = logs.slice(0, 5).map(l => renderRow(l, 4)).join('');
    } catch { }
}

// ── User Access ────────────────────────────────────────────────────────────────
async function loadUserAccess() {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const { user } = await res.json();
        if (user.expiresAt) {
            const exp = new Date(user.expiresAt);
            const days = Math.max(0, Math.ceil((exp - new Date()) / 86400000));
            document.getElementById('expiryBadge').textContent = `📅 Expires: ${fmtDate(user.expiresAt)} (${days} day${days !== 1 ? 's' : ''} left)`;
        }
    } catch { }
}

// ── MY SHOP ────────────────────────────────────────────────────────────────────
async function loadMyShop() {
    try {
        const res = await fetch('/api/shop/my');
        if (res.status === 404) {
            document.getElementById('productEditGrid').innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">No shop assigned yet. Contact admin.</div>';
            return;
        }
        if (!res.ok) return;
        const data = await res.json();
        shopProducts = data.products;
        shopUrl = data.shopUrl;

        // Update URL banner
        document.getElementById('shopLiveUrl').textContent = shopUrl;

        // Update shop settings inputs
        document.getElementById('shopNameInput').value = data.shop.shop_name || '';
        document.getElementById('bannerTextInput').value = data.shop.banner_text || '';

        // Render product grid
        renderProductGrid();
    } catch { }
}

function renderProductGrid() {
    const grid = document.getElementById('productEditGrid');
    if (!shopProducts.length) {
        grid.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">No products.</div>';
        return;
    }
    grid.innerHTML = shopProducts.map(p => `
    <div class="pe-card">
      <div class="pe-img-wrap">
        <img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'"/>
        <button class="pe-edit-btn" onclick="openEditDrawer(${p.id})">✏️ Edit</button>
      </div>
      <div class="pe-body">
        <div class="pe-name">${p.name}</div>
        <div class="pe-cat">${p.category} · ⭐ ${parseFloat(p.rating).toFixed(1)}</div>
        <div class="pe-price">₹${parseInt(p.price).toLocaleString('en-IN')} <span class="pe-disc">${p.discount}% off</span></div>
      </div>
    </div>
  `).join('');
}

// ── Shop Settings ──────────────────────────────────────────────────────────────
async function saveShopSettings() {
    const shop_name = document.getElementById('shopNameInput').value.trim();
    const banner_text = document.getElementById('bannerTextInput').value.trim();
    if (!shop_name && !banner_text) return;
    try {
        await fetch('/api/shop/settings', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shop_name, banner_text })
        });
        alert('✅ Shop settings saved!');
    } catch { alert('❌ Failed to save.'); }
}

function copyShopLink() {
    navigator.clipboard.writeText(shopUrl).catch(() => { });
    alert('✅ Shop URL copied!');
}

function openShopInTab() {
    if (shopUrl) window.open(shopUrl, '_blank');
}

// ── Edit Product Drawer ────────────────────────────────────────────────────────
function openEditDrawer(id) {
    const p = shopProducts.find(x => x.id === id);
    if (!p) return;
    document.getElementById('edProductId').value = id;
    document.getElementById('edImgPreview').src = p.image_url;
    document.getElementById('edImageUrl').value = p.image_url;
    document.getElementById('edName').value = p.name;
    document.getElementById('edDesc').value = p.description;
    document.getElementById('edPrice').value = p.price;
    document.getElementById('edOrigPrice').value = p.original_price;
    document.getElementById('edRating').value = p.rating;
    document.getElementById('edMsg').className = 'ed-msg';
    document.getElementById('edImageFile').value = '';
    renderStars(p.rating);
    document.getElementById('editDrawer').classList.add('open');
}

function closeEditDrawer() {
    document.getElementById('editDrawer').classList.remove('open');
}

function renderStars(rating) {
    const container = document.getElementById('edStars');
    const val = parseFloat(rating);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= Math.round(val);
        html += `<span class="rating-star" onclick="setRating(${i})" style="cursor:pointer">${filled ? '⭐' : '☆'}</span>`;
    }
    html += `<span style="font-size:14px;color:var(--text-muted);margin-left:4px" id="ratingVal">${val.toFixed(1)}</span>`;
    container.innerHTML = html;
}

function setRating(val) {
    document.getElementById('edRating').value = val;
    renderStars(val);
}

// ── Image Upload ───────────────────────────────────────────────────────────────
async function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => { document.getElementById('edImgPreview').src = ev.target.result; };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch('/api/shop/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('edImageUrl').value = data.url;
            document.getElementById('edImgPreview').src = data.url;
        } else {
            alert('❌ Upload failed: ' + (data.error || 'Unknown error'));
        }
    } catch { alert('❌ Upload failed.'); }
}

// ── Save Product Edit ──────────────────────────────────────────────────────────
async function saveProductEdit() {
    const id = document.getElementById('edProductId').value;
    const msg = document.getElementById('edMsg');
    const payload = {
        name: document.getElementById('edName').value,
        image_url: document.getElementById('edImageUrl').value,
        description: document.getElementById('edDesc').value,
        price: document.getElementById('edPrice').value,
        original_price: document.getElementById('edOrigPrice').value,
        discount: Math.max(0, Math.round((1 - parseInt(document.getElementById('edPrice').value) / parseInt(document.getElementById('edOrigPrice').value)) * 100)),
        rating: document.getElementById('edRating').value,
    };

    try {
        const res = await fetch(`/api/shop/products/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) { msg.textContent = '❌ ' + data.error; msg.className = 'ed-msg err'; return; }

        // Update local
        const idx = shopProducts.findIndex(x => x.id === parseInt(id));
        if (idx !== -1) shopProducts[idx] = { ...shopProducts[idx], ...data.product };
        renderProductGrid();

        msg.textContent = '✅ Product updated!';
        msg.className = 'ed-msg ok';
        setTimeout(() => closeEditDrawer(), 1000);
    } catch (e) {
        msg.textContent = '❌ Network error.';
        msg.className = 'ed-msg err';
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
        dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function showAlert(el, msg, type) {
    el.textContent = msg;
    el.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    location.href = '/login.html';
}

// Close edit drawer on overlay click
document.getElementById('editDrawer').addEventListener('click', function (e) {
    if (e.target === this) closeEditDrawer();
});

init();
