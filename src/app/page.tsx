import { redirect } from "next/navigation";

/**
 * Root page - redirects to auth
 */
export default function HomePage() {
  redirect("/auth/login");
}
