import { api, Auth, fmtINR, daysBetween, todayISO } from './api.js';

export async function loadListingDetail() {
    const container = document.getElementById('listing-detail-container');
    if (!container) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
        container.innerHTML = '<p class="text-center p-10 text-red-500">Listing ID missing.</p>';
        return;
    }
    
    try {
        const listing = await api(`/listings/${id}`);
        
        let imagesHtml = '';
        if (listing.image_urls && listing.image_urls.length > 0) {
            imagesHtml = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <img src="${listing.image_urls[0]}" class="w-full h-96 object-cover rounded-2xl shadow-sm" />
                    <div class="grid grid-cols-2 gap-4">
                        ${listing.image_urls.slice(1, 5).map(url => `
                            <img src="${url}" class="w-full h-44 object-cover rounded-2xl shadow-sm" />
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        const loggedIn = Auth.isLoggedIn();
        const currentUserId = localStorage.getItem('user_id');
        const isOwner = loggedIn && currentUserId === listing.owner_id;
        
        container.innerHTML = `
            ${imagesHtml}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div class="lg:col-span-2">
                    <div class="flex items-center justify-between mb-4">
                        <span class="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">${listing.category}</span>
                        <span class="text-gray-500 text-sm flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            ${listing.owner_city}
                        </span>
                    </div>
                    <h1 class="text-4xl font-bold text-gray-900 mb-6">${listing.title}</h1>
                    <div class="prose prose-indigo max-w-none mb-8 text-gray-600">
                        <p>${listing.description || 'No description provided.'}</p>
                    </div>
                    <div class="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                            ${listing.owner_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Owned by</p>
                            <p class="font-semibold text-gray-900">${listing.owner_name}</p>
                        </div>
                    </div>
                </div>
                
                <div class="lg:col-span-1">
                    <div class="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-6">
                        <div class="mb-6">
                            <span class="text-3xl font-bold text-gray-900">${fmtINR(listing.price_per_day)}</span>
                            <span class="text-gray-500">/day</span>
                        </div>
                        
                        ${isOwner ? `
                            <div class="bg-blue-50 text-blue-800 p-4 rounded-xl mb-4 text-center font-medium">
                                This is your listing.
                            </div>
                        ` : `
                            <form id="booking-form" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input type="date" id="start_date" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" min="${todayISO()}" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input type="date" id="end_date" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" min="${todayISO()}" />
                                </div>
                                
                                <div class="border-t border-gray-200 pt-4 pb-2">
                                    <div class="flex justify-between text-gray-900 font-bold text-lg">
                                        <span>Total</span>
                                        <span id="total-price">₹0</span>
                                    </div>
                                </div>
                                
                                <div id="booking-error" class="hidden bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100"></div>
                                <div id="booking-success" class="hidden bg-green-50 text-green-600 p-3 rounded-lg text-sm border border-green-100">Booking confirmed successfully! Redirecting...</div>
                                
                                <button type="submit" id="book-btn" class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow hover:shadow-lg">
                                    Reserve
                                </button>
                            </form>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        if (!isOwner) {
            const form = document.getElementById('booking-form');
            const startInput = document.getElementById('start_date');
            const endInput = document.getElementById('end_date');
            const totalEl = document.getElementById('total-price');
            const errEl = document.getElementById('booking-error');
            const sucEl = document.getElementById('booking-success');
            const btn = document.getElementById('book-btn');
            
            function updateTotal() {
                if (startInput.value && endInput.value) {
                    const days = daysBetween(startInput.value, endInput.value);
                    if (new Date(endInput.value) < new Date(startInput.value)) {
                        totalEl.innerText = 'Invalid dates';
                        btn.disabled = true;
                    } else {
                        totalEl.innerText = fmtINR(days * listing.price_per_day);
                        btn.disabled = false;
                    }
                }
            }
            
            startInput.addEventListener('change', () => {
                endInput.min = startInput.value;
                if(endInput.value && endInput.value < startInput.value) endInput.value = startInput.value;
                updateTotal();
            });
            endInput.addEventListener('change', updateTotal);
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!Auth.isLoggedIn()) {
                    window.location.href = '/login.html';
                    return;
                }
                
                errEl.classList.add('hidden');
                btn.disabled = true;
                btn.innerHTML = 'Reserving...';
                
                try {
                    await api('/bookings', {
                        method: 'POST',
                        body: {
                            listing_id: id,
                            start_date: startInput.value,
                            end_date: endInput.value
                        }
                    });
                    
                    form.reset();
                    sucEl.classList.remove('hidden');
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1500);
                } catch(err) {
                    errEl.innerText = err.message;
                    errEl.classList.remove('hidden');
                    btn.disabled = false;
                    btn.innerHTML = 'Reserve';
                }
            });
        }
        
    } catch(err) {
        container.innerHTML = `<p class="text-center p-10 text-red-500">Error loading listing: ${err.message}</p>`;
    }
}
