import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-content-center items-center bg-background px-4 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-primary border-opacity-40">
        <span className="text-6xl">🚫</span>
        <h1 className="text-3xl font-extrabold text-textDark mt-6 mb-2">Access Denied</h1>
        <p className="text-secondary font-medium mb-6">
          You do not have the required permissions to view this sweet page!
        </p>
        <Link
          href="/login"
          className="inline-block bg-secondary text-white font-bold px-8 py-3 rounded-full hover:bg-accent transition duration-300 shadow-md hover:shadow-lg"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
