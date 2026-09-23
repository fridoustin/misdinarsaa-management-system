import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const NAV = [
  { href: "/pengurus/dashboard", label: "Dashboard" },
  { href: "/pengurus/jadwal", label: "Jadwal" },
  { href: "/pengurus/anggota", label: "Anggota" },
];

export default async function PengurusLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-border bg-surface p-4 md:w-56 md:border-b-0 md:border-r">
        <p className="mb-4 font-heading text-lg font-semibold text-primary">Misdinar</p>
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {user && <p className="mt-6 text-xs text-foreground/60">{user.fullName} · {user.role}</p>}
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
