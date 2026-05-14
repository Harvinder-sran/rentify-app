import { api, fmtINR } from './api.js';

export async function loadListings() {
    const grid = document.getElementById('listings-grid');
    const categorySelect = document.getElementById('category-filter');
    if (!grid) return;
    
    async function fetchAndRender() {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Loading...</div>';
        try {
            const cat = categorySelect.value;
            let url = '/listings';
            if (cat && cat !== 'All') {
                url += `?category=${encodeURIComponent(cat)}`;
            }
            const listings = await api(url);
            
            if (listings.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">No listings found.</div>';
                return;
            }
            
            grid.innerHTML = listings.map(l => `
                <a href="/listing.html?id=${l.id}" class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl smooth-transition hover-lift flex flex-col h-full border border-gray-100">
                    <div class="h-48 bg-gray-200 relative">
                        ${l.image_urls && l.image_urls.length > 0 
                            ? `<img src="${l.image_urls[0]}" class="w-full h-full object-cover" />` 
                            : `<div class="flex items-center justify-center h-full text-gray-400">No Image</div>`}
                        <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-indigo-700">
                            ${l.category}
                        </div>
                    </div>
                    <div class="p-5 flex-1 flex flex-col">
                        <h3 class="text-lg font-bold text-gray-900 mb-1 line-clamp-1">${l.title}</h3>
                        <p class="text-sm text-gray-500 mb-4 flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            ${l.owner_city}
                        </p>
                        <div class="mt-auto flex items-end justify-between">
                            <div>
                                <span class="text-xl font-bold text-indigo-600">${fmtINR(l.price_per_day)}</span>
                                <span class="text-sm text-gray-500">/day</span>
                            </div>
                        </div>
                    </div>
                </a>
            `).join('');
        } catch (err) {
            grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Error loading listings: ${err.message}</div>`;
        }
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', fetchAndRender);
    }
    
    fetchAndRender();
}
