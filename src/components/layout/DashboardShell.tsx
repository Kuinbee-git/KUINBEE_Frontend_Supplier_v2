'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  User, 
  Shield, 
  Settings, 
  Bell, 
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      id: 'drafts', 
      label: 'Drafts', 
      icon: Upload, 
      path: '/dashboard/datasets?status=draft',
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
    <div className="relative min-h-screen w-full overflow-hidden">
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

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside
          className="border-r flex-shrink-0 transition-all duration-300"
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
            className="h-20 flex items-center border-b transition-all duration-300" 
            style={{ 
              borderColor: tokens.borderDefault, 
              padding: sidebarCollapsed ? '0 16px' : '0 24px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
            }}
          >
            <div
              className="border rounded-lg flex items-center justify-center transition-all duration-300"
              style={{
                height: '40px',
                padding: sidebarCollapsed ? '8px' : '0 12px',
                background: tokens.glassBg,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${tokens.glassBorder}`,
              }}
            >
              <img
                src={isDark ? '/logo-dark.png' : '/logo-light.png'}
                alt="Kuinbee"
                className={`transition-all duration-300 ${sidebarCollapsed ? 'h-6 w-6 object-contain' : 'h-6'}`}
                style={{ opacity: isDark ? 0.9 : 1 }}
              />
            </div>
          </div>

          {/* Collapse Toggle Button */}
          <div className="px-4 py-3 border-b" style={{ borderColor: tokens.borderDefault }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
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
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
              const isDisabled = item.disabled;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path, isDisabled)}
                  disabled={isDisabled}
                  className="w-full rounded-lg transition-all duration-200"
                  style={{
                    padding: sidebarCollapsed ? '12px' : '12px 16px',
                    background: isActive ? tokens.navItemActive : 'transparent',
                    border: `1px solid ${isActive ? tokens.borderDefault : 'transparent'}`,
                    color: isDisabled ? tokens.textMuted : tokens.textPrimary,
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: sidebarCollapsed ? '0' : '12px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
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
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar */}
          <header
            className="h-20 px-8 flex items-center justify-between border-b flex-shrink-0"
            style={{ borderColor: tokens.borderDefault }}
          >
            <div>
              <h1
                className="text-lg transition-colors duration-300"
                style={{ color: tokens.textPrimary, fontWeight: '600', lineHeight: '1.4' }}
              >
                Supplier Panel
              </h1>
              <p className="text-xs mt-0.5" style={{ color: tokens.textSecondary, lineHeight: '1.4' }}>
                Manage your datasets and account
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
                style={{
                  background: tokens.glassBg,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${tokens.glassBorder}`,
                  color: tokens.textPrimary,
                }}
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 h-10 rounded-lg transition-all duration-300 hover:scale-105"
                  style={{
                    background: tokens.glassBg,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `1px solid ${tokens.glassBorder}`,
                    color: tokens.textSecondary,
                  }}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user?.email || 'User'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
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
