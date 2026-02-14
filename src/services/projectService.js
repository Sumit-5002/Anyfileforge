import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    updateDoc,
    doc
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
    }
};

export default projectService;
