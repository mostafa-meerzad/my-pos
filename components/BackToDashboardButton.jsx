// components/BackToDashboardButton.jsx
import Link from "next/link";
import { Button } from "./ui/button";

export default function BackToDashboardButton() {
  return (
    
    <Link href="/">
          <Button className="bg-blue-500 hover:bg-blue-600 text-md">Dashboard</Button>
    </Link>
  );
}
