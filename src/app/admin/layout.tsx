import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: { absolute: "Ona Control Centre" },
  robots: { index: false, follow: false },
  description:
    "Super Admin full control of Customer, Repair Pro, jobs, payments, content & features",
};

/**
 * Admin shell is full-width desktop UI (not the phone frame).
 * Root layout still wraps PhoneShell; admin.css + AdminShell break out.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem("ona-admin-theme");if(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches){t="dark"}if(t){document.documentElement.dataset.theme=t;document.documentElement.classList.toggle("dark",t==="dark");var r=document.currentScript&&document.currentScript.nextElementSibling;if(r)r.setAttribute("data-theme",t)}}catch(e){}`,
        }}
      />
      <div className="om-admin-root">{children}</div>
    </>
  );
}
