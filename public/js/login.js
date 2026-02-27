// ─── Login Page JS ────────────────────────────────────────────────────────────
let currentTgId = '';

// OTP digit inputs — auto-advance
document.addEventListener('DOMContentLoaded', () => {
    const digits = document.querySelectorAll('.otp-digit');
    digits.forEach((d, i) => {
        d.addEventListener('input', e => {
            e.target.value = e.target.value.replace(/\D/g, '');
            if (e.target.value && i < digits.length - 1) digits[i + 1].focus();
            if (getOtpValue().length === 6) verifyOTP();
        });
        d.addEventListener('keydown', e => {
            if (e.key === 'Backspace' && !e.target.value && i > 0) digits[i - 1].focus();
        });
        d.addEventListener('paste', e => {
            const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            if (paste.length === 6) {
                digits.forEach((dd, ii) => { dd.value = paste[ii] || ''; });
                digits[5].focus();
                setTimeout(() => verifyOTP(), 100);
            }
            e.preventDefault();
        });
    });

    // Check if already logged in
    fetch('/api/auth/me').then(r => r.json()).then(d => {
        if (d.user) window.location.href = '/dashboard.html';
    }).catch(() => { });
});

function getOtpValue() {
    return Array.from(document.querySelectorAll('.otp-digit')).map(d => d.value).join('');
}

function setAlert(id, msg, type = 'error') {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = `alert alert-${type} show`;
}
function clearAlert(id) {
    const el = document.getElementById(id);
    el.className = 'alert';
    el.textContent = '';
}

function setLoading(btnId, loading, defaultText) {
    const btn = document.getElementById(btnId);
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<span class="spinner"></span> Please wait...'
        : defaultText;
}

async function requestOTP(isResend = false) {
    const tgId = document.getElementById('tgId')?.value?.trim() || currentTgId;
    if (!tgId || !/^\d+$/.test(tgId)) {
        setAlert('step1Error', 'Please enter a valid numeric Telegram User ID.');
        return;
    }

    clearAlert('step1Error');
    setLoading('sendOtpBtn', true, '<span class="tg-icon">✈</span> Send OTP via Telegram');

    try {
        const res = await fetch('/api/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tgId })
        });
        const data = await res.json();

        if (!res.ok) {
            setAlert('step1Error', data.error || 'Failed to send OTP.');
            return;
        }

        currentTgId = tgId;

        if (data.demo && data.demoOtp) {
            // Show OTP in demo box
            document.getElementById('demoBanner').style.display = 'block';
            document.getElementById('demoOtpDisplay').textContent = data.demoOtp;
            document.getElementById('otpSubText').textContent = '🧪 DEMO MODE — OTP shown on previous screen and prefilled below.';
            // Prefill OTP
            const digits = document.querySelectorAll('.otp-digit');
            data.demoOtp.split('').forEach((d, i) => { digits[i].value = d; });
        } else {
            document.getElementById('otpSubText').textContent = `OTP sent to Telegram ID ${tgId}. Check your Telegram messages.`;
        }

        // Switch to step 2
        showStep2();

    } finally {
        setLoading('sendOtpBtn', false, '<span class="tg-icon">✈</span> Send OTP via Telegram');
    }
}

function showStep2() {
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    document.getElementById('dot2').classList.add('done');
    document.querySelectorAll('.otp-digit')[0].focus();
    clearAlert('step2Error');
}

function goBack() {
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.add('active');
    document.getElementById('dot2').classList.remove('done');
    // Clear OTP inputs
    document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
    clearAlert('step1Error');
}

async function verifyOTP() {
    const otp = getOtpValue();
    if (otp.length !== 6) {
        setAlert('step2Error', 'Please enter all 6 digits.');
        return;
    }

    clearAlert('step2Error');
    setLoading('verifyOtpBtn', true, 'Verify & Login');

    try {
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tgId: currentTgId, otp })
        });
        const data = await res.json();

        if (!res.ok) {
            setAlert('step2Error', data.error || 'OTP verification failed.');
            document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
            document.querySelectorAll('.otp-digit')[0].focus();
            return;
        }

        // Success — redirect to dashboard
        window.location.href = '/dashboard.html';

    } finally {
        setLoading('verifyOtpBtn', false, 'Verify & Login');
    }
}
