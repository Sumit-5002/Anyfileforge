import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Service to handle user feedback and contact submissions
 */
const feedbackService = {
    /**
     * Submits user feedback to Firestore
     * @param {Object} feedbackData - { name, email, message }
     * @returns {Promise<string>} - ID of the created document
     */
    async submitFeedback(feedbackData) {
        try {
            const feedbackRef = collection(db, 'feedback');
            const docRef = await addDoc(feedbackRef, {
                ...feedbackData,
                createdAt: serverTimestamp(),
                processed: false
            });
            return docRef.id;
        } catch (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
    }
};

export default feedbackService;
