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

    // Show My Shop + Payment Logs + Import for ALL roles
    document.getElementById('navMyShop').style.display = '';
    document.getElementById('navPayLogs').style.display = '';
    document.getElementById('navImport').style.display = '';
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
    // Dismiss sidebar on mobile after clicking
    document.getElementById('sidebar').classList.remove('show');
    // load data
    if (name === 'users') loadUsers();
    if (name === 'logs') loadLogs();
    if (name === 'admins') loadAdmins();
    if (name === 'myshop') loadMyShop();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
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
        } else {
            document.getElementById('expiryBadge').textContent = '📅 Unlimited Access';
        }
    } catch { }
}

// ── MY SHOP ────────────────────────────────────────────────────────────────────
async function loadMyShop() {
    try {
        const res = await fetch('/api/shop/my');
        if (res.status === 404) {
            document.getElementById('shopLiveUrl').textContent = 'No shop assigned yet. Contact admin.';
            document.getElementById('productEditGrid').innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">No shop assigned yet. Contact admin.</div>';
            return;
        }
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            document.getElementById('shopLiveUrl').textContent = errData.error || 'Failed to load shop.';
            return;
        }
        const data = await res.json();
        shopProducts = data.products;

        // Build URL from browser origin (always correct in Codespaces/proxied envs)
        const slug = data.shop.slug;
        shopUrl = `${window.location.origin}/shop/${slug}`;

        document.getElementById('shopLiveUrl').textContent = shopUrl;
        document.getElementById('shopNameInput').value = data.shop.shop_name || '';
        document.getElementById('bannerTextInput').value = data.shop.banner_text || '';

        // Populate payment fields if elements exist
        const upiEl = document.getElementById('shopUpiId');
        const qrPrev = document.getElementById('qrPreview');
        const qrNo = document.getElementById('qrNoImg');
        if (upiEl) upiEl.value = data.shop.upi_id || '';
        const mnEl = document.getElementById('shopMerchantName');
        if (mnEl) mnEl.value = data.shop.merchant_name || '';
        if (qrPrev && data.shop.payment_qr) {
            qrPrev.src = data.shop.payment_qr;
            qrPrev.style.display = 'block';
            if (qrNo) qrNo.style.display = 'none';
        }

        renderProductGrid();
    } catch (e) {
        console.error('loadMyShop error:', e);
        document.getElementById('shopLiveUrl').textContent = 'Error loading shop. Check console.';
    }
}

function renderProductGrid() {
    const grid = document.getElementById('productEditGrid');
    const countLabel = document.getElementById('productCountLabel');
    if (countLabel) countLabel.textContent = `📦 Products (${shopProducts.length} items) — Hover to Edit`;
    if (!shopProducts.length) {
        grid.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">No products. Click "+ Add Product" to start!</div>';
        return;
    }
    grid.innerHTML = shopProducts.map(p => {
        const disc = p.original_price > 0 ? Math.max(0, Math.round((1 - parseInt(p.price) / parseInt(p.original_price)) * 100)) : (p.discount || 0);
        return `
    <div class="pe-card">
      <div class="pe-img-wrap">
        <img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 200 200\\'><rect width=\\'200\\' height=\\'200\\' fill=\\'%23f5f5f5\\'/><g fill=\\'%23cfd8dc\\'><rect x=\\'50\\' y=\\'60\\' width=\\'100\\' height=\\'80\\' rx=\\'6\\'/><circle cx=\\'80\\' cy=\\'92\\' r=\\'8\\'/><path d=\\'M70 130 l20 -20 l16 12 l24 -28 l30 36 z\\'/></g></svg>')"/>
        <button class="pe-edit-btn" onclick="openEditDrawer(${p.id})">✏️ Edit</button>
      </div>
      <div class="pe-body">
        <div class="pe-name">${p.name}</div>
        <div class="pe-cat">${p.category} · ⭐ ${parseFloat(p.rating).toFixed(1)}</div>
        <div class="pe-price">₹${parseInt(p.price).toLocaleString('en-IN')} ${disc > 0 ? `<span class="pe-orig">₹${parseInt(p.original_price).toLocaleString('en-IN')}</span> <span class="pe-disc">${disc}% off</span>` : ''}</div>
      </div>
    </div>`;
    }).join('');
}

