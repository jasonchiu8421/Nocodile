import { redirect } from "next/navigation";
import Login from "./login/page";

export default function Home() {
  redirect("/login");
}
