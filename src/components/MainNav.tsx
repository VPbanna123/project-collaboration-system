import { auth } from "@clerk/nextjs/server";
import { syncUser } from "@/lib/syncUser";
import { ClientNav } from "./ClientNav";

export async function MainNav() {
  const { userId } = await auth();
  let userName = "";

  if (userId) {
    try {
      const user = await syncUser();
      userName = user?.name || "";
    } catch (error) {
      console.error("Failed to sync user:", error);
    }
  }

  return <ClientNav userName={userName} />;
}