// ── Payment Settings ─────────────────────────────────────────────────────────
async function savePaymentSettings() {
    const upi_id = document.getElementById('shopUpiId').value.trim();
    const merchant_name = document.getElementById('shopMerchantName')?.value.trim() || '';
    const payment_qr = document.getElementById('qrPreview').src.includes('/uploads/') ? document.getElementById('qrPreview').src : '';
    try {
        const res = await fetch('/api/pay/settings', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ upi_id, payment_qr, merchant_name })
        });
        if (res.ok) alert('✅ Payment settings saved!');
        else alert('❌ Failed to save.');
    } catch { alert('❌ Network error.'); }
}

async function handleQrUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        document.getElementById('qrPreview').src = ev.target.result;
        document.getElementById('qrPreview').style.display = 'block';
        document.getElementById('qrNoImg').style.display = 'none';
    };
    reader.readAsDataURL(file);
    const formData = new FormData();
    formData.append('qr', file);
    try {
        const res = await fetch('/api/shop/upload-qr', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('qrPreview').src = data.url;
            document.getElementById('qrPreview').style.display = 'block';
            document.getElementById('qrNoImg').style.display = 'none';
        }
    } catch { }
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

    // Clear scraper fields
    const fkUrlInput = document.getElementById('fkUrlInput');
    const fkStatus = document.getElementById('fkFetchStatus');
    if (fkUrlInput) fkUrlInput.value = '';
    if (fkStatus) fkStatus.style.display = 'none';

    renderStars(p.rating);
    document.getElementById('editDrawer').classList.add('open');
}

