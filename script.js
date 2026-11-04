const searchToggle=document.getElementById("searchToggle");
const searchPanel=document.getElementById("searchPanel");
const searchInput=document.getElementById("searchInput");
const menuToggle=document.getElementById("menuToggle");
const mainNav=document.getElementById("mainNav");
const readerBackdrop=document.getElementById("readerBackdrop");
const readerClose=document.getElementById("readerClose");
searchToggle?.addEventListener("click",()=>{searchPanel.classList.toggle("open");if(searchPanel.classList.contains("open"))searchInput.focus();});
menuToggle?.addEventListener("click",()=>mainNav.classList.toggle("open"));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=d=>{const x=new Date(d);return !d||isNaN(x)?"وقت النشر غير متاح":x.toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"});};
let allNews=[];let activeFilter="all";const metaCache=new Map();
function safeUrl(value){try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)?u.href:"";}catch{return "";}}
const topicImages=[
 {key:"football",label:"رياضة",words:["كرة","مباراة","الدوري","منتخب","لاعب","مدرب","أهداف","بطولة","كأس","فيفا","ريال مدريد","الأهلي","الزمالك"],url:"https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=80"},
 {key:"politics",label:"سياسة",words:["رئيس","وزير","حكومة","انتخابات","برلمان","كونجرس","سياسي","دبلوماس","سياسة","اتفاق","ترمب","ترامب"],url:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1000&q=80"},
 {key:"economy",label:"اقتصاد",words:["اقتصاد","استثمار","أسعار","جنيه","دولار","بنك","بورصة","تجارة","وظائف","رواتب","نفط"],url:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=80"},
 {key:"technology",label:"تكنولوجيا",words:["ذكاء اصطناعي","تقنية","تكنولوجيا","إنترنت","هاتف","تطبيق","اختراق","قراصنة","رقمي","روبوت"],url:"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80"},
 {key:"health",label:"صحة",words:["صحة","مرض","مستشفى","طبيب","علاج","دواء","فيروس","لقاح"],url:"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80"},
 {key:"education",label:"تعليم",words:["تعليم","جامعة","مدرسة","طلاب","امتحان","دراسة"],url:"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=80"},
 {key:"weather",label:"طقس",words:["طقس","الأرصاد","درجات الحرارة","أمطار","رياح","حرارة","عاصفة"],url:"https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1000&q=80"},
 {key:"culture",label:"ثقافة وفنون",words:["فن","فنان","فيلم","مسلسل","مهرجان","موسيقى","ثقافة","كتاب","مسرح"],url:"https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=80"},
 {key:"world",label:"العالم",words:["العالم","دولي","أمم المتحدة","أمريكا","إيران","إسرائيل","أوكرانيا","روسيا","الصين","فلسطين","غزة"],url:"https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1000&q=80"},
 {key:"local",label:"محليات",words:["كفر الشيخ","برج البرلس","بلطيم","مطوبس","دسوق","فوه","الحامول","بيلا","قلين","سيدي سالم"],url:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80"}
];
const defaultTopic={key:"general",label:"أخبار",url:"https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80"};
function topicFor(n){const t=((n.title||"")+" "+(n.description||"")).toLocaleLowerCase("ar");return topicImages.find(x=>x.words.some(w=>t.includes(w)))||defaultTopic;}
function card(n,i){
 const topic=topicFor(n);
 const visual='<div class="card-image topic-'+topic.key+'"><img src="'+topic.url+'" alt="صورة توضيحية لقسم '+topic.label+'" loading="lazy"><span>'+topic.label+'</span></div>';
 return '<article class="news-card" data-category="'+esc(n.category)+'"><button class="story-open" type="button" data-index="'+i+'" aria-label="اقرأ '+esc(n.title)+'">'+visual+'<span class="story-title">'+esc(n.title)+'</span></button><div class="card-body"><small>'+esc(n.source||"المصدر الأصلي")+' · '+esc(fmt(n.publishedAt))+'</small><p>'+esc(n.description||"افتح الخبر لقراءة التفاصيل المتاحة.")+'</p><button class="text-link" type="button" data-index="'+i+'">اقرأ الخبر داخل الموقع ←</button></div></article>';
}
function visibleNews(){return allNews.map((n,i)=>({...n,_index:i})).filter(n=>activeFilter==="all"||n.category===activeFilter);}
function render(){const list=visibleNews();document.getElementById("newsGrid").innerHTML=list.slice(0,24).map(n=>card(n,n._index)).join("")||'<p class="loading">لا توجد أخبار في هذا القسم حاليًا.</p>';applySearch();}
function applySearch(){const q=(searchInput?.value||"").trim().toLocaleLowerCase("ar");document.querySelectorAll(".news-card,.latest-item").forEach(el=>{el.style.display=!q||el.textContent.toLocaleLowerCase("ar").includes(q)?"":"none";});}
async function publisherMeta(n){if(metaCache.has(n.link))return metaCache.get(n.link);const task=fetch("/api/article?url="+encodeURIComponent(n.link)).then(r=>r.ok?r.json():null).catch(()=>null);metaCache.set(n.link,task);return task;}
async function openReader(index){
 const n=allNews[index];if(!n)return;
 readerBackdrop.hidden=false;document.body.classList.add("reader-open");
 document.getElementById("readerMeta").textContent=(n.categoryLabel||"أخبار")+" · "+(n.source||"المصدر")+" · "+fmt(n.publishedAt);
 document.getElementById("readerTitle").textContent=n.title;
 document.getElementById("readerText").textContent=n.description||"لا يتوفر ملخص نصي من الخلاصة لهذا الخبر.";
 document.getElementById("readerNote").textContent="المحتوى المعروض هو النص والملخص اللذان وفرتهما خلاصة الأخبار، وليس نسخة كاملة من مقال الناشر.";
 const source=document.getElementById("readerSource");source.href=safeUrl(n.link)||"#";
 const pic=document.getElementById("readerImage");pic.hidden=true;pic.removeAttribute("src");
 const meta=await publisherMeta(n);
 if(meta){
  if(meta.title)document.getElementById("readerTitle").textContent=meta.title;
  if(meta.description&&meta.description.length>document.getElementById("readerText").textContent.length)document.getElementById("readerText").textContent=meta.description;
  if(safeUrl(meta.image)){pic.src=meta.image;pic.hidden=false;pic.onerror=()=>{pic.hidden=true;};}
  const holder=document.querySelector('.card-image[data-image-for="'+index+'"]');
  if(holder&&safeUrl(meta.image)){holder.classList.remove("no-image");holder.innerHTML='<img src="'+esc(meta.image)+'" alt="" loading="lazy"><span>'+esc(n.categoryLabel||"أخبار")+'</span>';}
 }
 readerClose.focus();
}
function closeReader(){readerBackdrop.hidden=true;document.body.classList.remove("reader-open");}
readerClose?.addEventListener("click",closeReader);
readerBackdrop?.addEventListener("click",e=>{if(e.target===readerBackdrop)closeReader();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!readerBackdrop.hidden)closeReader();});
document.getElementById("newsGrid")?.addEventListener("click",e=>{const btn=e.target.closest("[data-index]");if(btn)openReader(Number(btn.dataset.index));});
document.getElementById("leadLink")?.addEventListener("click",()=>{if(allNews[0])openReader(0);});
function renderAll(data){
 allNews=Array.isArray(data.items)?data.items:[];
 const lead=allNews[0];
 if(lead){
  document.getElementById("leadCategory").textContent=lead.categoryLabel||"أبرز الأخبار";
  document.getElementById("leadSource").textContent=lead.source||"مصدر الخبر";
  document.getElementById("leadTitle").textContent=lead.title;
  document.getElementById("leadDescription").textContent=lead.description||"افتح الخبر لقراءة التفاصيل المتاحة.";
  const hero=document.getElementById("leadStory"),leadImage=document.getElementById("leadImage");
  const img=topicFor(lead).url;hero.classList.remove("hero-no-image");leadImage.onerror=()=>{leadImage.style.display="none";hero.classList.add("hero-no-image");};leadImage.onload=()=>{leadImage.style.display="block";hero.classList.remove("hero-no-image");};leadImage.src=img;
 }
 document.getElementById("latestList").innerHTML=allNews.slice(0,8).map((n,i)=>'<button class="latest-item" type="button" data-index="'+i+'"><span class="latest-num">'+String(i+1).padStart(2,"0")+'</span><span><small>'+esc(n.categoryLabel||"أخبار")+'</small><strong>'+esc(n.title)+'</strong><em>'+esc(n.source||"المصدر")+' • '+esc(fmt(n.publishedAt))+'</em></span></button>').join("")||"<p>لا توجد أخبار متاحة حاليًا.</p>";
 render();document.getElementById("feedStatus").textContent="تم تحميل "+allNews.length+" خبرًا. يتم فحص الخلاصة كل ساعة.";
}
document.getElementById("latestList")?.addEventListener("click",e=>{const btn=e.target.closest("[data-index]");if(btn)openReader(Number(btn.dataset.index));});
async function loadNews(){try{const r=await fetch("/api/news",{headers:{Accept:"application/json"},cache:"no-store"});if(!r.ok)throw new Error("خدمة الأخبار غير متاحة مؤقتًا");const data=await r.json();if(!Array.isArray(data.items))throw new Error("بيانات الأخبار غير مكتملة");renderAll(data);}catch(e){const status=document.getElementById("feedStatus");if(!allNews.length){document.getElementById("leadTitle").textContent="تعذر تحميل الأخبار حاليًا";document.getElementById("leadDescription").textContent="سنحاول الاتصال بالمصادر مرة أخرى تلقائيًا.";}if(status)status.textContent=allNews.length?"تعذر التحديث؛ نعرض آخر نسخة متاحة.":e.message;}}
document.getElementById("filters")?.addEventListener("click",e=>{const btn=e.target.closest("button[data-filter]");if(!btn)return;activeFilter=btn.dataset.filter;document.querySelectorAll("#filters button").forEach(b=>b.classList.toggle("active",b===btn));render();});
searchInput?.addEventListener("input",applySearch);
document.getElementById("todayDate").textContent=new Date().toLocaleDateString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
loadNews();setInterval(loadNews,60*60*1000);