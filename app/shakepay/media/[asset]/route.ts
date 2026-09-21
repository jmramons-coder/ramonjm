import { open, stat } from "node:fs/promises";
import path from "node:path";
import { hasAccess } from "../../access";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{asset:string}>}) {
 if(!await hasAccess()) return new Response("Unauthorized",{status:401,headers:{"Cache-Control":"private, no-store"}});
 const {asset}=await params; const files:Record<string,string>={film:"film.mp4",profile:"profile.png",compare:"compare.png","profile-loop":"profile-loop.mp4",potential:"potential.png",poster:"poster.jpg",home:"home.jpg",rewards:"rewards.jpg","home-loop":"home-loop.mp4","rewards-loop":"rewards-loop.mp4","potential-loop":"potential-loop.mp4"}; const name=files[asset];
 if(typeof name!=="string") return new Response("Not found",{status:404});
 const file=path.join(process.cwd(),"private-media",name); const {size}=await stat(file);
 const range=request.headers.get("range"); const match=range?.match(/^bytes=(\d+)-(\d*)$/);
 if(range&&!match) return new Response(null,{status:416,headers:{"Content-Range":`bytes */${size}`}});
 const start=match?Number(match[1]):0; const requested=match?.[2]?Number(match[2]):size-1;
 if(start>=size||start>requested) return new Response(null,{status:416,headers:{"Content-Range":`bytes */${size}`}});
 const end=Math.min(requested,size-1); const handle=await open(file,"r");
 const stream=new ReadableStream({async pull(controller){ try { const buffer=Buffer.alloc(Math.min(65536,end-position+1));const {bytesRead}=await handle.read(buffer,0,buffer.length,position); if(!bytesRead){controller.close();await handle.close();return;} position+=bytesRead;controller.enqueue(buffer.subarray(0,bytesRead)); if(position>end){controller.close();await handle.close();} } catch(e){controller.error(e);await handle.close();}},async cancel(){await handle.close();}});let position=start;
 return new Response(stream,{status:match?206:200,headers:{"Content-Type":name.endsWith(".mp4")?"video/mp4":name.endsWith(".png")?"image/png":"image/jpeg","Content-Length":String(end-start+1),"Accept-Ranges":"bytes",...(match?{"Content-Range":`bytes ${start}-${end}/${size}`} : {}),"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"}});
}
