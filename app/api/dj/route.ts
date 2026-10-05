import { NextRequest,NextResponse } from "next/server";
export const dynamic="force-dynamic";
type T={id:string;title:string;artist?:string;bpm?:number;key?:string;energy?:number};type S={running:boolean;current:T|null;queue:T[];history:Record<string,number>;updatedAt:number};
declare global{var __mixoDJState:S|undefined}
const state:S=globalThis.__mixoDJState??{running:false,current:null,queue:[],history:{},updatedAt:Date.now()};globalThis.__mixoDJState=state;
function clean(){const c=Date.now()-86400000;for(const[id,t]of Object.entries(state.history))if(t<c)delete state.history[id]}
function reply(){clean();state.updatedAt=Date.now();return NextResponse.json(state,{headers:{"Cache-Control":"no-store"}})}
function catalog(b:any):T[]{return Array.isArray(b.catalog)?b.catalog.filter((x:any)=>x?.id&&x?.title).map((x:any)=>({id:String(x.id),title:String(x.title),artist:x.artist?String(x.artist):undefined,bpm:Number.isFinite(Number(x.bpm))?Number(x.bpm):undefined,key:x.key?String(x.key):undefined,energy:Number.isFinite(Number(x.energy))?Number(x.energy):undefined})):[]}
function choose(b:any){const a=catalog(b).filter(t=>t.id!==state.current?.id&&!state.history[t.id]&&!state.queue.some(q=>q.id===t.id));if(!a.length)return null;const cur=catalog(b).find(t=>t.id===state.current?.id)||state.current;const scored=a.map(t=>{let score=Math.random()*8;if(cur?.bpm&&t.bpm){const d=Math.abs(cur.bpm-t.bpm);score+=d<=4?42:d<=8?30:d<=16?16:0}if(cur?.key&&t.key){const same=t.key===cur.key,near=aKey(cur.key)===aKey(t.key)||aKey(cur.key,7)===aKey(t.key);score+=same?34:near?20:0}if(cur?.energy!=null&&t.energy!=null){const d=Math.abs(cur.energy-t.energy);score+=d<.08?22:d<.18?16:d<.3?8:0}return{t,score}});scored.sort((x,y)=>y.score-x.score);return scored[0].t}
function aKey(k:string,offset=0){const m=(k||"").match(/^(C#|D#|F#|G#|A#|C|D|E|F|G|A|B)/);if(!m)return"";const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];return names[(names.indexOf(m[1])+offset+12)%12]}
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