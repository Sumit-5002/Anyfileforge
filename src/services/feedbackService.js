import { db } from '../config/firebase';
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
    async submitFeedback({ name, email, message }) {
        // Validation to prevent runtime errors if fields are missing or not strings
        if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
            throw new Error('Invalid feedback data: all fields must be strings');
        }

        try {
            const feedbackRef = collection(db, 'feedback');
            const docRef = await addDoc(feedbackRef, {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                message: message.trim(),
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
