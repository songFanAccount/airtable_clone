import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function Base() {
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      Base
    </HydrateClient>
  );
}