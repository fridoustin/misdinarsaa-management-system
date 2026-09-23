import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-primary">Misdinar App</h1>
        <p className="mt-2 max-w-md text-sm text-foreground/70">
          Jadwal yang jelas, data yang teratur, dan koordinasi yang tidak bergantung pada chat WhatsApp.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/jadwal"><Button>Lihat Jadwal</Button></Link>
        <Link href="/login"><Button variant="ghost">Login Pengurus</Button></Link>
      </div>
    </main>
  );
}
