(() => {
    const form = document.querySelector('[data-auth-form]');
    if (!form) return;
    const status = form.querySelector('[data-form-status]');
    const mode = form.dataset.authForm;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const values = Object.fromEntries(new FormData(form));
        try {
            if (mode === 'register' && values.password !== values.confirmPassword) {
                throw new Error('Passwords do not match.');
            }
            if (mode === 'reset' && values.password !== values.confirmPassword) {
                throw new Error('Passwords do not match.');
            }
            let result;
            if (mode === 'login' || mode === 'register') {
                const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
                result = await window.Midnight.api(url, {
                    method: 'POST',
                    body: JSON.stringify(mode === 'login'
                        ? { email: values.email, password: values.password, remember: form.elements.remember?.checked === true }
                        : { fullName: values.fullName, email: values.email, password: values.password })
                });
                location.href = result.customer.role === 'admin' ? 'admin/index.html' : 'profile.html';
                return;
            }
            if (mode === 'forgot') {
                result = await window.Midnight.api('/api/auth/password-reset', {
                    method: 'POST', body: JSON.stringify({ email: values.email })
                });
                status.textContent = result.message;
                return;
            }
            if (mode === 'reset') {
                const token = new URLSearchParams(location.search).get('token');
                if (!token) throw new Error('This reset link is invalid or has expired.');
                result = await window.Midnight.api('/api/auth/password-reset/confirm', {
                    method: 'POST', body: JSON.stringify({ token, password: values.password })
                });
                status.textContent = result.message;
                form.reset();
                return;
            }
        } catch (error) {
            status.textContent = error.message;
        }
    });
})();
