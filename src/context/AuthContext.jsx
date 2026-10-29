import { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db.js';
import { supabase } from '../database/supabaseClient.js';

const AuthContext = createContext(null);

export const ALL_PERMISSIONS = [
  { key: 'canAddVisit', label: 'Add New Factory Visits' },
  { key: 'canViewMap', label: 'Interactive Map & GPS Navigation' },
  { key: 'canViewCompanies', label: 'View Companies Directory' },
  { key: 'canEditCompany', label: 'Edit Company Profiles' },
  { key: 'canDeleteCompany', label: 'Delete Companies' },
  { key: 'canViewVisits', label: 'View Logged Visits History' },
  { key: 'canEditVisit', label: 'Edit & Delete Visits' },
  { key: 'canViewReports', label: 'View Reports & CSV Exports' },
  { key: 'canAccessSettings', label: 'Settings & User Management' },
];

export const DEFAULT_ADMIN = {
  id: 'user-admin',
  name: 'Admin Manager',
  username: 'admin',
  password: 'admin123',
  email: 'admin@factorytrack.com',
  role: 'admin',
  avatarText: 'AD',
  permissions: {
    canAddVisit: true,
    canViewMap: true,
    canViewCompanies: true,
    canEditCompany: true,
    canDeleteCompany: true,
    canViewVisits: true,
    canEditVisit: true,
    canViewReports: true,
    canAccessSettings: true,
  },
  createdAt: new Date().toISOString(),
};

export const DEFAULT_USER = {
  id: 'user-field',
  name: 'Field Executive',
  username: 'field',
  password: 'field123',
  email: 'field@factorytrack.com',
  role: 'user',
  avatarText: 'FE',
  permissions: {
    canAddVisit: true,
    canViewMap: true,
    canViewCompanies: true,
    canEditCompany: false,
    canDeleteCompany: false,
    canViewVisits: true,
    canEditVisit: false,
    canViewReports: false,
    canAccessSettings: false,
  },
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }) {
  const users = useLiveQuery(() => db.users?.toArray(), []) || [];
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ft_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Seed and fetch users from Supabase / DB
  useEffect(() => {
    const initUsers = async () => {
      if (!db.users) return;

      // 1. Fetch latest users from Supabase
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data?.length > 0) {
          await db.users.bulkPut(data);
        }
      } catch (e) {
        console.warn('Could not sync users from Supabase:', e);
      }

      const count = await db.users.count();
      if (count === 0) {
        await db.users.bulkPut([DEFAULT_ADMIN, DEFAULT_USER]);
        try {
          await supabase.from('users').upsert([DEFAULT_ADMIN, DEFAULT_USER]);
        } catch (e) {}
      } else {
        // Upgrade existing records if username/password/permissions missing
        const existing = await db.users.toArray();
        for (const u of existing) {
          let updated = false;
          if (!u.username) {
            u.username = u.role === 'admin' ? 'admin' : (u.name || 'user').toLowerCase().replace(/\s+/g, '');
            updated = true;
          }
          if (!u.password) {
            u.password = u.role === 'admin' ? 'admin123' : 'user123';
            updated = true;
          }
          if (!u.permissions) {
            u.permissions = u.role === 'admin' ? DEFAULT_ADMIN.permissions : DEFAULT_USER.permissions;
            updated = true;
          }
          if (updated) {
            await db.users.put(u);
            try {
              await supabase.from('users').upsert(u);
            } catch (e) {}
          }
        }
      }
    };
    initUsers();
  }, []);

  // Sync active user if updated in DB
  useEffect(() => {
    if (users.length && currentUser) {
      const matched = users.find((u) => u.id === currentUser.id);
      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem('ft_active_user', JSON.stringify(matched));
      }
    }
  }, [users]);

  const switchUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('ft_active_user', JSON.stringify(user));
  };

  const loginWithCredentials = async (username, password) => {
    const uList = users.length ? users : await db.users.toArray();
    const matched = uList.find(
      (u) =>
        (u.username?.toLowerCase() === username.trim().toLowerCase() ||
          u.email?.toLowerCase() === username.trim().toLowerCase()) &&
        u.password === password
    );
    if (!matched) {
      throw new Error('Invalid username or password');
    }
    switchUser(matched);
    return matched;
  };

  const addUser = async ({
    name,
    username,
    password,
    email = '',
    role = 'user',
    permissions = {},
  }) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('User name is required');
    const uName = (username || trimmed.toLowerCase().replace(/\s+/g, '')).trim();
    if (!uName) throw new Error('Username is required');

    // Check duplicate username
    const exists = users.find((u) => u.username?.toLowerCase() === uName.toLowerCase());
    if (exists) throw new Error(`Username "${uName}" is already taken`);

    const initials = trimmed
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'U';

    const defaultPerms = role === 'admin' ? DEFAULT_ADMIN.permissions : DEFAULT_USER.permissions;

    const newUser = {
      id: 'user-' + Date.now() + Math.random().toString(16).slice(2, 6),
      name: trimmed,
      username: uName,
      password: password || '123456',
      email: email.trim() || `${uName}@factorytrack.com`,
      role,
      avatarText: initials,
      permissions: { ...defaultPerms, ...permissions },
      createdAt: new Date().toISOString(),
    };

    await db.users.put(newUser);
    try {
      await supabase.from('users').upsert(newUser);
    } catch (e) {
      console.warn('Failed to sync new user to Supabase:', e);
    }
    return newUser;
  };

  const updateUser = async (id, patch) => {
    const target = users.find((u) => u.id === id);
    if (!target) throw new Error('User not found');

    if (patch.name) {
      patch.avatarText = patch.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('') || target.avatarText;
    }

    const updated = { ...target, ...patch, updatedAt: new Date().toISOString() };
    await db.users.put(updated);
    try {
      await supabase.from('users').upsert(updated);
    } catch (e) {
      console.warn('Failed to sync updated user to Supabase:', e);
    }
    if (currentUser?.id === id) {
      switchUser(updated);
    }
    return updated;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ft_active_user');
  };

  const deleteUser = async (id) => {
    if (id === 'user-admin') throw new Error('Cannot delete primary Admin account');
    if (currentUser?.id === id) {
      logout();
    }
    await db.users.delete(id);
    try {
      await supabase.from('users').delete().eq('id', id);
    } catch (e) {
      console.warn('Failed to delete user on Supabase:', e);
    }
  };

  const isAuthenticated = Boolean(currentUser);
  const isAdmin = currentUser?.role === 'admin';

  // Permission helper
  const hasPermission = (permKey) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    return Boolean(currentUser?.permissions?.[permKey]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users: users.length ? users : [DEFAULT_ADMIN, DEFAULT_USER],
        switchUser,
        loginWithCredentials,
        logout,
        addUser,
        updateUser,
        deleteUser,
        isAuthenticated,
        isAdmin,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
