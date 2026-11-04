const FEEDS = [
  { key: "egypt", label: "مصر", url: "https://alikhbariya.net/feeds/countries/eg.xml" },
  { key: "world", label: "العالم", url: "https://alikhbariya.net/feeds/countries/xw.xml" },
  { key: "local", label: "محليات", url: "https://alikhbariya.net/feeds/countries/eg.xml", localOnly: true }
];
const LOCAL_WORDS = ["كفر الشيخ","برج البرلس","بلطيم","مطوبس","دسوق","فوه","الحامول","بيلا","قلين","سيدي سالم","الرياض"];
const CACHE_URL = "https://news-pulse.ali-zaza-332011.workers.dev/__internal/news-cache";
const MAX_AGE = 7200;
const ARTICLE_HOSTS = new Set(["alikhbariya.net","www.alikhbariya.net","youm7.com","www.youm7.com","arabic.cnn.com","skynewsarabia.com","www.skynewsarabia.com","noonpost.com","www.noonpost.com","aljazeera.net","www.aljazeera.net","aawsat.com","www.aawsat.com","annahar.com","www.annahar.com","alarabiya.net","www.alarabiya.net","hespress.com","www.hespress.com"]);

function decodeEntities(value = "") {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
}
function textOnly(value = "") {
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," "))
    .replace(/\s+/g," ").trim();
}
function tagValue(xml, name) {
  const re = new RegExp("<(?:[\\w.-]+:)?" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?" + name + "\\s*>","i");
  const m=xml.match(re); return m ? m[1] : "";
}
function imageFrom(item) {
  const candidates = [
    item.match(/<media:content[^>]*(?:url|href)=["']([^"']+)["'][^>]*>/i)?.[1],
    item.match(/<media:thumbnail[^>]*(?:url|href)=["']([^"']+)["'][^>]*>/i)?.[1],
    item.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\//i)?.[1],
    item.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
    item.match(/<image>\s*<url>([\s\S]*?)<\/url>/i)?.[1]
  ];
  for (const raw of candidates) {
    const value=decodeEntities(raw || "").trim();
    try { const u=new URL(value); if(["http:","https:"].includes(u.protocol)) return u.href; } catch {}
  }
  return "";
}
function parseFeed(xml, feed) {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(({1:item})=>{
    const title=textOnly(tagValue(item,"title"));
    const link=textOnly(tagValue(item,"link"));
    const desc=textOnly(tagValue(item,"description") || tagValue(item,"encoded"));
    const date=textOnly(tagValue(item,"pubDate") || tagValue(item,"date"));
    const source=textOnly(tagValue(item,"source")) || "الإخبارية";
    return {title,link,source,description:desc,publishedAt:date,image:imageFrom(item),category:feed.key,categoryLabel:feed.label};
  }).filter(n=>n.title && /^https?:\/\//i.test(n.link));
}
async function getFeed(feed) {
  const response=await fetch(feed.url,{headers:{"User-Agent":"NewsPulse/2.0","Accept":"application/rss+xml, application/xml, text/xml"},cf:{cacheTtl:900,cacheEverything:true}});
  if(!response.ok) throw new Error("HTTP "+response.status);
  let items=parseFeed(await response.text(),feed);
  if(feed.localOnly) items=items.filter(n=>LOCAL_WORDS.some(word=>(n.title+" "+n.description).includes(word)));
  if(!items.length) throw new Error("لا توجد أخبار مطابقة في الخلاصة");
  return items;
}
async function collectNews() {
  const results=await Promise.allSettled(FEEDS.map(getFeed));
  let items=[]; const errors=[];
  results.forEach((r,i)=>{if(r.status==="fulfilled")items.push(...r.value);else errors.push({category:FEEDS[i].key,message:String(r.reason?.message||r.reason)});});
  const seen=new Set();
  items=items.filter(n=>{const key=n.link.split("#")[0];if(seen.has(key))return false;seen.add(key);return true;});
  items.sort((a,b)=>{const da=Date.parse(a.publishedAt)||0,db=Date.parse(b.publishedAt)||0;return db-da;});
  return {items:items.slice(0,60),updatedAt:new Date().toISOString(),errors};
}
async function cachedResponse(request, cache) {
  const key=new Request(CACHE_URL);
  return {key,response:await cache.match(key)};
}
async function refresh(cache, request) {
  const data=await collectNews();
  const key=new Request(CACHE_URL);
  await cache.put(key,new Response(JSON.stringify(data),{headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age="+MAX_AGE}}));
  return data;
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname === "/api/article") {
      let target;
      try { target=new URL(url.searchParams.get("url") || ""); } catch { return Response.json({error:"رابط غير صالح"},{status:400}); }
      if(target.protocol!=="https:" || !ARTICLE_HOSTS.has(target.hostname)) return Response.json({error:"هذا المصدر غير مدعوم للعرض الداخلي بعد"},{status:400});
      try {
        const page=await fetch(target.href,{headers:{"User-Agent":"Mozilla/5.0 (compatible; NewsPulse/1.0)","Accept":"text/html"},redirect:"follow",cf:{cacheTtl:1800}});
        if(!page.ok) throw new Error("publisher unavailable");
        const html=await page.text();
        const meta=(name)=>{
          const tags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
          for(const tag of tags){
            const n=tag.match(/\b(?:property|name)=["']([^"']+)["']/i)?.[1];
            const v=tag.match(/\bcontent=["']([^"']*)["']/i)?.[1];
            if(n===name && v) return decodeEntities(v);
          }
          return "";
        };
        let image=meta("og:image")||meta("twitter:image");
        try { image=new URL(image,target.href).href; } catch { image=""; }
        return Response.json({title:meta("og:title"),description:meta("og:description")||meta("description"),image:image.startsWith("https://")?image:"",url:target.href},{headers:{"Cache-Control":"public, max-age=1800"}});
      } catch { return Response.json({error:"تعذر تحميل بيانات الناشر الآن"},{status:502}); }
    }
    if(url.pathname==="/api/news") {
      const cache= caches.default;
      const {response}=await cachedResponse(request,cache);
      if(response) {
        const headers=new Headers(response.headers);headers.set("X-News-Cache","HIT");
        return new Response(response.body,{status:200,headers});
      }
      try {
        const data=await refresh(cache,request);
        return Response.json(data,{headers:{"Cache-Control":"no-store","X-News-Cache":"MISS"}});
      } catch {
        return Response.json({items:[],updatedAt:new Date().toISOString(),errors:[{category:"all",message:"تعذر جلب الأخبار مؤقتًا"}]},{status:503});
      }
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(event,env,ctx) {
    const cache=caches.default;
    const request=new Request("https://news-pulse-cache.invalid/api/news");
    ctx.waitUntil(refresh(cache,request).catch(()=>{}));
  }
};