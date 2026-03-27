import { useQuery } from "@tanstack/react-query";
import { listServersApiServersGet } from "../api/generated/servers/servers";

export function useServers() {
  return useQuery({
    queryKey: ["servers"],
    queryFn: async () => {
      const response = await listServersApiServersGet();
      return response.data;
    },
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  });
}
