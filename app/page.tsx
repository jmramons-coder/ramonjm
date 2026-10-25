import { cookies } from "next/headers";
import { HomeView } from "./home-view";

export default async function Home() {
  const cookieStore = await cookies();
  const initialTheme =
    cookieStore.get("portfolio-theme")?.value === "light" ? "light" : "dark";

  return <HomeView initialTheme={initialTheme} />;
}
