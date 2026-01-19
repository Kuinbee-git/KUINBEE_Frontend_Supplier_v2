'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  User, 
  Settings, 
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database
} from 'lucide-react';
import { useThemeStore } from '@/store';
import { useAuthStore } from '@/store';
import { useOnboardingStatus } from '@/hooks';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { isComplete } = useOnboardingStatus();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Design tokens
  const tokens = {
    surfaceUnified: isDark
      ? 'linear-gradient(135deg, #1a2240 0%, #2a3250 50%, #1f2847 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f5f7fb 100%)',
    glassBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.88)',
    glassBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
    textPrimary: isDark ? '#ffffff' : '#1a2240',
    textSecondary: isDark ? 'rgba(255, 255, 255, 0.6)' : '#525d6f',
    textMuted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#7a8494',
    borderDefault: isDark ? 'rgba(255, 255, 255, 0.1)' : '#dde3f0',
    borderSubtle: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(26, 34, 64, 0.06)',
    sidebarBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
    navItemHover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 34, 64, 0.06)',
    navItemActive: isDark
      ? 'linear-gradient(135deg, rgba(26, 34, 64, 0.4), rgba(42, 50, 80, 0.3))'
      : 'linear-gradient(135deg, rgba(26, 34, 64, 0.08), rgba(26, 34, 64, 0.04))',
  };

  const navItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: LayoutDashboard, 
      path: '/dashboard',
      disabled: false 
    },
    { 
      id: 'proposals', 
      label: 'My Proposals', 
      icon: FileText, 
      path: '/dashboard/datasets',
      disabled: false 
    },
    { 
      id: 'my-datasets', 
      label: 'My Datasets', 
      icon: Database, 
      path: '/dashboard/my-datasets',
      disabled: false 
    },
    { 
      id: 'account', 
      label: 'Account', 
      icon: Settings, 
      path: '/dashboard/account',
      disabled: false 
    },
  ];

  const handleNavClick = (path: string, disabled: boolean) => {
    if (!disabled) {
      router.push(path);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{ background: tokens.surfaceUnified }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(${tokens.borderSubtle} 1px, transparent 1px), linear-gradient(90deg, ${tokens.borderSubtle} 1px, transparent 1px)`
            : `linear-gradient(rgba(26, 34, 64, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(26, 34, 64, 0.06) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          opacity: isDark ? 0.6 : 0.4,
        }}
      />

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <aside
          className="border-r flex-shrink-0 transition-all duration-300 h-screen overflow-y-auto"
          style={{
            width: sidebarCollapsed ? '80px' : '256px',
            background: tokens.sidebarBg,
            borderColor: tokens.borderDefault,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* Logo */}
          <div 
            className="h-24 flex items-center justify-center border-b transition-all duration-300" 
            style={{ 
              borderColor: tokens.borderDefault,
              paddingLeft: sidebarCollapsed ? '0' : '12px',
              paddingRight: sidebarCollapsed ? '0' : '12px',
            }}
          >
            <div className="flex items-center justify-center gap-3 w-full">
              <div
                className="border rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  height: '48px',
                  width: '54px',
                  background: tokens.glassBg,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: `1px solid ${tokens.glassBorder}`,
                }}
              >
                <img
                  src={isDark ? '/logo-dark.png' : '/logo-light.png'}
                  alt="Kuinbee"
                  className="h-24 w-24 object-contain"
                  style={{ opacity: isDark ? 0.9 : 1 }}
                />
              </div>
              {!sidebarCollapsed && (
                <span 
                  className="text-lg font-bold whitespace-nowrap transition-all duration-300 ease-out"
                  style={{ 
                    color: tokens.textPrimary,
                    opacity: sidebarCollapsed ? 0 : 1,
                    visibility: sidebarCollapsed ? 'hidden' : 'visible',
                    transform: sidebarCollapsed ? 'translateX(-10px)' : 'translateX(0)',
                  }}
                >
                  Kuinbee
                </span>
              )}
            </div>
          </div>

          {/* Collapse Toggle Button */}
          <div className="px-4 py-3 border-b flex justify-center" style={{ borderColor: tokens.borderDefault }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105${sidebarCollapsed ? '' : ' gap-2 px-5 py-2 border'}`}
              style={{
                height: '40px',
                background: tokens.glassBg,
                border: `1px solid ${tokens.glassBorder}`,
                color: tokens.textSecondary,
              }}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <span className="text-xs font-semibold tracking-wide" style={{ letterSpacing: '0.02em' }}>Collapse</span>
                  <ChevronLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Only one item should be active at a time
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname?.startsWith(item.path));
              const isDisabled = item.disabled;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path, isDisabled)}
                  disabled={isDisabled}
                  className={`w-full rounded-lg transition-all duration-300 ease-out flex items-center${sidebarCollapsed ? ' justify-center' : ''}`}
                  style={{
                    padding: sidebarCollapsed ? '12px' : '12px 16px',
                    background: isActive ? tokens.navItemActive : 'transparent',
                    border: `1px solid ${isActive ? tokens.borderDefault : 'transparent'}`,
                    color: isDisabled ? tokens.textMuted : tokens.textPrimary,
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    minWidth: '0',
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled && !isActive) {
                      e.currentTarget.style.background = tokens.navItemHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span className="flex items-center justify-center w-6 h-6">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                  </span>
                  <span 
                    className="text-sm font-medium transition-all duration-300 ease-out overflow-hidden whitespace-nowrap"
                    style={{
                      opacity: sidebarCollapsed ? 0 : 1,
                      visibility: sidebarCollapsed ? 'hidden' : 'visible',
                      width: sidebarCollapsed ? '0' : 'auto',
                      transform: sidebarCollapsed ? 'translateX(-10px)' : 'translateX(0)',
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Bar */}
          <header
            className="h-24 px-10 flex items-center justify-between border-b flex-shrink-0"
            style={{ borderColor: tokens.borderDefault }}
          >
            <div>
              <h1
                className="text-2xl transition-colors duration-300"
                style={{ color: tokens.textPrimary, fontWeight: '600', lineHeight: '1.3' }}
              >
                Supplier Panel
              </h1>
              <p className="text-sm mt-1" style={{ color: tokens.textSecondary, lineHeight: '1.4' }}>
                Manage your datasets and account
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
                style={{
                  background: tokens.glassBg,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${tokens.glassBorder}`,
                  color: tokens.textPrimary,
                }}

                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-5 h-11 rounded-lg transition-all duration-300 hover:scale-105"
                  style={{
                    background: tokens.glassBg,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `1px solid ${tokens.glassBorder}`,
                    color: tokens.textSecondary,
                  }}
                >
                  <User className="w-5 h-5" />
                  <span className="text-base">{user?.email || 'User'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    
                    {/* Menu Items */}
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-50 overflow-hidden"
                      style={{
                        background: tokens.glassBg,
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: `1px solid ${tokens.glassBorder}`,
                      }}
                    >
                      <div className="py-1">
                        {/* Profile */}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            router.push('/dashboard/profile');
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors duration-200"
                          style={{
                            color: tokens.textPrimary,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = tokens.navItemHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm">Profile</span>
                        </button>

                        {/* Account Settings */}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            router.push('/dashboard/account');
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors duration-200"
                          style={{
                            color: tokens.textPrimary,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = tokens.navItemHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">Account Settings</span>
                        </button>

                        {/* Divider */}
                        <div
                          className="my-1 h-px"
                          style={{ background: tokens.borderDefault }}
                        />

                        {/* Logout */}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors duration-200"
                          style={{
                            color: tokens.textSecondary,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = tokens.navItemHover;
                            e.currentTarget.style.color = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = tokens.textSecondary;
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
