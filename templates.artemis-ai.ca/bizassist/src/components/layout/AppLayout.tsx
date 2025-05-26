import Link from 'next/link';
import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  // State for mobile sidebar visibility (optional for this iteration, but good for future)
  // const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="md:flex h-screen bg-background text-foreground">
      {/* Optional: Hamburger menu for mobile - not implemented in this iteration for simplicity */}
      {/* 
      <div className="md:hidden p-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg className="w-6 h-6 text-navy" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </button>
      </div>
      */}

      {/* Sidebar */}
      {/* Base: full width, hidden unless toggled (not implemented). md and up: fixed width, visible */}
      <aside className="w-full md:w-64 bg-navy p-6 text-white flex flex-col space-y-4 shadow-lg md:h-screen md:overflow-y-auto">
        <div className="mb-6">
          <Link href="/" className="text-3xl font-heading">
            <span className="text-white">Biz</span><span className="text-orange">Assist</span>
          </Link>
        </div>
        <nav>
          <ul>
            <li>
              <Link href="/" className="block py-2 px-3 hover:bg-orange/20 rounded font-sans">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/tasks" className="block py-2 px-3 hover:bg-orange/20 rounded font-sans">
                Tasks
              </Link>
            </li>
            <li>
              <Link href="/sales" className="block py-2 px-3 hover:bg-orange/20 rounded font-sans">
                Sales
              </Link>
            </li>
            <li>
              <Link href="/settings" className="block py-2 px-3 hover:bg-orange/20 rounded font-sans">
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          <p className="text-sm font-sans">&copy; 2024 BizAssist</p>
        </div>
      </aside>

      {/* Main Content Area */}
      {/* Base: takes full width. md and up: flex-1 for remaining space */}
      <main className="flex-1 p-6 overflow-y-auto w-full">
        <div className="bg-card p-6 rounded-lg shadow"> {/* Card-like wrapper */}
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
