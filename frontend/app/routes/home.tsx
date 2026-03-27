import type { Route } from "./+types/home";
import { Header } from "../components/layout/header";
import { ServerCard } from "../components/layout/server-card";
import { ErrorAlert } from "../components/common/error-alert";
import { useServers } from "../lib/hooks/use-servers";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Server Monitor" },
    { name: "description", content: "Internal server observation dashboard" },
  ];
}

export default function Home() {
  const { data, isLoading, error } = useServers();

  const latestUpdate = data?.servers
    ?.map((s) => s.last_updated_at)
    .sort()
    .reverse()[0];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header lastUpdatedAt={latestUpdate} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading && (
          <p className="text-gray-500 text-center py-12">読み込み中...</p>
        )}

        {error && <ErrorAlert message={String(error.message)} />}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.servers.map((server) => (
              <ServerCard key={server.name} server={server} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
