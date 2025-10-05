"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPageClient() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      redirect: true,
      username,
      password,
      callbackUrl,
    });

    if (!result) {
      setError("Failed to sign in. Check credentials.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Sign In</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-64">
        <input
          name="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="border px-2 py-1 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border px-2 py-1 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white py-1 rounded">
          Sign In
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}