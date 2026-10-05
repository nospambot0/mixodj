import { NextRequest,NextResponse } from "next/server";
export const dynamic="force-dynamic";
type T={id:string;title:string;artist?:string};type S={running:boolean;current:T|null;queue:T[];history:Record<string,number>;updatedAt:number};
declare global{var __mixoDJState:S|undefined}
const state:S=globalThis.__mixoDJState??{running:false,current:null,queue:[],history:{},updatedAt:Date.now()};globalThis.__mixoDJState=state;
function clean(){const c=Date.now()-86400000;for(const[id,t]of Object.entries(state.history))if(t<c)delete state.history[id]}
function reply(){clean();state.updatedAt=Date.now();return NextResponse.json(state,{headers:{"Cache-Control":"no-store"}})}
function catalog(b:any):T[]{return Array.isArray(b.catalog)?b.catalog.filter((x:any)=>x?.id&&x?.title).map((x:any)=>({id:String(x.id),title:String(x.title),artist:x.artist?String(x.artist):undefined})):[]}
function choose(b:any){const a=catalog(b).filter(t=>t.id!==state.current?.id&&!state.history[t.id]&&!state.queue.some(q=>q.id===t.id));return a.length?a[Math.floor(Math.random()*a.length)]:null}
export async function GET(){return reply()}
export async function POST(req:NextRequest){const b=await req.json().catch(()=>({}));const a=b.action;
if(a==="start"){state.running=true;if(!state.current)state.current=choose(b)}
else if(a==="stop")state.running=false;
else if(a==="clear")state.queue=[];
else if(a==="add"){const t=catalog({catalog:[b.track]})[0];if(t&&t.id!==state.current?.id&&!state.queue.some(x=>x.id===t.id))state.queue.push(t);if(!state.current){state.current=state.queue.shift()||null;state.running=true}}
else if(a==="playNow"){const t=catalog({catalog:[b.track]})[0];if(!t)return NextResponse.json({error:"track required"},{status:400});if(state.current)state.queue.unshift(state.current);state.current=t;state.running=true}
else if(a==="next"||a==="syncEnded"){if(state.current)state.history[state.current.id]=Date.now();state.current=state.queue.shift()||choose(b);if(!state.current)state.running=false}
else if(a==="autofill"){while(state.queue.length<5){const t=choose(b);if(!t)break;state.queue.push(t)}}
else return NextResponse.json({error:"Unknown action"},{status:400});
return reply()}