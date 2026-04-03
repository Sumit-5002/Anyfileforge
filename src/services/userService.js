import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Service to handle user profile and premium status
 */
const userService = {
    /**
     * Initializes or updates a user profile in Firestore
     * @param {Object} user - Firebase user object
     */
    async syncUserProfile(user) {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                tier: 'free',
                createdAt: new Date().toISOString()
            });
        } else {
            await updateDoc(userRef, {
                lastLogin: new Date().toISOString()
            });
        }
    },

    /**
     * Gets user data from Firestore
     * @param {string} uid - User ID
     * @returns {Promise<Object>} - User data
     */
    async getUserData(uid) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? userSnap.data() : null;
    },

    /**
     * Creates a new user profile with additional data (role, etc.)
     * @param {Object} user - Firebase user object
     * @param {Object} additionalData - Extra fields (role, institution)
     */
    async createUserProfile(user, additionalData = {}) {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            displayName: additionalData.name || user.displayName || '',
            email: user.email,
            photoURL: user.photoURL || '',
            role: additionalData.role || 'user',
            institution: additionalData.institution || '',
            fieldOfStudy: additionalData.fieldOfStudy || '',
            primaryLanguage: additionalData.primaryLanguage || '',
            tier: 'free',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });
    },

    /**
     * Upgrades a user tier
     * @param {string} uid - User ID
     * @param {string} tier - 'supporter', 'enterprise', etc.
     */
    async upgradeUserTier(uid, tier) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            tier: tier,
            premiumSince: new Date().toISOString()
        });
    },

    /**
     * Updates arbitrary user profile fields
     * @param {string} uid - User ID
     * @param {Object} data - Fields to update
     */
    async updateUserProfile(uid, data) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, data);
    },

    /**
     * Gets multiple user profiles by ID
     */
    async getUsersByIds(uids) {
        if (!uids || (Array.isArray(uids) && uids.length === 0)) return [];
        
        // Firestore 'in' query supports up to 30 IDs
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('__name__', 'in', uids.slice(0, 30)));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    }
};

export default userService;
