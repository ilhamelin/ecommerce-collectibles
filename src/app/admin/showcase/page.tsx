import { redirect } from "next/navigation";

export default function AdminShowcaseRedirectPage() {
  redirect("/admin/orders");
}
