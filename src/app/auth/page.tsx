import { redirect } from "next/navigation";

/**
 * Auth redirect - redirects to login page
 */
export default function AuthPage() {
  redirect("/auth/login");
}
