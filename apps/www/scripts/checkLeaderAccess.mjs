// Real Vue gates, synthetic authentication, no Firebase or persisted data.
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import vue from '@vitejs/plugin-vue';
import {createSSRApp,h,ref} from 'vue';
import {renderToString} from 'vue/server-renderer';
const root=fileURLToPath(new URL('..',import.meta.url));
globalThis.__calendarAuth={ready:ref(true),user:ref(null),isAdmin:ref(false)};
globalThis.window={sessionStorage:{getItem:()=> 'true'}};
const server=await createServer({root,configFile:false,plugins:[vue(),{
  name:'calendar-access-fixtures',enforce:'pre',
  resolveId(source){
    if(source.endsWith('/features/admin/useAdminAuth')) return '\0auth-fixture';
    if(source==='vue-router') return '\0router-fixture';
  },
  load(id){
    if(id==='\0auth-fixture') return 'export const useAdminAuth = () => globalThis.__calendarAuth;';
    if(id==='\0router-fixture') return `import {h} from 'vue'; export const useRouter = () => ({}); export const RouterLink = {props:['to'],setup(p,{slots}){return ()=>h('a',{href:p.to.path+'?event='+encodeURIComponent(p.to.query.event)},slots.default?.())}};`;
  }
}],resolve:{alias:{'@':`${root}/src`}},ssr:{noExternal:['vue-router']},server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
try{
  const {default:Gate}=await server.ssrLoadModule('/src/components/attendance/AttendanceAccessGate.vue');
  const renderGate=()=>renderToString(createSSRApp({render:()=>h(Gate,null,{default:()=>h('p','PRIVATE ATTENDANCE')})}));
  assert.ok(!(await renderGate()).includes('PRIVATE ATTENDANCE'),'old unlocked-device flag cannot bypass login');
  globalThis.__calendarAuth.user.value={email:'parent@example.test'};
  assert.ok(!(await renderGate()).includes('PRIVATE ATTENDANCE'),'non-leaders cannot see attendance');
  globalThis.__calendarAuth.isAdmin.value=true;
  assert.ok((await renderGate()).includes('PRIVATE ATTENDANCE'),'leaders can see attendance');
  globalThis.__calendarAuth.user.value=null; globalThis.__calendarAuth.isAdmin.value=false;
  assert.ok(!(await renderGate()).includes('PRIVATE ATTENDANCE'),'logging out removes attendance');
  console.log('PASS: attendance requires a signed-in leader, rejects non-leaders and old device unlocks, and hides on logout.');
}finally{await server.close();delete globalThis.__calendarAuth;delete globalThis.window;}
