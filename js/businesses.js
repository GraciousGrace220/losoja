/**
 * LosOja - Businesses management & search
 */

const Businesses = {
    STORAGE_KEY: 'losoja_businesses',

    // Seed data for first visit
    SEED: [
        {
            id: 'default-1',
            name: 'Taste Haven',
            category: 'Food',
            location: 'Lagos, Nigeria',
            description: 'Delicious Nigerian and international meals. From jollof rice to grilled fish — we serve comfort food with a modern twist.',
            phone: '+234 801 234 5678',
            email: 'hello@tastehaven.ng',
            image: null,
            ownerId: null,
            createdAt: '2025-01-10T10:00:00.000Z'
        },
        {
            id: 'default-2',
            name: 'Urban Style',
            category: 'Fashion',
            location: 'Lagos, Nigeria',
            description: 'Modern fashion and clothing for the contemporary Nigerian. Ready-to-wear and custom tailoring available.',
            phone: '+234 802 345 6789',
            email: 'info@urbanstyle.ng',
            image: null,
            ownerId: null,
            createdAt: '2025-01-12T10:00:00.000Z'
        },
        {
            id: 'default-3',
            name: 'Tech Hub Nigeria',
            category: 'Technology',
            location: 'Abuja, Nigeria',
            description: 'Technology products and services. Laptops, accessories, repairs, and IT consulting for individuals and businesses.',
            phone: '+234 803 456 7890',
            email: 'support@techhub.ng',
            image: null,
            ownerId: null,
            createdAt: '2025-01-15T10:00:00.000Z'
        },
        {
            id: 'default-4',
            name: 'Glow Beauty Studio',
            category: 'Beauty',
            location: 'Lagos, Nigeria',
            description: 'Beauty and personal care services. Hair, nails, skincare and makeup by experienced professionals.',
            phone: '+234 804 567 8901',
            email: 'book@glowbeauty.ng',
            image: null,
            ownerId: null,
            createdAt: '2025-01-18T10:00:00.000Z'
        },
        {
            id: 'default-5',
            name: 'Healthy Living Clinic',
            category: 'Health',
            location: 'Port Harcourt, Nigeria',
            description: 'General practice clinic offering consultations, lab tests and wellness programs for the whole family.',
            phone: '+234 805 678 9012',
            email: 'care@healthyliving.ng',
            image: null,
            ownerId: null,
            createdAt: '2025-02-01T10:00:00.000Z'
        },
        {
            id: 'default-6',
            name: 'Bright Minds Academy',
            category: 'Education',
            location: 'Ibadan, Nigeria',
            description: 'After-school tutoring and exam preparation for WAEC, JAMB and common entrance.',
            phone: '+234 806 789 0123',
            email: 'admin@brightminds.ng',
            image: null,
            ownerId: null,
            createdAt: '2025-02-05T10:00:00.000Z'
        }
    ],

    // Temporary image data URL while form is open
    _pendingImage: null,
    _pendingEditImage: null,

    init() {
        this.ensureSeed();
        this.bindEvents();
        this.render();
    },

    ensureSeed() {
        const existing = this.getAll();
        if (existing.length === 0) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.SEED));
        }
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

    getById(id) {
        return this.getAll().find(b => b.id === id) || null;
    },

    getByOwner(ownerId) {
        return this.getAll().filter(b => b.ownerId === ownerId);
    },

    add(data) {
        const list = this.getAll();
        const business = {
            id: App.generateId(),
            name: data.name.trim(),
            category: data.category,
            location: data.location.trim(),
            description: (data.description || '').trim(),
            phone: (data.phone || '').trim(),
            email: (data.email || '').trim(),
            image: data.image || null,
            ownerId: Auth.getCurrentUser()?.id 
