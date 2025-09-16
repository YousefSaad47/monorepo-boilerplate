import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-bold text-3xl text-gray-900">LMS Application</h1>
          <p className="mt-2 text-gray-600">
            Welcome to our Learning Management System
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/auth/signin" className="block">
            <Button className="w-full">Sign In</Button>
          </Link>

          <Link href="/auth/signup" className="block">
            <Button variant="outline" className="w-full">
              Sign Up
            </Button>
          </Link>

          <Link href="/auth/forgot-password" className="block">
            <Button variant="ghost" className="w-full">
              Forgot Password
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
