import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UpdateChecker from './UpdateChecker';

// Chevron icon for expand/collapse
const ChevronIcon = ({ open }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const Navigation = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ reports: true }); // reports open by default

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const toggleMenu = (key) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAccess = (accessType) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    switch (accessType) {
      case 'member':      return currentUser.memberAccess;
      case 'visitor':     return currentUser.visitorAccess;
      case 'vendor':      return currentUser.vendorAccess;
      case 'group':       return currentUser.groupAccess;
      case 'donation':    return currentUser.donationAccess;
      case 'admin':       return currentUser.adminAccess;
      case 'expense':     return currentUser.expenseAccess;
      case 'charges':     return currentUser.chargesAccess;
      case 'reports':     return currentUser.reportsAccess;
      case 'deposit':     return currentUser.depositAccess;
      case 'bank':        return currentUser.bankAccess;
      case 'checks':      return currentUser.checksAccess;
      default:            return false;
    }
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `block px-4 py-2 hover:bg-gray-700 rounded transition-colors ${isActive(path) ? 'bg-gray-700 font-semibold' : ''}`;

  const subLinkClass = (path) =>
    `block pl-8 pr-4 py-2 text-sm hover:bg-gray-600 rounded transition-colors ${isActive(path) ? 'bg-gray-600 font-semibold' : ''}`;

  const deepLinkClass = (path) =>
    `block pl-12 pr-4 py-2 text-sm hover:bg-gray-600 rounded transition-colors ${isActive(path) ? 'bg-gray-600 font-semibold' : ''}`;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 focus:outline-none"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-gray-800 text-white h-screen flex flex-col flex-shrink-0
        fixed z-50 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-700">
          <Link to="/" className="text-xl font-bold block hover:text-gray-300" onClick={closeMobileMenu}>
            Church Management
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto sidebar-scroll">
          <ul className="py-2">

            {hasAccess('member') && (
              <li>
                <button
                  onClick={() => toggleMenu('member')}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-700 rounded transition-colors text-left"
                >
                  <span>Member</span>
                  <ChevronIcon open={openMenus.member} />
                </button>

                {openMenus.member && (
                  <ul className="mt-1 mb-1">
                    <li><Link to="/member-lookup" className={subLinkClass('/member-lookup')} onClick={closeMobileMenu}>Member Profile</Link></li>
                    <li><Link to="/member-donation-entry" className={subLinkClass('/member-donation-entry')} onClick={closeMobileMenu}>Member Donation</Link></li>
                  </ul>
                )}
              </li>
            )}

            {hasAccess('visitor') && (
              <li>
                <button
                  onClick={() => toggleMenu('visitor')}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-700 rounded transition-colors text-left"
                >
                  <span>Visitor</span>
                  <ChevronIcon open={openMenus.visitor} />
                </button>

                {openMenus.visitor && (
                  <ul className="mt-1 mb-1">
                    <li><Link to="/visitor-lookup" className={subLinkClass('/visitor-lookup')} onClick={closeMobileMenu}>Visitor Profile</Link></li>
                    <li><Link to="/visitor-donation-entry" className={subLinkClass('/visitor-donation-entry')} onClick={closeMobileMenu}>Visitor Donation</Link></li>
                  </ul>
                )}
              </li>
            )}

            {hasAccess('vendor') && (
              <li>
                <Link to="/vendor" className={linkClass('/vendor')} onClick={closeMobileMenu}>
                  Vendor
                </Link>
              </li>
            )}

            {hasAccess('group') && (
              <li>
                <Link to="/group-lookup" className={linkClass('/group-lookup')} onClick={closeMobileMenu}>
                  Group
                </Link>
              </li>
            )}

            {hasAccess('donation') && (
              <li>
                <Link to="/donation-lookup" className={linkClass('/donation-lookup')} onClick={closeMobileMenu}>
                  Donation
                </Link>
              </li>
            )}

            {hasAccess('donation') && (
              <li>
                <Link to="/donation-types-dropdown" className={linkClass('/donation-types-dropdown')} onClick={closeMobileMenu}>
                  Donation Types
                </Link>
              </li>
            )}

            {hasAccess('expense') && (
              <li>
                <Link to="/expense-categories" className={linkClass('/expense-categories')} onClick={closeMobileMenu}>
                  Expense
                </Link>
              </li>
            )}

            {hasAccess('charges') && (
              <li>
                <Link to="/charges" className={linkClass('/charges')} onClick={closeMobileMenu}>
                  Charges
                </Link>
              </li>
            )}

            {hasAccess('checks') && (
              <li>
                <Link to="/reports/check-generator" className={linkClass('/reports/check-generator')} onClick={closeMobileMenu}>
                  Checks
                </Link>
              </li>
            )}

            {hasAccess('deposit') && (
              <li>
                <Link to="/deposit-dropdown" className={linkClass('/deposit-dropdown')} onClick={closeMobileMenu}>
                  Deposit
                </Link>
              </li>
            )}

            {hasAccess('bank') && (
              <li>
                <Link to="/bank-dropdown" className={linkClass('/bank-dropdown')} onClick={closeMobileMenu}>
                  Bank
                </Link>
              </li>
            )}

            {hasAccess('admin') && (
              <li>
                <Link to="/admin/users" className={linkClass('/admin/users')} onClick={closeMobileMenu}>
                  Administrator
                </Link>
              </li>
            )}

            {/* ── Reports tree ── */}
            {hasAccess('reports') && (
              <li>
                <button
                  onClick={() => toggleMenu('reports')}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-700 rounded transition-colors text-left"
                >
                  <span>Reports</span>
                  <ChevronIcon open={openMenus.reports} />
                </button>

                {openMenus.reports && (
                  <ul className="mt-1 mb-1">

                    {/* Donations sub-tree */}
                    <li>
                      <button
                        onClick={() => toggleMenu('reports-donations')}
                        className="w-full flex items-center justify-between pl-8 pr-4 py-2 text-sm hover:bg-gray-600 rounded transition-colors text-left"
                      >
                        <span>Donations</span>
                        <ChevronIcon open={openMenus['reports-donations']} />
                      </button>
                      {openMenus['reports-donations'] && (
                        <ul className="mt-0.5 mb-1">
                          <li><Link to="/reports/member-donations"  className={deepLinkClass('/reports/member-donations')}  onClick={closeMobileMenu}>Member Donations</Link></li>
                          <li><Link to="/reports/visitor-donations" className={deepLinkClass('/reports/visitor-donations')} onClick={closeMobileMenu}>Visitor Donations</Link></li>
                        </ul>
                      )}
                    </li>

                    <li><Link to="/reports/membership"   className={subLinkClass('/reports/membership')}   onClick={closeMobileMenu}>Membership</Link></li>
                    <li><Link to="/reports/groups"       className={subLinkClass('/reports/groups')}       onClick={closeMobileMenu}>Groups</Link></li>
                    <li><Link to="/reports/type-summary" className={subLinkClass('/reports/type-summary')} onClick={closeMobileMenu}>Type Summary</Link></li>
                    <li><Link to="/reports/vendors"      className={subLinkClass('/reports/vendors')}      onClick={closeMobileMenu}>Vendors</Link></li>
                    <li><Link to="/reports/expenses"     className={subLinkClass('/reports/expenses')}     onClick={closeMobileMenu}>Expenses</Link></li>
                    <li><Link to="/reports/charges"      className={subLinkClass('/reports/charges')}      onClick={closeMobileMenu}>Charges</Link></li>
                    <li><Link to="/reports/deposits"     className={subLinkClass('/reports/deposits')}     onClick={closeMobileMenu}>Deposits</Link></li>
                  </ul>
                )}
              </li>
            )}

          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          {currentUser ? (
            <div>
              <div className="text-sm mb-2">{currentUser.name || currentUser.username}</div>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="block w-full px-3 py-2 text-center rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
              onClick={closeMobileMenu}
            >
              Login
            </Link>
          )}
        </div>
        <UpdateChecker />
      </aside>
    </>
  );
};

export default Navigation;
