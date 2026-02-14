import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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
     * Upgrades a user to premium (Mock for demo)
     * ⚠️ SECURITY NOTE: This is insecure as it's called from the client.
     * In a production app, this should only be done via a secure backend
     * (e.g., Firebase Cloud Functions) after payment verification.
     * @param {string} uid - User ID
     */
    async upgradeToPremium(uid) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            tier: 'premium',
            premiumSince: new Date().toISOString()
        });
    }
};

export default userService;
