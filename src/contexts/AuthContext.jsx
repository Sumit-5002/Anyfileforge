import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import {
    onAuthStateChanged,
    signInAnonymously,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import userService from '../services/userService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (!isMounted) return;

            if (firebaseUser) {
                setUser(firebaseUser);
                setUserData(null);
                setLoading(false);

                // Do profile sync in background so first paint is not blocked by network calls.
                (async () => {
                    try {
                        await userService.syncUserProfile(firebaseUser);
                        const data = await userService.getUserData(firebaseUser.uid);
                        if (isMounted) setUserData(data);
                    } catch (error) {
                        console.error('Auth profile sync error:', error);
                    }
                })();
            } else {
                setUser(null);
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const loginWithEmail = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signupWithEmail = async (email, password, additionalData = {}) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // We'll sync the role/etc via userService in the effect or directly here
        // Ideally userService handles profile creation.
        await userService.createUserProfile(result.user, additionalData);
        return result;
    };

    const loginWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const loginAnonymously = async () => {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error('Auth error:', error);
        }
    };

    const logout = () => signOut(auth);

    const value = {
        user,
        userData,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginAnonymously,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
