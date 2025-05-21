document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.login-box');
    const emailInput = document.getElementById('email');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) {
            showError('Please enter your email address.');
            return;
        }
        showLoading('Sending reset link...');

        try {
            const response = await fetch('http://localhost:4000/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify({email})
            });

            const data = await response.json();

            hideLoading();

            if (response.ok && data.ok === true) {
                showSuccess('Reset link has been sent to your email.');
            } else {
                showError(data.error || 'Something went wrong. Please try again.');
            }

        } catch (err) {
            hideLoading();
            console.error('Forgot password error:', err);
            showError('Server error. Please try again later.');
        }
    });

    function showError(message) {
        removeMessage();
        const div = document.createElement('div');
        div.id = 'forgot-message';
        div.innerText = message;
        div.style.backgroundColor = '#fee2e2';
        div.style.color = '#b91c1c';
        div.style.border = '1px solid #fca5a5';
        div.style.padding = '0.75rem';
        div.style.marginTop = '1rem';
        div.style.borderRadius = '6px';
        div.style.fontSize = '0.95rem';
        div.style.textAlign = 'center';
        div.style.fontWeight = '500';
        form.appendChild(div);
    }

    function showSuccess(message) {
        removeMessage();
        const div = document.createElement('div');
        div.id = 'forgot-message';
        div.innerText = message;
        div.style.backgroundColor = '#d1fae5';
        div.style.color = '#065f46';
        div.style.border = '1px solid #6ee7b7';
        div.style.padding = '0.75rem';
        div.style.marginTop = '1rem';
        div.style.borderRadius = '6px';
        div.style.fontSize = '0.95rem';
        div.style.textAlign = 'center';
        div.style.fontWeight = '500';
        form.appendChild(div);
    }

    function removeMessage() {
        const old = document.getElementById('forgot-message');
        if (old) old.remove();
    }

    function showLoading(text = 'Loading...') {
        if (document.getElementById('spinner-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'spinner-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.7)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        const spinner = document.createElement('div');
        spinner.style.border = '6px solid #f3f3f3';
        spinner.style.borderTop = '6px solid #FFB703';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '60px';
        spinner.style.height = '60px';
        spinner.style.animation = 'spin 1s linear infinite';
        spinner.style.marginBottom = '20px';

        const message = document.createElement('p');
        message.innerText = text;
        message.style.color = '#fff';
        message.style.fontSize = '1.2rem';
        message.style.fontFamily = 'Poppins, sans-serif';

        overlay.appendChild(spinner);
        overlay.appendChild(message);
        document.body.appendChild(overlay);

        // Spinner CSS
        if (!document.getElementById('spin-style')) {
            const style = document.createElement('style');
            style.id = 'spin-style';
            style.innerHTML = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function hideLoading() {
        const overlay = document.getElementById('spinner-overlay');
        if (overlay) overlay.remove();
    }
});
