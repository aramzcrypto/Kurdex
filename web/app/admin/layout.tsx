import { redirect } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // In a real app we'd verify auth here. For this request, we'll allow access to the dashboard routes.
  return (
    <div className="flex gap-8">
      {/* Sidebar logic could go here, or we use Navbar */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
