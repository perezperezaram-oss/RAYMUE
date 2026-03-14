import ApiKeyGate from '@/components/ApiKeyGate';
import VideoGenerator from '@/components/VideoGenerator';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-emerald-500/30 py-12">
      <ApiKeyGate>
        <VideoGenerator />
      </ApiKeyGate>
    </main>
  );
}
