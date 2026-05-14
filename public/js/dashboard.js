import { api, Auth, fmtINR, fmtDate } from './api.js';

export async function loadDashboard() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;
    
    Auth.requireOrRedirect();
    
    try {
        const [me, myBookings, myListings] = await Promise.all([
            api('/auth/me'),
            api('/bookings/me'),
            api('/listings/mine/all')
        ]);
        
        document.getElementById('welcome-name').innerText = me.display_name;
        
        // Render My Listings
        const mlContainer = document.getElementById('my-listings');
        if (myListings.length === 0) {
            mlContainer.innerHTML = '<p class="text-gray-500">You have not created any listings yet.</p>';
        } else {
            mlContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${myListings.map(l => `
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${!l.is_active ? 'opacity-60 grayscale' : ''}">
                            <div class="h-32 bg-gray-200">
                                ${l.image_urls?.length > 0 ? `<img src="${l.image_urls[0]}" class="w-full h-full object-cover" />` : ''}
                            </div>
                            <div class="p-4 flex-1 flex flex-col">
                                <h4 class="font-bold text-gray-900 mb-1">${l.title}</h4>
                                <p class="text-indigo-600 font-semibold text-sm mb-4">${fmtINR(l.price_per_day)}/day</p>
                                <div class="mt-auto flex justify-between">
                                    <span class="text-xs px-2 py-1 rounded-full ${l.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                        ${l.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    ${l.is_active ? `
                                        <button class="text-red-500 hover:text-red-700 text-sm font-medium delete-listing-btn" data-id="${l.id}">Delete</button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            document.querySelectorAll('.delete-listing-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this listing?')) {
                        try {
                            await api(`/listings/${id}`, { method: 'DELETE' });
                            window.location.reload();
                        } catch(err) {
                            alert(err.message);
                        }
                    }
                });
            });
        }
        
        // Render Bookings
        function renderBookingSet(elId, title, bookings, showCancel) {
            const el = document.getElementById(elId);
            if (!el) return;
            if (bookings.length === 0) {
                el.innerHTML = `<p class="text-gray-500 italic text-sm">No ${title.toLowerCase()} rentals.</p>`;
                return;
            }
            
            el.innerHTML = `
                <div class="space-y-4 mt-2">
                    ${bookings.map(b => `
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                ${b.listing_image ? `<img src="${b.listing_image}" class="w-full h-full object-cover" />` : ''}
                            </div>
                            <div class="flex-1">
                                <h4 class="font-bold text-gray-900">${b.listing_title}</h4>
                                <p class="text-sm text-gray-500">${fmtDate(b.start_date)} — ${fmtDate(b.end_date)}</p>
                                <p class="text-indigo-600 font-semibold text-sm mt-1">Total: ${fmtINR(b.total_price)}</p>
                            </div>
                            ${showCancel ? `
                                <button class="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition cancel-booking-btn" data-id="${b.id}">Cancel</button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        renderBookingSet('bookings-current', 'Current', myBookings.current, false);
        renderBookingSet('bookings-scheduled', 'Scheduled', myBookings.scheduled, true);
        renderBookingSet('bookings-past', 'Past', myBookings.past, false);
        renderBookingSet('bookings-cancelled', 'Cancelled', myBookings.cancelled, false);
        
        document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Are you sure you want to cancel this booking?')) {
                    try {
                        await api(`/bookings/${id}/cancel`, { method: 'POST' });
                        window.location.reload();
                    } catch(err) {
                        alert(err.message);
                    }
                }
            });
        });
        
    } catch(err) {
        container.innerHTML = `<p class="text-red-500">Error loading dashboard: ${err.message}</p>`;
    }
}
