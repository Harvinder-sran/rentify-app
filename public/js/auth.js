import { api, Auth } from './api.js';

export function wireSignup() {
    const form = document.getElementById('signup-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('signup-btn');
        const errEl = document.getElementById('signup-error');
        errEl.classList.add('hidden');
        btn.disabled = true;
        btn.innerHTML = 'Signing up...';
        
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        
        try {
            const res = await api('/auth/signup', { method: 'POST', body: data });
            if (res.access_token) {
                Auth.login(res.access_token, res.user_id);
                window.location.href = '/dashboard.html';
            } else if (res.message) {
                errEl.innerText = res.message;
                errEl.classList.remove('hidden');
            }
        } catch(err) {
            errEl.innerText = err.message;
            errEl.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Sign Up';
        }
    });
}

export function wireLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        const errEl = document.getElementById('login-error');
        errEl.classList.add('hidden');
        btn.disabled = true;
        btn.innerHTML = 'Logging in...';
        
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        
        try {
            const res = await api('/auth/login', { method: 'POST', body: data });
            Auth.login(res.access_token, res.user_id);
            window.location.href = '/dashboard.html';
        } catch(err) {
            errEl.innerText = err.message;
            errEl.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Log In';
        }
    });
}
