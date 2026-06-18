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

    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const performSignOut = useCallback(async () => {
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

    const fetchDashboardStats = useCallback(async () => {
        const currentUser = userRef.current;
        if (!currentUser) {
            setDashboardStats(null);
            return;
        };

        if (roles.length === 0) {
            const fetchedRoles = await fetchRole();
            if (!fetchedRoles || fetchedRoles.length === 0) {
                setDashboardStats(null);
                return;
            }
        }

        setStatsLoading(true);
        setStatsError(null);
        try {
            // if (roles.includes('super-admin')) {
            const { data, error: fetchError } = await api.getDashboardStatsAdmin();
            if (fetchError) throw fetchError;
            setDashboardStats(data);
            // }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to load Dashboard Stats';
            setStatsError(errMsg);
            setDashboardStats(null);
            console.error("Error loading dashboard stats:", errMsg);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchRole = useCallback(async (): Promise<AdminRole[] | null> => {
        const currentUser = userRef.current;
        if (!currentUser) {
            setRoles([]);
            return null;
        }
        try {
            const { data: adminData, error } = await api.getAdminByUserId(currentUser.id);
            if (error || !adminData) {
                console.error('fetchRole: No active admin record found or error', error);
                setRoles([]);
                await performSignOut();
                return null;
            }
            // adminData.roles is already AdminRole[]
            setRoles(adminData.roles);
            return adminData.roles;
        } catch (err) {
            console.error('Exception fetching admin data:', err);
            setRoles([]);
            await performSignOut();
            return null;
        }
    }, [performSignOut]);

    useEffect(() => {
        let isMounted = true;
        let initialSessionChecked = false;

        const setupUserSession = async (currentUser: User | null) => {
            if (!isMounted) return;

            setUser(currentUser);

            if (currentUser) {
                try {
                    const fetchedRoles = await fetchRole();
                    if (fetchedRoles && fetchedRoles.length > 0 && isMounted) {
                        await fetchDashboardStats();
                    } else if (isMounted) {
                        setDashboardStats(null);
                    }
                } catch (e) {
                    console.error("AuthContext: Error during role/stats fetch:", e);
                    if (isMounted) setDashboardStats(null);
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            } else {
                setRoles([]);
                setDashboardStats(null);
                setLoading(false);
            }
        };

        api.supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted && !initialSessionChecked) {
                initialSessionChecked = true;
                setupUserSession(session?.user ?? null);
            }
        }).catch(err => {
            if (isMounted && !initialSessionChecked) {
                console.error("AuthContext: Error during initial getSession:", err);
                initialSessionChecked = true;
                setLoading(false);
            }
        });

        const { data: { subscription } } = api.supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!isMounted) return;
                const currentUser = session?.user ?? null;
                const previousUserId = userRef.current?.id;


                if (currentUser?.id !== previousUserId || (!currentUser && previousUserId) || (currentUser && !previousUserId)) {
                    setLoading(true);
                    await setupUserSession(currentUser);
                } else if (currentUser && currentUser.id === previousUserId) {
                    setUser(currentUser);
                    if (loading) setLoading(false);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [fetchRole, fetchDashboardStats, performSignOut]);


    const signInWithGoogle = async () => {
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
    const isSuperAdmin = isAdmin && roles.includes('super-admin');
    const isTelecallingOwnerTeam = isAdmin && roles.includes('telecalling-owner-team');
    const isMarketingTeam = isAdmin && roles.includes('marketing-team');
    const isTelecallingTenantTeam = isAdmin && roles.includes('telecalling-tenant-team');
    const isSalesTeam = isAdmin && roles.includes('sales-team');
    const isAccountsTeam = isAdmin && roles.includes('accounts-team');


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