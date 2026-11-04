const searchToggle=document.getElementById('searchToggle');
const searchPanel=document.getElementById('searchPanel');
const searchInput=document.getElementById('searchInput');
const menuToggle=document.getElementById('menuToggle');
const mainNav=document.getElementById('mainNav');
searchToggle?.addEventListener('click',()=>{searchPanel.classList.toggle('open');if(searchPanel.classList.contains('open'))searchInput.focus()});
menuToggle?.addEventListener('click',()=>mainNav.classList.toggle('open'));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=d=>{const x=new Date(d);return isNaN(x)?'وقت النشر غير متاح':x.toLocaleString('ar-EG',{dateStyle:'medium',timeStyle:'short'});};
let allNews=[];
function card(n){return `<article class="news-card"><div class="card-image" style="background-image:linear-gradient(0deg,#0008,transparent),url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=70')"><span>${esc(n.categoryLabel)}</span></div><div class="card-body"><small>${esc(n.source||'المصدر الأصلي')}</small><h3>${esc(n.title)}</h3><p>${esc(n.description||'تابع تفاصيل الخبر من المصدر الأصلي.')}</p><a href="${esc(n.link)}" target="_blank" rel="noopener noreferrer">اقرأ لدى المصدر ←</a><p class="news-time">${esc(fmt(n.publishedAt))}</p></div></article>`;}
function render(data){allNews=data.items||[];const lead=allNews[0];if(lead){document.getElementById('leadCategory').textContent=lead.categoryLabel;document.getElementById('leadSource').textContent=lead.source||'مصدر الخبر';document.getElementById('leadTitle').textContent=lead.title;document.getElementById('leadDescription').textContent=lead.description||'اقرأ التفاصيل من المصدر الأصلي.';const link=document.getElementById('leadLink');link.href=lead.link;link.target='_blank';link.rel='noopener noreferrer';link.textContent='اقرأ الخبر لدى المصدر ←';}
const latest=document.getElementById('latestList');latest.innerHTML=allNews.slice(0,7).map((n,i)=>`<a class="latest-item" href="${esc(n.link)}" target="_blank" rel="noopener noreferrer"><span class="latest-num">${String(i+1).padStart(2,'0')}</span><span><small>${esc(n.categoryLabel)}</small><strong>${esc(n.title)}</strong><em>${esc(n.source||'المصدر')} • ${esc(fmt(n.publishedAt))}</em></span></a>`).join('')||'<p>لم تصل أخبار من المصادر الآن. حاول التحديث لاحقًا.</p>';
document.getElementById('newsGrid').innerHTML=allNews.slice(0,12).map(card).join('')||'<p>لا توجد أخبار متاحة حاليًا.</p>';
document.getElementById('feedStatus').textContent=`تم جلب ${allNews.length} خبرًا من خلاصات RSS. آخر فحص: ${new Date().toLocaleTimeString('ar-EG')} — افتح المصدر الأصلي لقراءة التفاصيل.`;
}
async function loadNews(){try{const r=await fetch('/api/news',{headers:{'Accept':'application/json'}});if(!r.ok)throw new Error('تعذر الاتصال بمصدر الأخبار');const data=await r.json();render(data);}catch(e){document.getElementById('leadTitle').textContent='تعذر تحميل الأخبار حاليًا';document.getElementById('leadDescription').textContent='تأكد من نشر نسخة Worker الجديدة، ثم أعد تحميل الصفحة.';document.getElementById('latestList').innerHTML='<p>لم نتمكن من الاتصال بخدمة الأخبار.</p>';document.getElementById('feedStatus').textContent=e.message;}}
searchInput?.addEventListener('input',()=>{const q=searchInput.value.trim().toLowerCase();document.querySelectorAll('.news-card,.latest-item').forEach(card=>{card.style.display=!q||card.textContent.toLowerCase().includes(q)?'':'none'});});
document.getElementById('newsletterForm')?.addEventListener('submit',e=>{e.preventDefault();alert('خدمة النشرة البريدية لم يتم ربطها بعد.');});
document.getElementById('todayDate').textContent=new Date().toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
loadNews();
