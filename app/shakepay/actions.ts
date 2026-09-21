"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieName, issueToken, validCode } from "./access";
export async function unlock(form: FormData) {
  const code=String(form.get("code") || "");
  if (code.length>128 || !validCode(code)) { await new Promise(resolve=>setTimeout(resolve,1000)); redirect("/shakepay?error=1"); }
  (await cookies()).set(cookieName,issueToken(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/shakepay",maxAge:604800});
  redirect("/shakepay");
}
export async function lock() { (await cookies()).set(cookieName,"",{path:"/shakepay",maxAge:0}); redirect("/shakepay"); }