async function fetchFlipkartData() {
    const urlInput = document.getElementById('fkUrlInput');
    const statusEl = document.getElementById('fkFetchStatus');
    const btn = document.getElementById('btnFetchFk');
    const url = urlInput.value.trim();

    if (!url) {
        statusEl.textContent = '❌ Please enter a Flipkart URL.';
        statusEl.style.color = '#dc3545';
        statusEl.style.display = 'block';
        return;
    }

    statusEl.textContent = '⏳ Fetching details from Flipkart...';
    statusEl.style.color = '#004085';
    statusEl.style.display = 'block';
    btn.disabled = true;

    try {
        const res = await fetch('/api/shop/fetch-flipkart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            statusEl.textContent = '✅ Successfully fetched details!';
            statusEl.style.color = '#28a745';

            // Populate form fields if data exists
            if (data.product.name) document.getElementById('edName').value = data.product.name;
            if (data.product.price) document.getElementById('edPrice').value = data.product.price;
            if (data.product.original_price) document.getElementById('edOrigPrice').value = data.product.original_price;
            if (data.product.description) document.getElementById('edDesc').value = data.product.description;
            if (data.product.rating) setRating(data.product.rating);

            if (data.product.image_url) {
                document.getElementById('edImageUrl').value = data.product.image_url;
                document.getElementById('edImgPreview').src = data.product.image_url;
            }
        } else {
            statusEl.textContent = '❌ Error: ' + (data.error || 'Could not fetch details.');
            statusEl.style.color = '#dc3545';
        }
    } catch (e) {
        statusEl.textContent = '❌ Network error while fetching.';
        statusEl.style.color = '#dc3545';
    } finally {
        btn.disabled = false;
    }
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

// ── Add Product ────────────────────────────────────────────────────────────────
function openAddProductModal() {
    // Reset form
    ['addProdName', 'addProdCategory', 'addProdImage', 'addProdDesc', 'addFkUrl'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('addProdPrice').value = '';
    document.getElementById('addProdOrigPrice').value = '';
    document.getElementById('addProdRating').value = '4.5';
    document.getElementById('addProdImgPreview').style.display = 'none';
    document.getElementById('addDiscountDisplay').style.display = 'none';
    document.getElementById('addFkStatus').style.display = 'none';
    document.getElementById('addProductAlert').style.display = 'none';
    document.getElementById('addProdImageFile').value = '';
    openModal('addProductModal');
}

function calcAddDiscount() {
    const sale = parseInt(document.getElementById('addProdPrice').value) || 0;
    const orig = parseInt(document.getElementById('addProdOrigPrice').value) || 0;
    const el = document.getElementById('addDiscountDisplay');
    if (sale > 0 && orig > 0 && orig > sale) {
        const pct = Math.round((1 - sale / orig) * 100);
        el.textContent = `💰 Discount: ${pct}% off (Save ₹${(orig - sale).toLocaleString('en-IN')})`;
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

function calcEditDiscount() {
    const sale = parseInt(document.getElementById('edPrice').value) || 0;
    const orig = parseInt(document.getElementById('edOrigPrice').value) || 0;
    const el = document.getElementById('editDiscountDisplay');
    if (sale > 0 && orig > 0 && orig > sale) {
        const pct = Math.round((1 - sale / orig) * 100);
        el.textContent = `💰 Discount: ${pct}% off (Save ₹${(orig - sale).toLocaleString('en-IN')})`;
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

async function handleAddProductImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        document.getElementById('addProdImgPreview').src = ev.target.result;
        document.getElementById('addProdImgPreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch('/api/shop/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('addProdImage').value = data.url;
            document.getElementById('addProdImgPreview').src = data.url;
            document.getElementById('addProdImgPreview').style.display = 'block';
        } else {
            alert('❌ Upload failed: ' + (data.error || 'Unknown error'));
        }
    } catch { alert('❌ Upload failed.'); }
}

// Watch image URL changes for preview
document.addEventListener('DOMContentLoaded', () => {
    const imgUrlInput = document.getElementById('addProdImage');
    if (imgUrlInput) {
        imgUrlInput.addEventListener('input', () => {
            const url = imgUrlInput.value.trim();
            const preview = document.getElementById('addProdImgPreview');
            if (url) { preview.src = url; preview.style.display = 'block'; }
            else preview.style.display = 'none';
        });
    }
});

// Store scraped rich data temporarily for addProduct to use
let _lastScrapedProduct = null;

async function fetchFlipkartForAdd() {
    const url = document.getElementById('addFkUrl').value.trim();
    const statusEl = document.getElementById('addFkStatus');
    const btn = document.getElementById('btnFetchFkAdd');
    _lastScrapedProduct = null;
    if (!url) {
        statusEl.textContent = '❌ Please enter a Flipkart URL.';
        statusEl.style.color = '#dc3545';
        statusEl.style.display = 'block';
        return;
    }
    statusEl.textContent = '⏳ Fetching details from Flipkart...';
    statusEl.style.color = '#004085';
    statusEl.style.display = 'block';
    btn.disabled = true;
    try {
        const res = await fetch('/api/shop/fetch-flipkart', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            statusEl.textContent = '✅ Successfully fetched details!';
            statusEl.style.color = '#28a745';
            _lastScrapedProduct = data.product;
            if (data.product.name) document.getElementById('addProdName').value = data.product.name;
            if (data.product.price) document.getElementById('addProdPrice').value = data.product.price;
            if (data.product.original_price) document.getElementById('addProdOrigPrice').value = data.product.original_price;
            if (data.product.description) document.getElementById('addProdDesc').value = data.product.description;
            if (data.product.rating) document.getElementById('addProdRating').value = data.product.rating;
            if (data.product.image_url) {
                document.getElementById('addProdImage').value = data.product.image_url;
                document.getElementById('addProdImgPreview').src = data.product.image_url;
                document.getElementById('addProdImgPreview').style.display = 'block';
            }
            if (data.product.category) document.getElementById('addProdCategory').value = data.product.category;
            calcAddDiscount();
        } else {
            statusEl.textContent = '❌ Error: ' + (data.error || 'Could not fetch details.');
            statusEl.style.color = '#dc3545';
        }
    } catch (e) {
        statusEl.textContent = '❌ Network error while fetching.';
        statusEl.style.color = '#dc3545';
    } finally {
        btn.disabled = false;
    }
}

async function addProduct() {
    const name = document.getElementById('addProdName').value.trim();
    const category = document.getElementById('addProdCategory').value.trim();
    const image_url = document.getElementById('addProdImage').value.trim();
    const price = parseInt(document.getElementById('addProdPrice').value) || 0;
    const original_price = parseInt(document.getElementById('addProdOrigPrice').value) || 0;
    const description = document.getElementById('addProdDesc').value.trim();
    const rating = parseFloat(document.getElementById('addProdRating').value) || 4.5;
    const alert_el = document.getElementById('addProductAlert');

    if (!name || !category || !image_url || !price || !original_price) {
        showAlert(alert_el, 'Please fill all required fields (Name, Category, Image, Sale Price, Original Price).', 'error');
        return;
    }

    // Include rich scraped data if available
    const payload = { name, category, image_url, price, original_price, description, rating };
    if (_lastScrapedProduct) {
        payload.review_count = _lastScrapedProduct.review_count || 0;
        payload.images = _lastScrapedProduct.images || [];
        payload.highlights = _lastScrapedProduct.highlights || [];
        payload.specifications = _lastScrapedProduct.specifications || [];
        payload.reviews = _lastScrapedProduct.reviews || [];
        payload.ratings_breakdown = _lastScrapedProduct.ratings_breakdown || {};
        payload.brand = _lastScrapedProduct.brand || '';
    }

    try {
        const res = await fetch('/api/shop/products', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) { showAlert(alert_el, data.error || 'Failed to add product.', 'error'); return; }
        shopProducts.push(data.product);
        renderProductGrid();
        showAlert(alert_el, '✅ Product added successfully!', 'success');
        _lastScrapedProduct = null;
        setTimeout(() => closeModal('addProductModal'), 1200);
    } catch (e) {
        showAlert(alert_el, 'Network error.', 'error');
    }
}

// ── Delete Product ─────────────────────────────────────────────────────────────
async function deleteCurrentProduct() {
    const id = document.getElementById('edProductId').value;
    if (!id) return;
    const product = shopProducts.find(x => x.id === parseInt(id));
    if (!confirm(`Delete "${product?.name || 'this product'}"? This cannot be undone.`)) return;
    try {
        const res = await fetch(`/api/shop/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
            shopProducts = shopProducts.filter(x => x.id !== parseInt(id));
            renderProductGrid();
            closeEditDrawer();
            alert('✅ Product deleted.');
        } else {
            const data = await res.json();
            alert('❌ ' + (data.error || 'Failed to delete.'));
        }
    } catch { alert('❌ Network error.'); }
}

// ── Shop Settings Save ─────────────────────────────────────────────────────────
async function saveShopSettings() {
    const shop_name = document.getElementById('shopNameInput').value.trim();
    const banner_text = document.getElementById('bannerTextInput').value.trim();
    try {
        const res = await fetch('/api/shop/settings', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shop_name, banner_text })
        });
        if (res.ok) alert('✅ Shop settings saved!');
        else alert('❌ Failed to save.');
    } catch { alert('❌ Network error.'); }
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

// ── Payment Logs ───────────────────────────────────────────────────────────────
async function loadPaymentLogs() {
    try {
        const res = await fetch('/api/pay/transactions');
        if (!res.ok) return;
        const { transactions } = await res.json();
        const tbody = document.getElementById('payLogsBody');
        if (!transactions.length) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon">💰</div>No transactions yet</div></td></tr>';
            return;
        }
        const statusBadge = (s) => {
            const colors = { pending: '#f59e0b', utr_submitted: '#3b82f6', verified: '#10b981', failed: '#ef4444', expired: '#6b7280' };
            const labels = { pending: '⏳ Pending', utr_submitted: '📤 UTR Submitted', verified: '✅ Verified', failed: '❌ Failed', expired: '⏰ Expired' };
            return `<span style="background:${colors[s] || '#999'}22;color:${colors[s] || '#999'};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap">${labels[s] || s}</span>`;
        };
        tbody.innerHTML = transactions.map(t => `<tr>
            <td style="font-family:monospace;font-size:11px">${t.txn_ref.slice(-8)}</td>
            <td><div style="font-size:12px;font-weight:600">${t.customer_name || '—'}</div><div style="font-size:10px;color:var(--text-muted)">${t.customer_phone || ''} ${t.customer_email || ''}</div></td>
            <td style="font-weight:800">₹${parseInt(t.amount).toLocaleString('en-IN')}</td>
            <td style="font-family:monospace;font-size:12px;font-weight:700;color:${t.utr ? 'var(--accent)' : 'var(--text-muted)'}">${t.utr || '—'}</td>
            <td>${statusBadge(t.status)}</td>
            <td style="font-size:11px;color:var(--text-muted)">${fmtDate(t.created_at)}</td>
            <td>${t.status === 'utr_submitted' ? `<button class="btn btn-primary btn-sm" onclick="verifyTxn(${t.id},'verified')" style="margin-right:4px;font-size:10px">✅ Verify</button><button class="btn btn-danger btn-sm" onclick="verifyTxn(${t.id},'failed')" style="font-size:10px">❌ Reject</button>` : t.status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="verifyTxn(${t.id},'failed')" style="font-size:10px">❌ Cancel</button>` : `<span style="font-size:11px;color:var(--text-muted)">${t.verified_at ? 'at ' + fmtDate(t.verified_at) : '—'}</span>`}</td>
        </tr>`).join('');
    } catch (e) { console.error('loadPaymentLogs:', e); }
}

async function verifyTxn(id, status) {
    const notes = status === 'verified' ? 'Verified by admin' : prompt('Reason for rejection (optional):', 'Payment not received');
    if (notes === null && status === 'failed') return; // user cancelled
    try {
        const res = await fetch('/api/pay/transactions/' + id, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, notes: notes || '' })
        });
        if (res.ok) { alert('✅ Transaction ' + status + '!'); loadPaymentLogs(); }
        else { const d = await res.json(); alert('❌ ' + (d.error || 'Failed')); }
    } catch { alert('❌ Network error.'); }
}

// Override showPage to load pay logs + import page
const _showPage = showPage;
window.showPage = function (name) {
    _showPage(name);
    if (name === 'paylogs') loadPaymentLogs();
};

// ── Flipkart Import ────────────────────────────────────────────────────────────
let _importedProduct = null;
let _importedBulk = [];
let _bulkSelected = new Set();
let _importLog = [];

function isProductUrl(url) {
    return url.includes('/p/') || url.includes('pid=') || url.includes('dl.flipkart.com/s/');
}

async function startFlipkartImport() {
    const url = document.getElementById('fkImportUrl').value.trim();
    const status = document.getElementById('fkImportStatus');
    const btn = document.getElementById('btnFkImport');

    document.getElementById('fkSinglePreview').style.display = 'none';
    document.getElementById('fkBulkPreview').style.display = 'none';
    _importedProduct = null;
    _importedBulk = [];

    if (!url || !url.includes('flipkart')) {
        status.textContent = 'Please enter a valid Flipkart URL.';
        status.style.background = 'rgba(239,68,68,0.1)';
        status.style.color = '#ef4444';
        status.style.display = 'block';
        return;
    }

    status.textContent = 'Fetching data from Flipkart... This may take 10-30 seconds.';
    status.style.background = 'rgba(59,130,246,0.1)';
    status.style.color = '#60a5fa';
    status.style.display = 'block';
    btn.disabled = true;

    const productMode = isProductUrl(url);

    try {
        const endpoint = productMode ? '/api/shop/fetch-flipkart' : '/api/shop/fetch-flipkart-category';
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            // If category failed, try product endpoint
            if (!productMode) {
                const res2 = await fetch('/api/shop/fetch-flipkart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const data2 = await res2.json();
                if (res2.ok && data2.success) {
                    _importedProduct = data2.product;
                    renderSinglePreview(data2.product);
                    status.textContent = 'Product fetched successfully!';
                    status.style.background = 'rgba(16,185,129,0.1)';
                    status.style.color = '#10b981';
                    return;
                }
            }
            status.textContent = data.error || 'Failed to fetch. Try again or use a different URL.';
            status.style.background = 'rgba(239,68,68,0.1)';
            status.style.color = '#ef4444';
            return;
        }

        if (productMode || data.product) {
            _importedProduct = data.product;
            renderSinglePreview(data.product);
            status.textContent = 'Product fetched successfully! Review below and click "Add to My Shop".';
            status.style.background = 'rgba(16,185,129,0.1)';
            status.style.color = '#10b981';
        } else if (data.products) {
            _importedBulk = data.products;
            _bulkSelected = new Set(data.products.map((_, i) => i));
            renderBulkPreview(data.products);
            status.textContent = `Found ${data.products.length} products! Select which ones to import.`;
            status.style.background = 'rgba(16,185,129,0.1)';
            status.style.color = '#10b981';
        }
    } catch (e) {
        status.textContent = 'Network error. Please check your connection and try again.';
        status.style.background = 'rgba(239,68,68,0.1)';
        status.style.color = '#ef4444';
    } finally {
        btn.disabled = false;
    }
}

function renderSinglePreview(p) {
    document.getElementById('fkSinglePreview').style.display = 'block';
    document.getElementById('fkPrevImg').src = p.image_url || '';
    document.getElementById('fkPrevName').textContent = p.name || '';
    document.getElementById('fkPrevBrand').textContent = p.brand || '';
    document.getElementById('fkPrevRating').textContent = (p.rating || 4.0).toFixed(1) + ' \u2605';
    document.getElementById('fkPrevReviewCount').textContent = (p.review_count || 0).toLocaleString() + ' Ratings';
    document.getElementById('fkPrevPrice').textContent = '\u20B9' + (p.price || 0).toLocaleString('en-IN');
    document.getElementById('fkPrevOrigPrice').textContent = p.original_price ? '\u20B9' + p.original_price.toLocaleString('en-IN') : '';
    const disc = p.original_price && p.original_price > p.price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
    document.getElementById('fkPrevDiscount').textContent = disc > 0 ? disc + '% off' : '';
    document.getElementById('fkPrevCategory').textContent = p.category ? 'Category: ' + p.category : '';
    document.getElementById('fkPrevDesc').textContent = p.description || '';

    // Highlights
    const hlEl = document.getElementById('fkPrevHighlights');
    if (p.highlights && p.highlights.length) {
        hlEl.innerHTML = '<div style="font-size:13px;font-weight:700;margin-bottom:6px;color:var(--text-primary)">Highlights</div><ul style="font-size:13px;color:var(--text-secondary);padding-left:18px;line-height:1.8">' +
            p.highlights.map(h => '<li>' + h + '</li>').join('') + '</ul>';
    } else {
        hlEl.innerHTML = '';
    }

    // Gallery
    const gallery = document.getElementById('fkPrevGallery');
    if (p.images && p.images.length > 1) {
        gallery.innerHTML = p.images.slice(0, 6).map(img =>
            '<img src="' + img + '" style="width:40px;height:40px;object-fit:contain;border:1px solid var(--border);border-radius:4px;cursor:pointer;background:#f5f5f5" onclick="document.getElementById(\'fkPrevImg\').src=\'' + img.replace(/'/g, "\\'") + '\'" />'
        ).join('');
    } else {
        gallery.innerHTML = '';
    }

    // Specifications
    const specEl = document.getElementById('fkPrevSpecs');
    if (p.specifications && p.specifications.length) {
        let specHtml = '<div style="font-size:15px;font-weight:700;margin-bottom:12px;color:var(--text-primary)">Specifications</div>';
        p.specifications.forEach(group => {
            specHtml += '<div style="margin-bottom:12px"><div style="font-size:13px;font-weight:700;color:var(--accent-light);margin-bottom:6px;padding:6px 0;border-bottom:1px solid var(--border)">' + (group.group || 'General') + '</div>';
            if (group.items) {
                group.items.forEach(item => {
                    specHtml += '<div style="display:flex;padding:4px 0;font-size:13px"><span style="width:180px;flex-shrink:0;color:var(--text-muted)">' + item.label + '</span><span style="color:var(--text-primary)">' + item.value + '</span></div>';
                });
            }
            specHtml += '</div>';
        });
        specEl.innerHTML = specHtml;
    } else {
        specEl.innerHTML = '';
    }

    // Reviews
    const revEl = document.getElementById('fkPrevReviews');
    if (p.reviews && p.reviews.length) {
        let revHtml = '<div style="font-size:15px;font-weight:700;margin-bottom:12px;color:var(--text-primary)">Reviews (' + p.reviews.length + ')</div>';
        p.reviews.slice(0, 5).forEach(r => {
            const color = r.rating >= 4 ? '#388e3c' : r.rating >= 3 ? '#ff9f00' : '#ef4444';
            revHtml += '<div style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;margin-bottom:8px">';
            revHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="background:' + color + ';color:#fff;padding:1px 6px;border-radius:3px;font-size:12px;font-weight:700">' + r.rating + ' \u2605</span>';
            if (r.title) revHtml += '<span style="font-size:14px;font-weight:600">' + r.title + '</span>';
            revHtml += '</div>';
            if (r.text) revHtml += '<div style="font-size:13px;color:var(--text-secondary);line-height:1.5">' + r.text + '</div>';
            revHtml += '<div style="font-size:11px;color:var(--text-muted);margin-top:6px">' + (r.user || 'Customer') + (r.city ? ' \u2022 ' + r.city : '') + (r.date ? ' \u2022 ' + r.date : '') + '</div>';
            revHtml += '</div>';
        });
        revEl.innerHTML = revHtml;
    } else {
        revEl.innerHTML = '';
    }
}

function renderBulkPreview(products) {
    document.getElementById('fkBulkPreview').style.display = 'block';
    document.getElementById('fkBulkTitle').textContent = 'Products Found (' + products.length + ')';
    const grid = document.getElementById('fkBulkGrid');
    grid.innerHTML = products.map((p, i) => {
        const disc = p.original_price && p.original_price > p.price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
        return '<div class="pe-card" id="bulkCard' + i + '" style="position:relative;border:2px solid var(--accent);cursor:pointer" onclick="toggleBulkSelect(' + i + ')">' +
            '<div style="position:absolute;top:6px;left:6px;z-index:2;width:22px;height:22px;border-radius:4px;border:2px solid var(--accent);background:' + (_bulkSelected.has(i) ? 'var(--accent)' : 'transparent') + ';display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff">' + (_bulkSelected.has(i) ? '\u2713' : '') + '</div>' +
            '<div class="pe-img-wrap"><img src="' + (p.image_url || '') + '" alt="" loading="lazy" style="object-fit:contain;background:#f5f5f5" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22/>\'"/></div>' +
            '<div class="pe-body"><div class="pe-name">' + p.name + '</div><div class="pe-cat">' + (p.category || '') + ' \u2022 \u2B50 ' + (p.rating || 4.0).toFixed(1) + '</div>' +
            '<div class="pe-price">\u20B9' + (p.price || 0).toLocaleString('en-IN') + (disc > 0 ? ' <span class="pe-disc">' + disc + '% off</span>' : '') + '</div></div></div>';
    }).join('');
}

function toggleBulkSelect(i) {
    if (_bulkSelected.has(i)) _bulkSelected.delete(i);
    else _bulkSelected.add(i);
    const card = document.getElementById('bulkCard' + i);
    if (card) {
        card.style.borderColor = _bulkSelected.has(i) ? 'var(--accent)' : 'var(--border)';
        const checkbox = card.querySelector('div');
        if (checkbox) {
            checkbox.style.background = _bulkSelected.has(i) ? 'var(--accent)' : 'transparent';
            checkbox.textContent = _bulkSelected.has(i) ? '\u2713' : '';
        }
    }
}

function toggleSelectAll() {
    if (_bulkSelected.size === _importedBulk.length) {
        _bulkSelected.clear();
    } else {
        _bulkSelected = new Set(_importedBulk.map((_, i) => i));
    }
    renderBulkPreview(_importedBulk);
}

async function addSingleFromImport() {
    if (!_importedProduct) return;
    const p = _importedProduct;
    const btn = document.getElementById('btnAddSingle');
    btn.disabled = true;
    btn.textContent = 'Adding...';

    const payload = {
        name: p.name, category: p.category || 'General', image_url: p.image_url,
        price: p.price, original_price: p.original_price || p.price,
        description: p.description || p.name, rating: p.rating || 4.0,
        review_count: p.review_count || 0,
        images: p.images || [], highlights: p.highlights || [],
        specifications: p.specifications || [], reviews: p.reviews || [],
        ratings_breakdown: p.ratings_breakdown || {}, brand: p.brand || ''
    };

    try {
        const res = await fetch('/api/shop/products', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
            btn.textContent = 'Added!';
            btn.style.background = '#10b981';
            shopProducts.push(data.product);
            addImportLog(p.name, 'success');
            setTimeout(() => {
                btn.textContent = '\u2795 Add to My Shop';
                btn.style.background = '';
                btn.disabled = false;
            }, 2000);
        } else {
            btn.textContent = 'Failed: ' + (data.error || 'Error');
            btn.style.background = '#ef4444';
            addImportLog(p.name, 'failed');
            setTimeout(() => { btn.textContent = '\u2795 Add to My Shop'; btn.style.background = ''; btn.disabled = false; }, 2000);
        }
    } catch {
        btn.textContent = 'Network error';
        btn.disabled = false;
        addImportLog(p.name, 'error');
    }
}

async function bulkAddFromImport() {
    if (!_importedBulk.length || !_bulkSelected.size) return;
    const btn = document.getElementById('btnBulkAdd');
    btn.disabled = true;
    btn.textContent = 'Importing ' + _bulkSelected.size + ' products...';

    const selected = _importedBulk.filter((_, i) => _bulkSelected.has(i));

    try {
        const res = await fetch('/api/shop/bulk-add', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: selected })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            btn.textContent = 'Imported ' + data.count + ' products!';
            btn.style.background = '#10b981';
            addImportLog(data.count + ' products from category', 'success');
            loadMyShop(); // Refresh shop data
            setTimeout(() => { btn.textContent = '\uD83D\uDCE5 Import Selected'; btn.style.background = ''; btn.disabled = false; }, 3000);
        } else {
            btn.textContent = 'Failed: ' + (data.error || 'Error');
            btn.style.background = '#ef4444';
            addImportLog('Bulk import', 'failed');
            setTimeout(() => { btn.textContent = '\uD83D\uDCE5 Import Selected'; btn.style.background = ''; btn.disabled = false; }, 2000);
        }
    } catch {
        btn.textContent = 'Network error';
        btn.disabled = false;
    }
}

function addImportLog(item, status) {
    const time = new Date().toLocaleTimeString();
    _importLog.unshift({ item, status, time });
    const logEl = document.getElementById('fkImportLog');
    const histEl = document.getElementById('fkImportHistory');
    if (histEl) histEl.style.display = 'block';
    if (logEl) {
        logEl.innerHTML = _importLog.slice(0, 20).map(l => {
            const icon = l.status === 'success' ? '\u2705' : '\u274C';
            return '<div style="padding:6px 0;border-bottom:1px solid var(--border)">' + icon + ' <strong>' + l.item + '</strong> <span style="float:right">' + l.time + '</span></div>';
        }).join('');
    }
}

init();
