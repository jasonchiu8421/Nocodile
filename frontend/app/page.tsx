import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans min-w-screen min-h-screen flex flex-col justify-center items-center">
      <Link href="/dashboard" className="flex p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
        Dashboard
      </Link>
      <Link href="/photos" className="flex p-4">
        View your images
      </Link>
      <Link href="/blocks" className="flex p-4 bg-amber-300 rounded-xl">
        Block interface
      </Link>
    </div>
  );
}
