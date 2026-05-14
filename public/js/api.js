const IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
export const API_BASE = IS_LOCAL ? 'http://localhost:8001/api' : '/api';

export async function api(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { ...options.headers };
    
    if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(url, { ...options, headers });
    let data;
    try {
        data = await res.json();
    } catch(e) {
        data = null;
    }
    
    if (!res.ok) {
        throw new Error(data?.detail || data?.message || 'API Error');
    }
    return data;
}

export const Auth = {
    login: (jwt, userId) => {
        localStorage.setItem('access_token', jwt);
        localStorage.setItem('user_id', userId);
    },
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        window.location.href = '/login.html';
    },
    isLoggedIn: () => !!localStorage.getItem('access_token'),
    requireOrRedirect: () => {
        if (!Auth.isLoggedIn()) {
            window.location.href = '/login.html';
        }
    }
};

export function fmtINR(n) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function fmtDate(isoStr) {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

export function daysBetween(startStr, endStr) {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diffTime = Math.abs(e - s);
    let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (days === 0) days = 1;
    return days;
}

export function todayISO() {
    const d = new Date();
    // Offset fix for local timezone
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d - offset)).toISOString().split('T')[0];
    return localISOTime;
}

export function attachNav() {
    const navEl = document.getElementById('main-nav');
    if (!navEl) return;
    
    const loggedIn = Auth.isLoggedIn();
    
    navEl.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-20">
                <div class="flex-shrink-0 flex items-center">
                    <a href="/" class="text-3xl font-bold text-indigo-600 tracking-tight flex items-center gap-2">
                        <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        Rentify
                    </a>
                </div>
                <div class="flex space-x-6 items-center">
                    <a href="/" class="text-gray-600 hover:text-indigo-600 font-medium transition">Browse</a>
                    ${loggedIn ? `
                        <a href="/new-listing.html" class="text-gray-600 hover:text-indigo-600 font-medium transition">New Listing</a>
                        <a href="/dashboard.html" class="text-gray-600 hover:text-indigo-600 font-medium transition">Dashboard</a>
                        <button id="logout-btn" class="bg-gray-100 text-gray-700 px-5 py-2 rounded-full font-medium hover:bg-gray-200 transition">Logout</button>
                    ` : `
                        <a href="/login.html" class="text-gray-600 hover:text-indigo-600 font-medium transition">Login</a>
                        <a href="/signup.html" class="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 shadow-md hover:shadow-lg transition">Sign Up</a>
                    `}
                </div>
            </div>
        </div>
    `;
    
    if (loggedIn) {
        document.getElementById('logout-btn').addEventListener('click', Auth.logout);
    }
}
