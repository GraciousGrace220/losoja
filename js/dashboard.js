/**
 * LosOja - User Dashboard
 */

const Dashboard = {
    init() {
        this.bindNav();
    },

    bindNav() {
        document.getElementById('dashboardNavLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.show();
        });
    },

    show() {
        const mainSections = document.querySelectorAll('main > .section, main > .hero, main > .business-cta');
        mainSections.forEach(s => s.classList.add('hidden'));

        const dash = document.getElementById('dashboard');
        if (dash) {
            dash.classList.remove('hidden');
            dash.scrollIntoView({ behavior: 'smooth' });
        }
        this.render();
    },

    hide() {
        const dash = document.getElementById('dashboard');
        if (dash) dash.classList.add('hidden');

        document.querySelectorAll('main > .section, main > .hero, main > .business-cta').forEach(s => {
            s.classList.remove('hidden');
        });
    },

    render() {
        const user = Auth.getCurrentUser();
        const listEl = document.getElementById('dashboardBusinesses');
        const emptyEl = document.getElementById('dashboardEmpty');
        if (!listEl) return;

        if (!user) {
            listEl.innerHTML = '';
            emptyEl?.classList.remove('hidden');
            return;
        }

        const businesses = Businesses.getByOwner(user.id);

        if (businesses.length === 0) {
            listEl.innerHTML = '';
            emptyEl?.classList.remove('hidden');
            return;
        }

        emptyEl?.classList.add('hidden');

        listEl.innerHTML = businesses.map(b => {
            const { avg, count } = Businesses.getAverageRating(b.id);
            const ratingText = count > 0 ? `⭐ ${avg.toFixed(1)} (${count})` : 'No reviews';
            const imgStyle = b.image ? `style="background-image:url('${b.image}')"` : '';

            return `
                <div class="dashboard-item" data-id="${b.id}">
                    <div class="dashboard-item-image" ${imgStyle}>
                        ${b.image ? '' : App.escapeHtml(b.category)}
                    </div>
                    <div class="dashboard-item-body">
                        <h3>${App.escapeHtml(b.name)}</h3>
                        <div class="dashboard-item-meta">
                            <span>${App.escapeHtml(b.category)}</span>
                            <span>📍 ${App.escapeHtml(b.location)}</span>
                            <span>${ratingText}</span>
                        </div>
                        <p class="dashboard-item-desc">${App.escapeHtml(b.description || '')}</p>
                    </div>
                    <div class="dashboard-item-actions">
                        <button type="button" class="btn btn-outline edit-btn" data-id="${b.id}">Edit</button>
                        <button type="button" class="btn btn-danger delete-btn" data-id="${b.id}">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        listEl.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                Businesses.openEditModal(btn.dataset.id);
            });
        });

        listEl.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const business = Businesses.getById(id);
                if (!business) return;
                if (confirm(`Delete "${business.name}"? This cannot be undone.`)) {
                    Businesses.remove(id);
                    this.render();
                    Businesses.render();
                    App.showToast('Business deleted.');
                }
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});
