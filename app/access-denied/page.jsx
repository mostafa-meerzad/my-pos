"use client";
import { useRouter } from "next/navigation";

function page() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center space-y-2">
        <img
          src="/./access_denied.png"
          alt="Access Restricted"
          className="w-full max-w-3xl mx-auto"
        />

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-slate-800">We are Sorry...</h1>
          <p className="text-slate-600 text-lg max-w-md mx-auto">
            The page you're trying to access has restricted access. Please refer
            to your system administrator
          </p>
          <div className="pt-4">
            <button
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={() => router.push("/")}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
