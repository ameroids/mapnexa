import { useState, useEffect, useRef } from 'react';
import { Download, Upload, RotateCcw, Trash2, AlertTriangle, ShieldCheck, Database, Sliders, Users, UserPlus, Shield, User, Key, Edit, Check, Lock } from 'lucide-react';
import { useSettings } from '../database/useData.js';
import { useAuth, ALL_PERMISSIONS } from '../context/AuthContext.jsx';
import { saveSettings, restoreDemo, clearAll } from '../database/repositories.js';
import { exportAll, validate, importAll } from '../utils/backup.js';
import { Head, Field, Confirm, useToast } from '../components/ui.jsx';

export default function Settings() {
  const cur = useSettings();
  const { users, currentUser, addUser, updateUser, deleteUser, isAdmin } = useAuth();
  const toast = useToast();
  const file = useRef();
  const [s, setS] = useState(cur);
  const [pre, setPre] = useState(null);
  const [mode, setMode] = useState('merge');
  const [ask, setAsk] = useState('');

  // User creation form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserPerms, setNewUserPerms] = useState({
    canAddVisit: true,
    canViewMap: true,
    canViewCompanies: true,
    canEditCompany: false,
    canDeleteCompany: false,
    canViewVisits: true,
    canEditVisit: false,
    canViewReports: false,
    canAccessSettings: false,
  });

  // User editing modal state
  const [editingUser, setEditingUser] = useState(null);
  const [delUserId, setDelUserId] = useState(null);

  useEffect(() => setS(cur), [cur.appName, cur.defaultVisitType, cur.defaultTravelMode]);

  const run = (fn, ok) => async () => {
    try {
      await fn();
      toast(ok);
    } catch (e) {
      toast('Failed: ' + (e.message || 'error'), 'err');
    }
    setAsk('');
  };

  const pick = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      const m = validate(d);
      if (m) return toast(m, 'err');
      setPre(d);
    } catch {
      toast('Could not read file: not valid JSON', 'err');
    }
  };

  const handleRoleChangeForNew = (role) => {
    setNewUserRole(role);
    if (role === 'admin') {
      const allOn = {};
      ALL_PERMISSIONS.forEach(p => { allOn[p.key] = true; });
      setNewUserPerms(allOn);
    } else {
      setNewUserPerms({
        canAddVisit: true,
        canViewMap: true,
        canViewCompanies: true,
        canEditCompany: false,
        canDeleteCompany: false,
        canViewVisits: true,
        canEditVisit: false,
        canViewReports: false,
        canAccessSettings: false,
      });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return toast('Please enter a user name', 'err');
    if (!newUserUsername.trim()) return toast('Please enter a username for login', 'err');
    if (!newUserPassword.trim()) return toast('Please enter a password', 'err');

    try {
      await addUser({
        name: newUserName,
        username: newUserUsername,
        password: newUserPassword,
        email: newUserEmail,
        role: newUserRole,
        permissions: newUserPerms,
      });
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserEmail('');
      setNewUserRole('user');
      setNewUserPerms({
        canAddVisit: true,
        canViewMap: true,
        canViewCompanies: true,
        canEditCompany: false,
        canDeleteCompany: false,
        canViewVisits: true,
        canEditVisit: false,
        canViewReports: false,
        canAccessSettings: false,
      });
      toast('New user credentials & permissions created successfully');
    } catch (err) {
      toast(err.message || 'Failed to create user', 'err');
    }
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.name.trim()) return toast('Name is required', 'err');
    if (!editingUser.username.trim()) return toast('Username is required', 'err');
    if (!editingUser.password.trim()) return toast('Password is required', 'err');

    try {
      await updateUser(editingUser.id, {
        name: editingUser.name,
        username: editingUser.username,
        password: editingUser.password,
        email: editingUser.email,
        role: editingUser.role,
        permissions: editingUser.permissions,
      });
      setEditingUser(null);
      toast('User updated successfully');
    } catch (err) {
      toast(err.message || 'Failed to update user', 'err');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Head title="System Preferences & Vault" sub="Application settings, database exports, and user accounts" />

      {/* User Management Section */}
      <div className="card p-6 space-y-6 bg-white border-2 border-indigo-100 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <Users size={20} />
            </span>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 font-display">User Accounts & Permissions</h3>
              <p className="text-xs text-slate-500 font-medium">
                Create user login credentials and configure specific permissions for each team member
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Admin Controlled
          </span>
        </div>

        {/* Create New User Form */}
        <form onSubmit={handleCreateUser} className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/20 border border-slate-200/90 space-y-4">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <UserPlus size={15} className="text-indigo-600" />
            <span>Create New User & Set Credentials</span>
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Full Name *
              </label>
              <input
                className="input bg-white text-xs font-medium"
                placeholder="e.g. Ramesh Patel"
                value={newUserName}
                onChange={(e) => {
                  setNewUserName(e.target.value);
                  if (!newUserUsername) {
                    setNewUserUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                  }
                }}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Login Username *
              </label>
              <input
                className="input bg-white text-xs font-mono font-medium"
                placeholder="e.g. ramesh"
                value={newUserUsername}
                onChange={(e) => setNewUserUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Login Password *
              </label>
              <input
                type="text"
                className="input bg-white text-xs font-mono font-medium"
                placeholder="Set password e.g. secret123"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Email Address (Optional)
              </label>
              <input
                className="input bg-white text-xs"
                placeholder="e.g. ramesh@factorytrack.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Role Preset
              </label>
              <select
                className="input bg-white text-xs font-semibold"
                value={newUserRole}
                onChange={(e) => handleRoleChangeForNew(e.target.value)}
              >
                <option value="user">Custom Field User (Select specific permissions below)</option>
                <option value="admin">Administrator (Full System Access)</option>
              </select>
            </div>
          </div>

          {/* Granular Permissions Checkboxes */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Assign Permissions for this user:
            </span>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 bg-white p-3.5 rounded-xl border border-slate-200">
              {ALL_PERMISSIONS.map((p) => {
                const checked = newUserRole === 'admin' ? true : Boolean(newUserPerms[p.key]);
                return (
                  <label
                    key={p.key}
                    className={`flex items-start gap-2 text-xs p-1.5 rounded-lg transition-colors cursor-pointer select-none ${
                      checked ? 'bg-indigo-50/60 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={newUserRole === 'admin'}
                      checked={checked}
                      onChange={(e) =>
                        setNewUserPerms({
                          ...newUserPerms,
                          [p.key]: e.target.checked,
                        })
                      }
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{p.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" className="btn btn-p shadow-glow-brand !py-2 !px-5 !text-xs font-bold">
              <UserPlus size={14} />
              <span>Save & Create User</span>
            </button>
          </div>
        </form>

        {/* Existing Users List */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            All Users & Configured Credentials ({users.length})
          </p>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
            {users.map((u) => {
              const isCurrent = u.id === currentUser?.id;
              const isPrimaryAdmin = u.id === 'user-admin';
              const activePermCount = Object.values(u.permissions || {}).filter(Boolean).length;

              return (
                <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-xs shrink-0 ${
                      u.role === 'admin'
                        ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500'
                        : 'bg-gradient-to-tr from-amber-500 to-orange-500'
                    }`}>
                      {u.avatarText || u.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{u.name}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Current Session
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                          u.role === 'admin'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {u.role === 'admin' ? 'Admin (All Perms)' : `${activePermCount} permissions`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>Username: <strong className="font-mono text-slate-700">{u.username || '—'}</strong></span>
                        <span>•</span>
                        <span>Password: <strong className="font-mono text-slate-700">{u.password || '••••••'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      className="btn !py-1.5 !px-3 !text-xs font-semibold"
                      title="Edit User & Permissions"
                      onClick={() => setEditingUser({ ...u, permissions: { ...u.permissions } })}
                    >
                      <Edit size={13} />
                      <span>Edit & Perms</span>
                    </button>

                    {!isPrimaryAdmin && (
                      <button
                        type="button"
                        className="btn btn-d !py-1.5 !px-2.5 !text-xs"
                        title="Delete User"
                        onClick={() => setDelUserId(u.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit User & Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Edit size={16} />
                </span>
                <h3 className="font-bold text-base text-slate-900">Edit User & Permissions</h3>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                onClick={() => setEditingUser(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Full Name *
                  </label>
                  <input
                    className="input bg-white text-xs font-medium"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Login Username *
                  </label>
                  <input
                    className="input bg-white text-xs font-mono font-medium"
                    value={editingUser.username || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Login Password *
                  </label>
                  <input
                    type="text"
                    className="input bg-white text-xs font-mono font-medium"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Email Address
                  </label>
                  <input
                    className="input bg-white text-xs"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Role
                  </label>
                  <select
                    className="input bg-white text-xs font-semibold"
                    disabled={editingUser.id === 'user-admin'}
                    value={editingUser.role}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      if (nextRole === 'admin') {
                        const allOn = {};
                        ALL_PERMISSIONS.forEach(p => { allOn[p.key] = true; });
                        setEditingUser({ ...editingUser, role: nextRole, permissions: allOn });
                      } else {
                        setEditingUser({ ...editingUser, role: nextRole });
                      }
                    }}
                  >
                    <option value="user">Field User (Custom Permissions)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              {/* Permissions list */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Allowed Permissions:
                </span>
                <div className="grid sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {ALL_PERMISSIONS.map((p) => {
                    const checked = editingUser.role === 'admin' ? true : Boolean(editingUser.permissions?.[p.key]);
                    return (
                      <label
                        key={p.key}
                        className={`flex items-start gap-2 text-xs p-1.5 rounded-lg transition-colors cursor-pointer select-none ${
                          checked ? 'bg-indigo-50/70 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={editingUser.role === 'admin'}
                          checked={checked}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              permissions: {
                                ...editingUser.permissions,
                                [p.key]: e.target.checked,
                              },
                            })
                          }
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  className="btn !py-2 !px-4 !text-xs font-bold"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-p shadow-glow-brand !py-2 !px-5 !text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {delUserId && (
        <Confirm
          title="Delete User Account?"
          text="This user will no longer be able to log into FactoryTrack. Recorded visits created by them will remain intact."
          onCancel={() => setDelUserId(null)}
          onOk={async () => {
            try {
              await deleteUser(delUserId);
              toast('User removed');
            } catch (err) {
              toast(err.message || 'Failed to remove user', 'err');
            }
            setDelUserId(null);
          }}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Application Preferences Card */}
        <div className="card p-6 space-y-4 bg-white">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sliders size={18} />
            </span>
            <h3 className="font-extrabold text-base text-slate-900 font-display">General Preferences</h3>
          </div>

          <Field label="Application Name">
            <input
              className="input bg-slate-50 focus:bg-white"
              value={s.appName}
              onChange={(e) => setS({ ...s, appName: e.target.value })}
            />
          </Field>

          <Field label="Default Visit Type">
            <select
              className="input bg-slate-50 focus:bg-white"
              value={s.defaultVisitType}
              onChange={(e) => setS({ ...s, defaultVisitType: e.target.value })}
            >
              {['First Visit', 'Follow-up Visit', 'Repeat Visit', 'Business Meeting', 'Other'].map(
                (t) => (
                  <option key={t}>{t}</option>
                )
              )}
            </select>
          </Field>

          <Field label="Default Travel Mode for Navigation">
            <select
              className="input bg-slate-50 focus:bg-white capitalize"
              value={s.defaultTravelMode}
              onChange={(e) => setS({ ...s, defaultTravelMode: e.target.value })}
            >
              {['driving', 'walking', 'bicycling', 'transit'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>

          <div className="pt-2">
            <button
              className="btn btn-p shadow-glow-brand"
              onClick={run(() => saveSettings(s), 'Preferences successfully saved')}
            >
              Save System Preferences
            </button>
          </div>
        </div>

        {/* Database Vault & Diagnostics */}
        <div className="card p-6 space-y-4 bg-white">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Database size={18} />
            </span>
            <h3 className="font-extrabold text-base text-slate-900 font-display">
              Browser Vault & Diagnostics
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Storage Architecture</p>
                <p className="text-[11px] text-slate-500">IndexedDB via Dexie.js (Zero latency)</p>
              </div>
              <span className="badge badge-indigo">Active</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Security & Isolation</p>
                <p className="text-[11px] text-slate-500">All data stored 100% locally on this device</p>
              </div>
              <ShieldCheck size={18} className="text-emerald-500" />
            </div>

            <div className="pt-2">
              <button
                className="btn btn-s w-full"
                onClick={run(restoreDemo, 'Demo factories and visits restored successfully')}
              >
                <RotateCcw size={14} />
                <span>Reload Default Demo Dataset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Portability Suite */}
      <div className="card p-6 space-y-5 bg-white">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Download size={18} />
          </span>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 font-display">
              Backup, Portability & Restore
            </h3>
            <p className="text-xs text-slate-500">
              Download your complete offline database as JSON or import an existing snapshot
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn btn-p !bg-emerald-600 hover:!bg-emerald-500"
            onClick={run(exportAll, 'Backup file generated & download started')}
          >
            <Download size={15} />
            <span>Download Full JSON Backup</span>
          </button>

          <button className="btn" onClick={() => file.current?.click()}>
            <Upload size={15} />
            <span>Import Database File</span>
          </button>
          <input
            ref={file}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={pick}
          />
        </div>

        {/* Import Preview Dialogue */}
        {pre && (
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-indigo-950 font-display">
                Backup Archive Verified
              </span>
              <span className="text-xs font-mono bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                {pre.version}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
                <span className="text-2xl font-black text-indigo-600 font-display block">
                  {pre.companies?.length || 0}
                </span>
                <span className="font-semibold text-slate-600">Company Profiles</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
                <span className="text-2xl font-black text-cyan-600 font-display block">
                  {pre.visits?.length || 0}
                </span>
                <span className="font-semibold text-slate-600">Visit Logs</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Select Merge Strategy
              </label>
              <div className="flex gap-4 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    value="merge"
                    checked={mode === 'merge'}
                    onChange={() => setMode('merge')}
                  />
                  <span>Merge (Retain existing, append new)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-rose-600">
                  <input
                    type="radio"
                    name="strategy"
                    value="replace"
                    checked={mode === 'replace'}
                    onChange={() => setMode('replace')}
                  />
                  <span>Replace (Wipe existing and replace)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button className="btn" onClick={() => setPre(null)}>
                Cancel
              </button>
              <button
                className="btn btn-p"
                onClick={run(async () => {
                  await importAll(pre, mode);
                  setPre(null);
                }, 'Database restored successfully')}
              >
                Confirm & Restore
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-rose-200 bg-rose-50/20 space-y-3">
        <div className="flex items-center gap-2 pb-2">
          <AlertTriangle size={18} className="text-rose-600" />
          <h3 className="font-extrabold text-base text-rose-900 font-display">Danger Zone</h3>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed">
          Resetting the database permanently purges all companies, visit notes, coordinates, and custom
          configurations from your browser vault.
        </p>
        <div>
          <button className="btn btn-d" onClick={() => setAsk('clear')}>
            <Trash2 size={14} />
            <span>Purge All FactoryTrack Data</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Dialogue */}
      {ask === 'clear' && (
        <Confirm
          title="Permanently Purge All Data?"
          text="This action is irreversible. All local database records will be erased completely."
          onCancel={() => setAsk('')}
          onOk={run(clearAll, 'Database erased successfully')}
        />
      )}
    </div>
  );
}

