import Navbar from './Navbar.jsx';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      <footer className="text-center text-gray-500 text-sm py-8">
        MMO Store &copy; {new Date().getFullYear()} - San pham so tu dong
      </footer>
    </div>
  );
}
