import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  MapPinned,
  BellRing,
  BarChart3,
  Settings as Cog,
  Search,
  Plus,
  Menu,
  Factory,
  Bell,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Command,
  ChevronDown,
  Check,
  LogOut
} from 'lucide-react';
import { useData, useSettings } from '../database/useData.js';
import { useAuth } from '../context/AuthContext.jsx';

export const Logo = ({ name }) => (
  <div className="flex items-center gap-3">
    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-glow-brand group">
      <div className="w-full h-full bg-[#131B2E] rounded-[10px] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 group-hover:opacity-100 opacity-60 transition-opacity" />
        <Factory size={19} className="text-white relative z-10" />
        <span className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#131B2E] animate-pulse" />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5 font-display">
        {name}
        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          PRO
        </span>
      </span>
      <span className="text-[11px] text-slate-400 font-medium">Factory Intelligence</span>
    </div>
  </div>
);

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const { appName } = useSettings();
  const { currentUser, users, switchUser, loginWithCredentials, logout, isAdmin, hasPermission } = useAuth();

  const navItems = [
    ['/', 'Dashboard', LayoutDashboard, true],
    ['/companies', 'All Companies', Building2, hasPermission('canViewCompanies')],
    ['/visits', 'Factory Visits', ClipboardList, hasPermission('canViewVisits')],
    ['/map', 'Map & Navigation', MapPinned, hasPermission('canViewMap')],
    ['/reports', 'Reports', BarChart3, hasPermission('canViewReports')],
    ['/settings', 'Settings', Cog, hasPermission('canAccessSettings')],
  ].filter((item) => item[3]);

  return (
    <div className="min-h-screen lg:flex bg-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-72 shrink-0 bg-[#0B0F19] text-white flex flex-col border-r border-slate-800 transition-transform duration-300 ease-out shadow-2xl lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-indigo-500/15 to-transparent blur-2xl pointer-events-none" />

        {/* Sidebar Header */}
        <div className="h-20 px-6 flex items-center border-b border-slate-800/70 relative z-10">
          <Logo name={appName} />
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto relative z-10">
          <p className="px-3 pt-3 pb-2 text-[10px] font-extrabold tracking-widest text-slate-400/80 uppercase font-mono">
            Navigation Menu {isAdmin ? '(Admin)' : '(Field User)'}
          </p>
          {navItems.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/25 via-indigo-500/15 to-transparent text-white border-l-[3px] border-indigo-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05] hover:translate-x-0.5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <span
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800/60 text-slate-400 group-hover:text-white group-hover:bg-slate-700/60'
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <span>{label}</span>
                  </div>

                  {isActive && <ChevronRight size={14} className="text-indigo-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick Offline Status Card */}
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/80 border border-slate-700/50 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-slate-200">Local Browser Vault</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Fast, zero-latency database powered by IndexedDB. 100% private.
          </p>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-obsidian-950/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              className="ib lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Spotlight Search Bar */}
            <form
              className="relative w-full group"
              onSubmit={(e) => {
                e.preventDefault();
                nav(`/companies?q=${encodeURIComponent(q)}`);
              }}
            >
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
              />
              <input
                className="w-full pl-10 pr-16 py-2 text-xs md:text-sm bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all outline-none placeholder:text-slate-400"
                placeholder="Search companies, contacts, products, cities…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Global search"
              />
              <div className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-400 shadow-xs pointer-events-none">
                <Command size={10} />
                <span>K</span>
              </div>
            </form>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {hasPermission('canAddVisit') && (
              <Link
                to="/visit/new"
                className="btn btn-p shadow-glow-brand"
              >
                <Plus size={15} className="transition-transform group-hover:rotate-90" />
                <span className="hidden sm:inline">Add Visit</span>
              </Link>
            )}

            {/* User Profile Pill & Quick Switcher */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 pl-2 sm:pl-3 py-1 pr-2 rounded-xl hover:bg-slate-100/80 transition-all border border-transparent hover:border-slate-200"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs ${
                    isAdmin
                      ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500'
                      : 'bg-gradient-to-tr from-amber-500 to-orange-500'
                  }`}>
                    {currentUser?.avatarText || (isAdmin ? 'AD' : 'FE')}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser?.name || 'Admin'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">
                    {currentUser?.role === 'admin' ? 'System Admin' : 'Field User'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* User Switcher Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-slate-200/90 py-2 z-50 animate-scale-in text-slate-800">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Current Account
                      </p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{currentUser?.name}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Username: <b className="text-slate-700">{currentUser?.username || 'admin'}</b>
                      </p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isAdmin
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isAdmin ? 'Full System Access' : 'Custom Permissions'}
                      </span>
                    </div>

                    <div className="py-1">
                      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Switch / Login Account
                      </p>
                      {users.map((u) => {
                        const active = u.id === currentUser?.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                              active ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'
                            }`}
                            onClick={() => {
                              switchUser(u);
                              setUserMenuOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                {u.avatarText || u.name[0]}
                              </span>
                              <div>
                                <span className="block leading-none">{u.name}</span>
                                <span className="text-[10px] text-slate-400">@{u.username || 'user'} • {u.role}</span>
                              </div>
                            </div>
                            {active && <Check size={14} className="text-indigo-600" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t border-slate-100 space-y-1">
                      {isAdmin && (
                        <Link
                          to="/settings"
                          className="w-full btn !py-1.5 !text-xs !justify-start"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Cog size={13} />
                          <span>Manage Users & Permissions</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        className="w-full btn btn-d !py-1.5 !text-xs !justify-start"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                          nav('/login');
                        }}
                      >
                        <LogOut size={13} />
                        <span>Sign Out / Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Page with animation container */}
        <main className="p-3 sm:p-5 md:p-8 max-w-[1440px] w-full mx-auto animate-fade-in flex-1 pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Mobile Bottom Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around safe-area-pb"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                  <LayoutDashboard size={19} />
                </div>
                <span className="mt-0.5">Home</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/companies"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                  <Building2 size={19} />
                </div>
                <span className="mt-0.5">Companies</span>
              </>
            )}
          </NavLink>

          {/* Quick Floating Add Button */}
          {hasPermission('canAddVisit') && (
            <Link
              to="/visit/new"
              aria-label="New Visit or Company"
              className="flex flex-col items-center justify-center -mt-5 group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 group-active:scale-95 transition-all ring-4 ring-white">
                <Plus size={22} className="stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Add Visit</span>
            </Link>
          )}

          {hasPermission('canViewMap') && (
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                  isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                    <MapPinned size={19} />
                  </div>
                  <span className="mt-0.5">Map</span>
                </>
              )}
            </NavLink>
          )}

          {hasPermission('canViewVisits') && (
            <NavLink
              to="/visits"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                  isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                    <ClipboardList size={19} />
                  </div>
                  <span className="mt-0.5">Visits</span>
                </>
              )}
            </NavLink>
          )}
        </nav>

        {/* Credential Login Modal */}
        {loginModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 backdrop-blur-md p-4 animate-fade-in"
            onClick={() => setLoginModalOpen(false)}
          >
            <div
              className="card w-full max-w-sm p-6 shadow-2xl bg-white border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-extrabold text-slate-900 font-display mb-1">
                Account Sign In
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Enter your login credentials to switch active session
              </p>

              {loginErr && (
                <div className="p-2.5 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {loginErr}
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await loginWithCredentials(loginUsername, loginPassword);
                    setLoginModalOpen(false);
                    setLoginUsername('');
                    setLoginPassword('');
                  } catch (err) {
                    setLoginErr(err.message || 'Login failed');
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Username or Email
                  </label>
                  <input
                    className="input text-xs"
                    placeholder="e.g. admin or field"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="input text-xs"
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn !py-2 !px-3 text-xs"
                    onClick={() => setLoginModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-p shadow-glow-brand !py-2 !px-4 text-xs font-semibold"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

