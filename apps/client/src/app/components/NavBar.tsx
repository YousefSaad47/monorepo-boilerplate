"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function NavBar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">LMS Platform</h1>
            </Link>
          </div>

          {/* Search Field */}
          <div className="hidden md:flex md:items-center md:ml-6 md:flex-1 md:max-w-lg">
            <form
              className="w-full"
              role="search"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="nav-search" className="sr-only">
                Search courses
              </label>
              <div className="relative">
                <input
                  id="nav-search"
                  name="q"
                  type="search"
                  placeholder="Search courses, topics, or instructors"
                  className="block w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Navigation Icons & Auth */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link
              href="/my-learning"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/my-learning"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              My Learning
            </Link>

            <Link
              href="/wishlist"
              className={`p-2 rounded-md transition-colors ${
                pathname === "/wishlist"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
              }`}
              title="Wishlist"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </Link>

            <Link
              href="/cart"
              className={`p-2 rounded-md transition-colors relative ${
                pathname === "/cart"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
              }`}
              title="Cart"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                0
              </span>
            </Link>

            <Link
              href="/notifications"
              className={`p-2 rounded-md transition-colors relative ${
                pathname === "/notifications"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
              }`}
              title="Notifications"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </Link>

            <Link
              href="/signin"
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors  ${
                pathname === "/signin"
                  ? "bg-indigo-600 text-white"
                  : "text-indigo-600 hover:text-indigo-500 border border-indigo-600 hover:border-indigo-500"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === "/signup"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              Create Account
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isMobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}
          id="mobile-menu"
        >
          {/* Mobile search */}
          <div className="px-2 pt-2 pb-3 border-b border-gray-200">
            <form
              className="w-full"
              role="search"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="mobile-search" className="sr-only">
                Search courses
              </label>
              <div className="relative">
                <input
                  id="mobile-search"
                  name="q"
                  type="search"
                  placeholder="Search courses..."
                  className="block w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Mobile navigation links */}
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === "/"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              Home
            </Link>
            <Link
              href="/my-learning"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === "/my-learning"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              My Learning
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === "/wishlist"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              Wishlist
            </Link>
            <Link
              href="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === "/cart"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              Cart
            </Link>
            <Link
              href="/notifications"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === "/notifications"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              Notifications
            </Link>
            <Link
              href="/signin"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === "/signin"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === "/signup"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
