'use client';

import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function ProcessMaterialContent() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get('fileId');

  return (
    <div className="w-full min-h-screen bg-background">
      <header className="w-full p-6 flex items-center gap-4 border-b bg-card">
        <Link href="/mentor/materials/upload" className="hover:text-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Process Material</h1>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="p-6 bg-card rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Material Uploaded Successfully</h2>
          <p className="text-muted-foreground mb-2">File ID:</p>
          <code className="bg-muted p-2 rounded block">{fileId}</code>
        </div>

        {/* TODO: Add next step UI here */}
      </main>
    </div>
  );
}

export default function ProcessMaterialPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-background">
        <header className="w-full p-6 flex items-center gap-4 border-b bg-card">
          <Link href="/mentor/materials/upload" className="hover:text-primary transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Process Material</h1>
        </header>
        <main className="max-w-6xl mx-auto p-6 space-y-8">
          <div className="p-6 bg-card rounded-xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Loading...</h2>
          </div>
        </main>
      </div>
    }>
      <ProcessMaterialContent />
    </Suspense>
  );
}