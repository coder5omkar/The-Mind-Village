import { redirect } from "next/navigation";

// The Council Hall now lives inside the village workspace (view switcher).
export default function ConsolePage() {
  redirect("/app/village");
}
