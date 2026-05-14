import { api, Auth } from './api.js';

export function wireNewListing() {
    const form = document.getElementById('new-listing-form');
    if (!form) return;
    
    Auth.requireOrRedirect();
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        const errEl = document.getElementById('form-error');
        errEl.classList.add('hidden');
        btn.disabled = true;
        btn.innerHTML = 'Creating...';
        
        try {
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const category = document.getElementById('category').value;
            const price = parseFloat(document.getElementById('price').value);
            const fileInput = document.getElementById('images');
            const files = fileInput.files;
            
            const imageUrls = [];
            
            // Upload files sequentially
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                btn.innerHTML = `Uploading image ${i + 1}/${files.length}...`;
                
                // Get signed URL
                const { upload_url, public_url } = await api('/uploads/signed-url', {
                    method: 'POST',
                    body: { filename: file.name, content_type: file.type }
                });
                
                // PUT directly to Supabase storage
                const res = await fetch(upload_url, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type }
                });
                
                if (!res.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }
                
                imageUrls.push(public_url);
            }
            
            btn.innerHTML = 'Saving listing...';
            
            // Create listing
            await api('/listings', {
                method: 'POST',
                body: {
                    title,
                    description,
                    category,
                    price_per_day: price,
                    image_urls: imageUrls
                }
            });
            
            window.location.href = '/dashboard.html';
        } catch(err) {
            errEl.innerText = err.message;
            errEl.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = 'Create Listing';
        }
    });
}
