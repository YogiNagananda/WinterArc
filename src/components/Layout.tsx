import { Outlet } from 'react-router-dom';
import { Sidebar, BottomNav } from './Navigation';
import { ToastContainer } from './Toast';
import { QuickNoteButton } from './QuickNoteButton';

export function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
      <ToastContainer />
      <QuickNoteButton />
    </div>
  );
}
