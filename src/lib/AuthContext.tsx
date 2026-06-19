import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import api from './supabaseClient';
import { AdminRole, DashboardStats } from './types';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    roles: AdminRole[];
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isTelecallingOwnerTeam: boolean;
    isMarketingTeam: boolean;
    isTelecallingTenantTeam: boolean;
    isSalesTeam: boolean;
    isAccountsTeam: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    dashboardStats: DashboardStats | null;
    statsLoading: boolean;
    statsError: string | null;
    refetchDashboardStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<AdminRole[]>([]);

    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    const userRef = useRef<User | null>(null);
    const rolesRef = useRef<AdminRole[]>([]);

    const performSignOut = useCallback(async () => {
        userRef.current = null;
        rolesRef.current = [];

        setRoles([]);
        setDashboardStats(null);
        setStatsError(null);
        setUser(null);
        setLoading(false);
        setStatsLoading(false);

        const { error } = await api.supabase.auth.signOut();

        if (error) {
            console.error('Error signing out:', error);
        }
    }, []);

    const fetchRole = useCallback(async (currentUser: User): Promise<AdminRole[] | null> => {
        if (!currentUser?.id) {
            setRoles([]);
            rolesRef.current = [];
            return null;
        }

        try {
            const { data: userRoles, error: rolesError } = await api.getMyAdminRoles();

            if (rolesError) {
                console.error('fetchRole: Error fetching roles:', rolesError);
                setRoles([]);
                rolesRef.current = [];
                await performSignOut();
                return null;
            }

            if (userRoles && userRoles.length > 0) {
                setRoles(userRoles);
                rolesRef.current = userRoles;
                return userRoles;
            }

            console.warn('User authenticated but has no active admin roles.');
            setRoles([]);
            rolesRef.current = [];
            await performSignOut();
            return null;
        } catch (err) {
            console.error('Exception fetching roles:', err);
            setRoles([]);
            rolesRef.current = [];
            await performSignOut();
            return null;
        }
    }, [performSignOut]);

    const fetchDashboardStats = useCallback(async () => {
        const currentUser = userRef.current;
        const currentRoles = rolesRef.current;

        if (!currentUser || currentRoles.length === 0) {
            setDashboardStats(null);
            return;
        }

        setStatsLoading(true);
        setStatsError(null);

        try {
            const { data, error: fetchError } = await api.getDashboardStatsAdmin();

            if (fetchError) throw fetchError;

            setDashboardStats(data);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to load Dashboard Stats';
            setStatsError(errMsg);
            setDashboardStats(null);
            console.error('Error loading dashboard stats:', errMsg);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const setupUserSession = async (currentUser: User | null) => {
            if (!isMounted) return;

            setLoading(true);

            userRef.current = currentUser;
            setUser(currentUser);

            if (!currentUser) {
                rolesRef.current = [];
                setRoles([]);
                setDashboardStats(null);
                setLoading(false);
                return;
            }

            try {
                const fetchedRoles = await fetchRole(currentUser);

                if (!isMounted) return;

                if (fetchedRoles && fetchedRoles.length > 0) {
                    await fetchDashboardStats();
                } else {
                    setDashboardStats(null);
                }
            } catch (e) {
                console.error('AuthContext: Error during role/stats fetch:', e);
                if (isMounted) {
                    setDashboardStats(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        api.supabase.auth.getSession()
            .then(({ data: { session } }) => {
                setupUserSession(session?.user ?? null);
            })
            .catch((err) => {
                console.error('AuthContext: Error during initial getSession:', err);
                if (isMounted) {
                    setLoading(false);
                }
            });

        const { data: { subscription } } = api.supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!isMounted) return;

                const currentUser = session?.user ?? null;
                const previousUserId = userRef.current?.id ?? null;
                const currentUserId = currentUser?.id ?? null;

                if (currentUserId !== previousUserId) {
                    await setupUserSession(currentUser);
                } else if (currentUser) {
                    userRef.current = currentUser;
                    setUser(currentUser);
                    setLoading(false);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [fetchRole, fetchDashboardStats]);

    const signInWithGoogle = async () => {
        setLoading(true);

        const { error } = await api.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });

        if (error) {
            console.error('Error initiating sign in with Google:', error);
            setLoading(false);
        }
    };

    const publicRefetchStats = useCallback(async () => {
        await fetchDashboardStats();
    }, [fetchDashboardStats]);

    const isAdmin = roles.length > 0;
    const isSuperAdmin = roles.includes('super-admin');
    const isTelecallingOwnerTeam = roles.includes('telecalling-owner-team');
    const isMarketingTeam = roles.includes('marketing-team');
    const isTelecallingTenantTeam = roles.includes('telecalling-tenant-team');
    const isSalesTeam = roles.includes('sales-team');
    const isAccountsTeam = roles.includes('accounts-team');

    const value: AuthContextValue = {
        user,
        loading,
        roles,
        isAdmin,
        isSuperAdmin,
        isTelecallingOwnerTeam,
        isMarketingTeam,
        isTelecallingTenantTeam,
        isSalesTeam,
        isAccountsTeam,
        signInWithGoogle,
        signOut: performSignOut,
        dashboardStats,
        statsLoading,
        statsError,
        refetchDashboardStats: publicRefetchStats,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}