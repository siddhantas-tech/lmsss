"use client";

import React, { createContext, useContext } from 'react';

export interface User {
    username?: string;
    labId?: string;
    role?: string;
}

const UserContext = createContext<User | null>(null);

export const useUser = () => useContext(UserContext);

export function UserProvider({
    user,
    children
}: {
    user: User | null;
    children: React.ReactNode
}) {
    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>
    );
}
