const searchToggle=document.getElementById('searchToggle');
const searchPanel=document.getElementById('searchPanel');
const searchInput=document.getElementById('searchInput');
const menuToggle=document.getElementById('menuToggle');
const mainNav=document.getElementById('mainNav');
searchToggle?.addEventListener('click',()=>{searchPanel.classList.toggle('open');if(searchPanel.classList.contains('open'))searchInput.focus()});
menuToggle?.addEventListener('click',()=>mainNav.classList.toggle('open'));
searchInput?.addEventListener('input',()=>{const q=searchInput.value.trim();document.querySelectorAll('.news-card,.video-card,.latest-item').forEach(card=>{card.style.display=!q||card.textContent.includes(q)?'':'none'})});
document.getElementById('newsletterForm')?.addEventListener('submit',e=>{e.preventDefault();alert('خدمة النشرة البريدية لم يتم ربطها بعد.');});
