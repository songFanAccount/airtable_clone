import HomePage from "./_components/homePage/Home";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <HomePage />
    </HydrateClient>
  );
}