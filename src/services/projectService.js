import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    updateDoc,
    doc,
    arrayUnion
} from 'firebase/firestore';

const projectsRef = collection(db, 'projects');

const projectService = {
    async createProject({ name, description, ownerId }) {
        if (!ownerId) throw new Error('Missing owner');
        const payload = {
            name: name.trim(),
            description: description?.trim() || '',
            ownerId,
            memberIds: [ownerId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        const docRef = await addDoc(projectsRef, payload);
        return docRef.id;
    },

    async listProjectsForUser(uid) {
        if (!uid) return [];
        const q = query(
            projectsRef,
            where('memberIds', 'array-contains', uid)
        );
        const snap = await getDocs(q);
        const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        return items.sort((a, b) => {
            const aTime = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
            const bTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
            return bTime - aTime;
        });
    },

    async updateProject(projectId, updates) {
        const ref = doc(db, 'projects', projectId);
        await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    },

    /**
     * Adds a member to a project by searching for their email
     * Requires the user to already exist in our 'users' collection
     */
    async addMemberToProjectByEmail(projectId, email) {
        if (!email) throw new Error('Email is required');
        
        // 1. Find user by email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            throw new Error('User not found. They must sign up for AnyFileForge first.');
        }
        
        const newUserUid = snap.docs[0].id;
        const projectRef = doc(db, 'projects', projectId);
        
        // 2. Add to project's member list (using Firestore arrayUnion for safety)
        await updateDoc(projectRef, {
            memberIds: arrayUnion(newUserUid),
            updatedAt: serverTimestamp()
        });
        
        return snap.docs[0].data().displayName || email;
    }
};

export default projectService;
