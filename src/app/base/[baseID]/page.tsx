import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Base() {
  const session = await auth();

  return (
    <HydrateClient>
      Base
    </HydrateClient>
  );
}