const searchToggle=document.getElementById("searchToggle");
const searchPanel=document.getElementById("searchPanel");
const searchInput=document.getElementById("searchInput");
const menuToggle=document.getElementById("menuToggle");
const mainNav=document.getElementById("mainNav");
searchToggle?.addEventListener("click",()=>{searchPanel.classList.toggle("open");if(searchPanel.classList.contains("open"))searchInput.focus();});
menuToggle?.addEventListener("click",()=>mainNav.classList.toggle("open"));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=d=>{const x=new Date(d);return !d||isNaN(x)?"وقت النشر غير متاح":x.toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"});};
let allNews=[];let activeFilter="all";
function safeUrl(value){try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)?u.href:"";}catch{return "";}}
function categoryVisual(category){return category==="egypt"?"مصر":category==="local"?"محليات":"العالم";}
function card(n){
 const img=safeUrl(n.image);
 const visual=img?`<div class="card-image"><img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('no-image');this.remove()"><span>${esc(n.categoryLabel||"أخبار")}</span></div>`:`<div class="card-image no-image"><span>${esc(n.categoryLabel||"أخبار")}</span><b>${esc(categoryVisual(n.category))}</b></div>`;
 return `<article class="news-card" data-category="${esc(n.category)}">${visual}<div class="card-body"><small>${esc(n.source||"المصدر الأصلي")}</small><h3>${esc(n.title)}</h3><p>${esc(n.description||"تابع تفاصيل الخبر من المصدر الأصلي.")}</p><a href="${esc(safeUrl(n.link)||"#")}" target="_blank" rel="noopener noreferrer">اقرأ لدى المصدر ←</a><p class="news-time">${esc(fmt(n.publishedAt))}</p></div></article>`;
}
function visibleNews(){return allNews.filter(n=>activeFilter==="all"||n.category===activeFilter);}
function render(){
 const list=visibleNews();
 document.getElementById("newsGrid").innerHTML=list.slice(0,24).map(card).join("")||'<p class="loading">لا توجد أخبار في هذا القسم حاليًا.</p>';
 applySearch();
}
function applySearch(){
 const q=(searchInput?.value||"").trim().toLocaleLowerCase("ar");
 document.querySelectorAll(".news-card,.latest-item").forEach(el=>{el.style.display=!q||el.textContent.toLocaleLowerCase("ar").includes(q)?"":"none";});
}
function renderAll(data){
 allNews=Array.isArray(data.items)?data.items:[];
 const lead=allNews[0];
 if(lead){
  document.getElementById("leadCategory").textContent=lead.categoryLabel||"أبرز الأخبار";
  document.getElementById("leadSource").textContent=lead.source||"مصدر الخبر";
  document.getElementById("leadTitle").textContent=lead.title;
  document.getElementById("leadDescription").textContent=lead.description||"اقرأ التفاصيل من المصدر الأصلي.";
  const hero=document.getElementById("leadStory"),leadImage=document.getElementById("leadImage");
  const img=safeUrl(lead.image);
  if(img){leadImage.src=img;leadImage.style.display="block";leadImage.onerror=()=>{leadImage.style.display="none";hero.classList.add("hero-no-image");};}
  else{leadImage.style.display="none";hero.classList.add("hero-no-image");}
  const link=document.getElementById("leadLink");link.href=safeUrl(lead.link)||"#";link.target="_blank";link.rel="noopener noreferrer";link.textContent="اقرأ الخبر لدى المصدر ←";
 }
 document.getElementById("latestList").innerHTML=allNews.slice(0,8).map((n,i)=>`<a class="latest-item" href="${esc(safeUrl(n.link)||"#")}" target="_blank" rel="noopener noreferrer"><span class="latest-num">${String(i+1).padStart(2,"0")}</span><span><small>${esc(n.categoryLabel||"أخبار")}</small><strong>${esc(n.title)}</strong><em>${esc(n.source||"المصدر")} • ${esc(fmt(n.publishedAt))}</em></span></a>`).join("")||"<p>لا توجد أخبار متاحة حاليًا.</p>";
 document.getElementById("feedStatus").textContent=`تم جلب ${allNews.length} خبرًا. آخر تحديث للخلاصة: ${fmt(data.updatedAt)}. يجري فحص الأخبار كل ساعة.`;
 render();
}
async function loadNews(){
 try{const r=await fetch("/api/news",{headers:{Accept:"application/json"},cache:"no-store"});if(!r.ok)throw new Error("خدمة الأخبار غير متاحة مؤقتًا");const data=await r.json();if(!Array.isArray(data.items))throw new Error("بيانات الأخبار غير مكتملة");renderAll(data);}
 catch(e){const status=document.getElementById("feedStatus");if(!allNews.length){document.getElementById("leadTitle").textContent="تعذر تحميل الأخبار حاليًا";document.getElementById("leadDescription").textContent="سنحاول الاتصال بالمصادر مرة أخرى تلقائيًا.";}if(status)status.textContent=allNews.length?"تعذر التحديث؛ نعرض آخر نسخة متاحة.":e.message;}
}
document.getElementById("filters")?.addEventListener("click",e=>{const btn=e.target.closest("button[data-filter]");if(!btn)return;activeFilter=btn.dataset.filter;document.querySelectorAll("#filters button").forEach(b=>b.classList.toggle("active",b===btn));render();});
searchInput?.addEventListener("input",applySearch);
document.getElementById("todayDate").textContent=new Date().toLocaleDateString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
loadNews();setInterval(loadNews,60*60*1000);