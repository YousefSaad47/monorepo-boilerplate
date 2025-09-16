import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Authentication",
    default: "Authentication",
  },
  description: "Sign in, sign up, or reset your password",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
