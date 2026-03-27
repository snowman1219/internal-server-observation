import { useQuery } from "@tanstack/react-query";
import { getServerStatusApiServersServerNameStatusGet } from "../api/generated/servers/servers";

export function useServerStatus(serverName: string) {
  return useQuery({
    queryKey: ["server-status", serverName],
    queryFn: async () => {
      const response =
        await getServerStatusApiServersServerNameStatusGet(serverName);
      if (response.status !== 200) {
        throw new Error(`Server not found: ${serverName}`);
      }
      return response.data;
    },
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
    enabled: !!serverName,
  });
}
