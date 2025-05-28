document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.login-box');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }

        showLoading('Logging in...');

        try {
            const response = await fetch('https://backend.azamov.me/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok || !data.token) {
                hideLoading();
                showError(data.error || 'Login failed. Please check your credentials.');
                return;
            }

            localStorage.setItem('token', data.token); // 🟢 Save JWT
            localStorage.setItem('uid', data.uid); // 🟢 Save JWT
            await checkUserRole(data.token); // 🟢 Pass token to check role

        } catch (err) {
            console.error('Login error:', err);
            hideLoading();
            showError('Server error. Please try again later.');
        }
    });

    async function checkUserRole(token) {
        try {
            const res = await fetch(`https://backend.azamov.me/isAdmin`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            hideLoading();

            if (res.ok && data.isAdmin) {
                window.location.href = '../../admin/dashboard.html';
            } else {
                window.location.href = '../../../index.html';
            }
        } catch (error) {
            console.error('Role check error:', error);
            hideLoading();
            window.location.href = '../../../index.html';
        }
    }

    function showError(message) {
        const existing = document.getElementById('login-error');
        if (existing) existing.remove();

        const errorDiv = document.createElement('div');
        errorDiv.id = 'login-error';
        errorDiv.innerText = message;
        errorDiv.style.backgroundColor = '#fee2e2';
        errorDiv.style.color = '#b91c1c';
        errorDiv.style.border = '1px solid #fca5a5';
        errorDiv.style.padding = '0.75rem';
        errorDiv.style.marginTop = '1rem';
        errorDiv.style.borderRadius = '6px';
        errorDiv.style.fontSize = '0.95rem';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.fontWeight = '500';

        form.appendChild(errorDiv);
    }

    function showLoading(text = 'Please wait...') {
        if (document.getElementById('login-loading')) return;

        const overlay = document.createElement('div');
        overlay.id = 'login-loading';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.flexDirection = 'column';
        overlay.style.zIndex = '9999';

        const spinner = document.createElement('div');
        spinner.style.border = '6px solid #f3f3f3';
        spinner.style.borderTop = '6px solid #3b82f6';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '60px';
        spinner.style.height = '60px';
        spinner.style.animation = 'spin 1s linear infinite';
        spinner.style.marginBottom = '15px';

        const loadingText = document.createElement('p');
        loadingText.innerText = text;
        loadingText.style.color = '#fff';
        loadingText.style.fontSize = '1rem';

        overlay.appendChild(spinner);
        overlay.appendChild(loadingText);
        document.body.appendChild(overlay);

        if (!document.getElementById('spin-style')) {
            const styleSheet = document.createElement("style");
            styleSheet.id = 'spin-style';
            styleSheet.innerText = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }

    function hideLoading() {
        const overlay = document.getElementById('login-loading');
        if (overlay) overlay.remove();
    }
});
