const searchToggle=document.getElementById("searchToggle");
const searchPanel=document.getElementById("searchPanel");
const searchInput=document.getElementById("searchInput");
const menuToggle=document.getElementById("menuToggle");
const mainNav=document.getElementById("mainNav");
searchToggle?.addEventListener("click",()=>{searchPanel.classList.toggle("open");if(searchPanel.classList.contains("open"))searchInput.focus();});
menuToggle?.addEventListener("click",()=>mainNav.classList.toggle("open"));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=d=>{const x=new Date(d);return !d||isNaN(x)?"وقت النشر غير متاح":x.toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"});};
const fallbackImages={
  egypt:"https://images.unsplash.com/photo-1539768942893-daf53e448371?auto=format&fit=crop&w=1000&q=80",
  world:"https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1000&q=80",
  local:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80"
};
let allNews=[];
function safeUrl(value){try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)?u.href:"";}catch{return "";}}
function imageFor(n){return safeUrl(n.image)||fallbackImages[n.category]||fallbackImages.world;}
function card(n){const img=imageFor(n);return `<article class="news-card" data-category="${esc(n.category)}"><div class="card-image"><img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallbackImages[n.category]||fallbackImages.world}'"><span>${esc(n.categoryLabel||"أخبار")}</span></div><div class="card-body"><small>${esc(n.source||"المصدر الأصلي")}</small><h3>${esc(n.title)}</h3><p>${esc(n.description||"تابع تفاصيل الخبر من المصدر الأصلي.")}</p><a href="${esc(safeUrl(n.link))}" target="_blank" rel="noopener noreferrer">اقرأ لدى المصدر ←</a><p class="news-time">${esc(fmt(n.publishedAt))}</p></div></article>`;}
function render(data){
 allNews=Array.isArray(data.items)?data.items:[];
 const lead=allNews[0];
 if(lead){
  document.getElementById("leadCategory").textContent=lead.categoryLabel||"أبرز الأخبار";
  document.getElementById("leadSource").textContent=lead.source||"مصدر الخبر";
  document.getElementById("leadTitle").textContent=lead.title;
  document.getElementById("leadDescription").textContent=lead.description||"اقرأ التفاصيل من المصدر الأصلي.";
  const leadImage=document.getElementById("leadImage");leadImage.src=imageFor(lead);leadImage.onerror=()=>{leadImage.onerror=null;leadImage.src=fallbackImages[lead.category]||fallbackImages.world;};
  const link=document.getElementById("leadLink");link.href=safeUrl(lead.link)||"#";link.target="_blank";link.rel="noopener noreferrer";link.textContent="اقرأ الخبر لدى المصدر ←";
 }
 const latest=document.getElementById("latestList");
 latest.innerHTML=allNews.slice(0,8).map((n,i)=>`<a class="latest-item" href="${esc(safeUrl(n.link))}" target="_blank" rel="noopener noreferrer"><span class="latest-num">${String(i+1).padStart(2,"0")}</span><span><small>${esc(n.categoryLabel||"أخبار")}</small><strong>${esc(n.title)}</strong><em>${esc(n.source||"المصدر")} • ${esc(fmt(n.publishedAt))}</em></span></a>`).join("")||"<p>لا توجد أخبار متاحة حاليًا.</p>";
 document.getElementById("newsGrid").innerHTML=allNews.slice(0,18).map(card).join("")||"<p>لا توجد أخبار متاحة حاليًا.</p>";
 document.getElementById("feedStatus").textContent=`تم جلب ${allNews.length} خبرًا. آخر تحديث للخلاصة: ${fmt(data.updatedAt)}. يتم فحص الأخبار كل ساعة.`;
 applySearch();
}
function applySearch(){const q=(searchInput?.value||"").trim().toLocaleLowerCase("ar");document.querySelectorAll(".news-card,.latest-item").forEach(el=>{el.style.display=!q||el.textContent.toLocaleLowerCase("ar").includes(q)?"":"none";});}
async function loadNews({quiet=false}={}){
 try{
  const r=await fetch("/api/news",{headers:{Accept:"application/json"},cache:"no-store"});
  if(!r.ok)throw new Error("خدمة الأخبار غير متاحة مؤقتًا");
  const data=await r.json();if(!Array.isArray(data.items))throw new Error("صيغة بيانات الأخبار غير صحيحة");
  render(data);
 }catch(e){
  const status=document.getElementById("feedStatus");
  if(!allNews.length){document.getElementById("leadTitle").textContent="تعذر تحميل الأخبار حاليًا";document.getElementById("leadDescription").textContent="سنحاول الاتصال بالمصادر مرة أخرى تلقائيًا.";}
  if(status)status.textContent=allNews.length?"تعذر التحديث الآن؛ نعرض آخر أخبار تم تحميلها.":e.message;
 }
}
searchInput?.addEventListener("input",applySearch);
document.getElementById("newsletterForm")?.addEventListener("submit",e=>{e.preventDefault();alert("خدمة النشرة البريدية لم يتم ربطها بعد.");});
document.getElementById("todayDate").textContent=new Date().toLocaleDateString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
loadNews();
setInterval(()=>loadNews({quiet:true}),60*60*1000);