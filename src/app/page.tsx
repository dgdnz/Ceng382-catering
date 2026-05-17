import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl w-full bg-white p-12 rounded-3xl shadow-xl border border-primary border-opacity-40 animate-fade-in">
        <span className="text-6xl animate-float inline-block">🍰</span>
        <h1 className="text-4xl font-extrabold text-textDark mt-6 mb-4">
          Pink Dessert Shop
        </h1>
        <p className="text-secondary font-medium text-lg mb-8 max-w-md mx-auto">
          Indulge in our exquisite collection of premium cakes, macarons, cupcakes, and professional catering options!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-secondary text-white font-bold px-8 py-3 rounded-full hover:bg-accent transition duration-300 shadow-md hover:shadow-lg"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-white border-2 border-primary text-secondary font-bold px-8 py-3 rounded-full hover:bg-primary hover:text-white transition duration-300 shadow-sm"
          >
            Join the Sweet Club
          </Link>
        </div>
      </div>
    </main>
  );
}
