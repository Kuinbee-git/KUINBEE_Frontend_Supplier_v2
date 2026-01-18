import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Kuinbee Supplier Portal",
  description: "Access your Kuinbee supplier account to manage and publish datasets.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
