(() => {
    const form = document.querySelector('[data-auth-form]');
    const status = form?.querySelector('[data-form-status]');
    const mode = form?.dataset.authForm;
    const query = new URLSearchParams(location.search);
    const authMessages = {
        'google-cancelled': 'Google sign-in was cancelled. You can try again or use email and password.',
        'google-state-invalid': 'That Google sign-in request expired or could not be verified. Please try again.',
        'google-login-failed': 'Google sign-in could not be completed. Please try again.',
        'google-account-conflict': 'This Google account could not be linked because it is already associated with another account.',
        'google-email-mismatch': 'To link Google, sign in with a Google account that uses the same verified email address.',
        'google-link-session-expired': 'Your sign-in session expired before account linking completed. Please try again.',
        'account-disabled': 'This account is currently unavailable. Please contact the restaurant.',
        'admin-required': 'Administrator access is required for that page.',
        'sign-in-required': 'Sign in before linking a Google account.'
    };

    if (status && query.has('authError')) {
        status.textContent = authMessages[query.get('authError')] || 'Sign-in could not be completed. Please try again.';
    }

    document.querySelectorAll('[data-google-button]').forEach((button) => {
        button.addEventListener('click', () => {
            button.setAttribute('aria-busy', 'true');
            button.querySelector('span:last-child').textContent = 'Connecting to Google…';
        });
    });

    const linkPanel = document.querySelector('[data-google-link-panel]');
    const linkForm = document.querySelector('[data-google-link-form]');
    if (linkPanel && query.get('googleLink') === 'required') {
        linkPanel.hidden = false;
        linkForm.elements.password.focus();
        history.replaceState(null, '', location.pathname);
        window.Midnight.api('/api/auth/google/pending')
            .then((result) => {
                linkPanel.querySelector('[data-google-link-email]').textContent = `Verified Google email: ${result.email}`;
            })
            .catch((error) => {
                linkForm.querySelector('[data-google-link-status]').textContent = error.message;
                linkForm.querySelector('button[type="submit"]').disabled = true;
            });
    }

    linkForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!linkForm.reportValidity()) return;
        const linkStatus = linkForm.querySelector('[data-google-link-status]');
        const button = linkForm.querySelector('button[type="submit"]');
        button.disabled = true;
        linkStatus.textContent = 'Verifying the existing account…';
        try {
            const result = await window.Midnight.api('/api/auth/google/link', {
                method: 'POST',
                body: JSON.stringify({ password: linkForm.elements.password.value })
            });
            location.href = result.customer.role === 'admin' ? 'admin/index.html' : 'profile.html';
        } catch (error) {
            linkStatus.textContent = error.message;
            button.disabled = false;
        }
    });

    if (!form) return;

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
