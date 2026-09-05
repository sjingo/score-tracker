import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSessionRole } from "@/lib/authorization";
import AdminDashboard from "@/components/AdminDashboard";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || getSessionRole(session) !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-lg bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900">Welcome</h1>
          <p className="mt-3 text-gray-600">
            Your account does not have access to the team dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
