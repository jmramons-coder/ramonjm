import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const cookieName = "study-access";
const lifetime = 60 * 60 * 24 * 7;
function equal(a: string, b: string) { const x=Buffer.from(a), y=Buffer.from(b); return x.length===y.length && timingSafeEqual(x,y); }
function sign(value: string) { return createHmac("sha256", process.env.STUDY_SESSION_SECRET || "").update(value).digest("hex"); }
export function configured() { return Boolean(process.env.STUDY_ACCESS_CODE && process.env.STUDY_SESSION_SECRET); }
export function validCode(code: string) { return configured() && equal(code, process.env.STUDY_ACCESS_CODE!); }
export function issueToken() { const exp=String(Math.floor(Date.now()/1000)+lifetime); return `${exp}.${sign(exp)}`; }
export async function hasAccess() { if (!configured()) return false; const token=(await cookies()).get(cookieName)?.value || ""; const [exp,sig]=token.split("."); return /^\d+$/.test(exp || "") && Number(exp)>Date.now()/1000 && Number(exp)<=Date.now()/1000+lifetime && equal(sig || "",sign(exp)); }
