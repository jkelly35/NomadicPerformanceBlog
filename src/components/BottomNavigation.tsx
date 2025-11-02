'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';

export default function BottomNavigation() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const pathname = usePathname();

  // Define navigation items based on user state
  const getNavigationItems = () => {
    const baseItems = [
      {
        href: "/",
        label: "Home",
        icon: "🏠",
        active: pathname === "/"
      }
    ];

    if (user) {
      // Authenticated user navigation
      const authItems = [
        ...baseItems,
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: "📊",
          active: pathname === "/dashboard",
          show: preferences?.dashboards?.main
        },
        {
          href: "/profile",
          label: "Profile",
          icon: "👤",
          active: pathname === "/profile"
        }
      ].filter(item => 'show' in item ? item.show : true);

      return authItems;
    } else {
      // Public navigation
      return [
        ...baseItems,
        {
          href: "/about",
          label: "About",
          icon: "ℹ️",
          active: pathname === "/about"
        },
        {
          href: "/blog",
          label: "Blog",
          icon: "📝",
          active: pathname === "/blog"
        },
        {
          href: "/contact",
          label: "Contact",
          icon: "📞",
          active: pathname === "/contact"
        }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav
      className="bottom-navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '0.5rem',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -2px 20px rgba(0, 0, 0, 0.1)',
        WebkitBackdropFilter: 'blur(20px)', // Safari support
      }}
    >
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            borderRadius: '12px',
            textDecoration: 'none',
            color: item.active ? '#1a3a2a' : '#666',
            fontSize: '0.75rem',
            fontWeight: item.active ? '600' : '500',
            minWidth: '60px',
            transition: 'all 0.2s ease',
            backgroundColor: item.active ? 'rgba(26, 58, 42, 0.1)' : 'transparent',
            transform: item.active ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <span
            style={{
              fontSize: '1.25rem',
              marginBottom: '0.25rem',
              filter: item.active ? 'none' : 'grayscale(0.3)',
            }}
          >
            {item.icon}
          </span>
          <span style={{ fontSize: '0.7rem', textAlign: 'center' }}>
            {item.label}
          </span>
          {item.active && (
            <div
              style={{
                position: 'absolute',
                bottom: '-2px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '3px',
                background: 'linear-gradient(90deg, #1a3a2a, #2d5a3d)',
                borderRadius: '2px',
              }}
            />
          )}
        </Link>
      ))}
    </nav>
  );
}
