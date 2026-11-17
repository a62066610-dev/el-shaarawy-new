const PASSWORD = "86518651";
let pendingAction = 'upload'; // هنعمل ايه بعد الباسورد؟ رفع ولا حذف

try {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
} catch(e){}

// === دوس على زرار رفع الجدول - يطلب باسورد كل مرة ===
function onUploadClick(){
  pendingAction = 'upload';
  document.getElementById('passInput').value = '';
  document.getElementById('loginModal').style.display='flex';
  document.getElementById('err').style.display='none';
  setTimeout(()=>document.getElementById('passInput').focus(), 100);
}

// === دوس على زرار حذف - يطلب باسورد كل مرة برضه ===
function onDeleteClick(){
  pendingAction = 'delete';
  document.getElementById('passInput').value = '';
  document.getElementById('loginModal').style.display='flex';
  document.getElementById('err').style.display='none';
  setTimeout(()=>document.getElementById('passInput').focus(), 100);
}

function closeLogin(){document.getElementById('loginModal').style.display='none';}

// === لما يكتب الباسورد ويدوس دخول ===
function checkPass(){
  const v = document.getElementById('passInput').value.trim();
  if(v === PASSWORD){
    document.getElementById('passInput').value='';
    closeLogin();
    // بعد ما دخل صح، اعمل اللي كان عايزه
    if(pendingAction === 'upload'){
      document.getElementById('fileInput').click();
    } else if(pendingAction === 'delete'){
      doDelete();
    }
  } else {
    document.getElementById('err').style.display='block';
  }
}

function doDelete(){
  if(!confirm('متأكد عايز تحذف الملف ده؟')) return;
  localStorage.removeItem('savedTables');
  localStorage.removeItem('savedStatus');
  document.getElementById('tables').innerHTML = '<div class="empty">لا يوجد جدول معروض حالياً</div>';
  document.getElementById('status').textContent = 'تم حذف الملف - تقدر ترفع واحد جديد';
  updateUI();
}

function updateUI(){
  const hasFile = !!localStorage.getItem('savedTables');
  document.getElementById('deleteBtn').style.display = hasFile ? 'block' : 'none';
}

// === رفع الملف وتحويله لصورة بالظبط زي PDF ===
document.getElementById('fileInput').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  if (typeof pdfjsLib === 'undefined'){ alert('النت ضعيف، اعمل Refresh وحاول تاني'); return; }
  document.getElementById('status').textContent = 'جارِ تحويل الجدول...';
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data: buf}).promise;
  let html = '';
  for(let p=1; p<=pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({scale: 2});
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({canvasContext: ctx, viewport: viewport}).promise;
    const imgData = canvas.toDataURL('image/png');
    html += `<div class="card"><h3>الصفحة ${p}</h3><img src="${imgData}" oncontextmenu="return false" draggable="false"></div>`;
  }
  document.getElementById('tables').innerHTML = html;
  document.getElementById('status').textContent = `تم عرض ${pdf.numPages} صفحة بالظبط زي الـ PDF`;
  localStorage.setItem('savedTables', html);
  localStorage.setItem('savedStatus', document.getElementById('status').textContent);
  updateUI();
  e.target.value = '';
});

// أول ما الصفحة تفتح
const saved = localStorage.getItem('savedTables');
if(saved){ document.getElementById('tables').innerHTML=saved; document.getElementById('status').textContent=localStorage.getItem('savedStatus')||''; }
updateUI();

document.addEventListener('contextmenu', e=>{
  if(e.target.tagName==='IMG') e.preventDefault();
});