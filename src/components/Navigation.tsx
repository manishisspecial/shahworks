"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { useState, useRef, useEffect } from "react";
import { FiUser, FiLogOut } from "react-icons/fi";

export default function Navigation() {
  const { user, role, loading } = useUser();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    if (accountOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountOpen]);

  // Add a state to force re-render on auth change
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // Show loading spinner while user state is loading
  if (loading) {
    return (
      <nav className="bg-white shadow-md sticky top-0 z-50 h-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
      </nav>
    );
  }

  // Navigation links
  const navLinks = (
    <>
      {!user && (
        <>
          <button
            onMouseDown={() => { setDrawerOpen(false); router.push("/"); }}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none focus:outline-none w-full text-left transition-colors"
          >Home</button>
          <button
            onMouseDown={() => { setDrawerOpen(false); }}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none focus:outline-none w-full text-left transition-colors"
          >Features</button>
          <button
            onMouseDown={() => { setDrawerOpen(false); router.push("/register"); }}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none focus:outline-none w-full text-left transition-colors"
          >Register</button>
          <button
            onMouseDown={() => { setDrawerOpen(false); router.push("/login"); }}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none focus:outline-none w-full text-left transition-colors"
          >Login</button>
        </>
      )}
      {user && role === 'admin' && !!user.email && (
        <>
          <button
            onMouseDown={() => { setDrawerOpen(false); router.push("/admin/dashboard"); }}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none focus:outline-none w-full text-left transition-colors"
          >Admin Dashboard</button>
          <button
            onMouseDown={() => { setDrawerOpen(false); router.push("/admin/organizations"); }}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none focus:outline-none w-full text-left transition-colors"
          >Manage Employees</button>
          <button
            onMouseDown={() => { setDrawerOpen(false); router.push("/admin/leave-requests"); }}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none focus:outline-none w-full text-left transition-colors"
          >Leave Requests</button>
          <button
            onMouseDown={() => { setDrawerOpen(false); router.push("/admin/salary-generate"); }}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none focus:outline-none w-full text-left transition-colors"
          >Salary Generation</button>
          <button
            onMouseDown={() => { setDrawerOpen(false); router.push("/admin/reports"); }}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none focus:outline-none w-full text-left transition-colors"
          >Reports</button>
        </>
      )}
      {user && role === 'employee' && !!user.email && (
        <>
          <button
            onMouseDown={() => { setDrawerOpen(false); router.push("/dashboard"); }}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none focus:outline-none w-full text-left transition-colors"
          >Dashboard</button>
        </>
      )}
      {user && !!user.email && (
        <div className="relative" ref={accountRef} style={{zIndex: 60}}>
          <button
            onClick={() => setAccountOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm border border-gray-200"
            aria-haspopup="true"
            aria-expanded={accountOpen}
            tabIndex={0}
          >
            <span className="inline-block w-10 h-10 rounded-full border-2 border-blue-300 flex items-center justify-center font-bold text-white shadow-lg"
              style={{
                fontSize: '1.25rem',
                lineHeight: 1,
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                boxShadow: '0 4px 16px 0 rgba(59, 130, 246, 0.15)',
              }}
            >
              {user.email?.[0]?.toUpperCase() || "A"}
            </span>
            <span className="hidden sm:inline">My Account</span>
            <svg className={`w-4 h-4 ml-1 transition-transform ${accountOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {accountOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 animate-fade-in overflow-hidden backdrop-blur-sm" style={{boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)', zIndex: 60}}>
              <button
                onMouseDown={() => { setAccountOpen(false); setDrawerOpen(false); router.push("/profile"); }}
                className="flex items-center gap-2 w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 transition bg-transparent border-none"
                tabIndex={0}
              >
                <FiUser className="text-blue-600" /> Profile
              </button>
              <button
                onMouseDown={async () => { setAccountOpen(false); setDrawerOpen(false); await supabase.auth.signOut(); router.push("/login"); }}
                className="flex items-center gap-2 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition border-t border-gray-100 bg-transparent border-none"
                tabIndex={0}
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">PeoplePulse HR</Link>
          </div>
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks}
          </div>
          {/* Hamburger Icon for Mobile */}
          <button
            className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {/* Slide-out Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ willChange: 'transform', borderTopLeftRadius: '1rem', borderBottomLeftRadius: '1rem', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center px-4 py-4 border-b">
          <span className="text-xl font-bold text-blue-600">Menu</span>
          <button
            className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col px-4 py-6 space-y-4">
          {navLinks}
        </div>
      </div>
      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
} 