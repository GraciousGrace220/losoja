/**
 * LosOja - Reviews system
 */

const Reviews = {
    STORAGE_KEY: 'losoja_reviews',

    init() {
        // No global binding needed; rendered on demand
    },

    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    },

    saveAll(list) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    },

    getForBusiness(businessId) {
        return this.getAll()
            .filter(r => r.businessId === businessId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getStats(businessId) {
        const reviews = this.getForBusiness(businessId);
        if (reviews.length === 0) return { avg: 0, count: 0 };
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return {
            avg: sum / reviews.length,
            count: reviews.length
        };
    },

    add({ businessId, rating, text }) {
        const user = Auth.getCurrentUser();
        if (!user) return { success: false, message: 'Please login to leave a review.' };
        if (!rating || rating < 1 || rating > 5) {
            return { success: false, message: 'Please select a rating.' };
        }

        const list = this.getAll();
        const already = list.find(r => r.businessId === businessId && r.userId === user.id);
        if (already) {
            return { success: false, message: 'You have already reviewed this business.' };
        }

        const review = {
            id: App.generateId(),
            businessId,
            userId: user.id,
            userName: user.name,
            rating: Number(rating),
            text: (text || '').trim(),
            createdAt: new Date().toISOString()
        };
        list.push(review);
        this.saveAll(list);
        return { success: true, review };
    },

    renderForBusiness(businessId) {
        const section = document.getElementById('reviewsSection');
        if (!section) return;

        const reviews = this.getForBusiness(businessId);
        const isLoggedIn = Auth.isLoggedIn();

        let formHtml = '';
        if (isLoggedIn) {
            formHtml = `
                <form class="review-form" id="reviewForm">
                    <div class="star-rating" id="starRating">
                        <button type="button" data-value="1">★</button>
                        <button type="button" data-value="2">★</button>
                        <button type="button" data-value="3">★</button>
                        <button type="button" data-value="4">★</button>
                        <button type="button" data-value="5">★</button>
                    </div>
                    <textarea id="reviewText" placeholder="Share your experience (optional)..." rows="3"></textarea>
                    <p id="reviewError" class="form-error hidden"></p>
                    <button type="submit" class="btn btn-primary">Submit Review</button>
                </form>
            `;
        } else {
            formHtml = `
                <p style="margin-bottom:1rem;color:var(--text-muted);font-size:0.9rem;">
                    <button type="button" class="btn btn-outline" id="loginToReview">Login</button>
                    to leave a review.
                </p>
            `;
        }

        const listHtml = reviews.length
            ? reviews.map(r => `
                <div class="review-item">
                    <div class="review-header">
                        <span class="reviewer">${App.escapeHtml(r.userName)}</span>
                        <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    ${r.text ? `<p class="review-text">${App.escapeHtml(r.text)}</p>` : ''}
                    <div class="review-date">${App.formatDate(r.createdAt)}</div>
                </div>
            `).join('')
            : '<p style="color:var(--text-muted);font-size:0.9rem;">No reviews yet. Be the first!</p>';

        section.innerHTML = `
            <h3>Reviews (${reviews.length})</h3>
            ${formHtml}
            <div class="review-list">${listHtml}</div>
        `;

        if (isLoggedIn) {
            let selectedRating = 0;
            const stars = section.querySelectorAll('#starRating button');
            stars.forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedRating = Number(btn.dataset.value);
                    stars.forEach(s => {
                        s.classList.toggle('active', Number(s.dataset.value) <= selectedRating);
                    });
                });
            });

            section.querySelector('#reviewForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const text = section.querySelector('#reviewText')?.value || '';
                const errorEl = section.querySelector('#reviewError');
                const result = this.add({ businessId, rating: selectedRating, text });

                if (!result.success) {
                    if (errorEl) {
                        errorEl.textContent = result.message;
                        errorEl.classList.remove('hidden');
                    }
                    return;
                }
                App.showToast('Review submitted!');
                this.renderForBusiness(businessId);
                if (typeof Businesses !== 'undefined') {
                    Businesses.render();
                }
            });
        } else {
            section.querySelector('#loginToReview')?.addEventListener('click', () => {
                App.closeModal('businessModal');
                App.openModal('loginModal');
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Reviews.init();
});
