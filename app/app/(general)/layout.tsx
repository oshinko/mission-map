import Link from 'next/link';

export default function Layout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col gap-6 p-6">
      <header className="flex justify-center">
        <h1 className="text-2xl font-bold">
          <Link href="/" className="text-[#0078a8] hover:underline hover:opacity-80">
            Mission Map
          </Link>
        </h1>
      </header>

      <main>
        {children}
      </main>
    </div>
  );
}
