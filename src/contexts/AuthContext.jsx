import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import {
    onAuthStateChanged,
    signInAnonymously,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import userService from '../services/userService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let unsubscribeSnapshot = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (!isMounted) return;

            // Clean up previous snapshot listener
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }

            if (firebaseUser) {
                setUser(firebaseUser);

                // Listen for Firestore profile changes in real-time
                const userRef = doc(db, 'users', firebaseUser.uid);
                unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
                    if (isMounted && docSnap.exists()) {
                        setUserData(docSnap.data());
                    }
                }, (error) => {
                    console.error('Firestore snapshot error:', error);
                });

                // Periodic check for profile presence (sync once)
                (async () => {
                    try {
                        await userService.syncUserProfile(firebaseUser);
                    } catch (error) {
                        console.error('Auth profile sync error:', error);
                    }
                })();
                
                setLoading(false);
            } else {
                setUser(null);
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    const loginWithEmail = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signupWithEmail = async (email, password, additionalData = {}) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await userService.createUserProfile(result.user, additionalData);
        return result;
    };

    const loginWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const loginWithGitHub = () => {
        const provider = new GithubAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const loginAnonymously = async () => {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error('Auth error:', error);
        }
    };

    const resetPassword = (email) => {
        return sendPasswordResetEmail(auth, email);
    };

    const logout = () => signOut(auth);

    const value = {
        user,
        userData,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginWithGitHub,
        loginAnonymously,
        resetPassword,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
