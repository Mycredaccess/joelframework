/* Joel Frame Work's free Google Apps Script email + WhatsApp notification flow. */
(function(){
  const cfg=window.JOEL_ORDER_CONFIG||{};
  const emailConfigured=()=>!!(cfg.appsScriptUrl && /^https:\/\/script\.google\.com\/macros\/s\//.test(cfg.appsScriptUrl) && !/PASTE_/.test(cfg.appsScriptUrl));
  const toDataUrl=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});
  async function sendEmail({subject,message,files,previewFile}){
    if(!emailConfigured()) return {sent:false,reason:'Google Apps Script URL is not configured yet. Follow GOOGLE-APPS-SCRIPT-SETUP.txt.'};
    if(!window.JSZip) return {sent:false,reason:'ZIP library could not load. Reload the website and try again.'};
    const zip=new JSZip();
    zip.file('ORDER-DETAILS.txt',message);
    for(const file of files||[]) zip.file(file.name,file);
    const zipBlob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:4}});
    if(zipBlob.size>18*1024*1024) return {sent:false,reason:'Order ZIP is larger than 18 MB. Reduce the photo size and try again.'};
    const zipData=await toDataUrl(zipBlob);
    // Apps Script web apps commonly redirect on POST; use a hidden HTML form to avoid CORS preflight.
    // A cross-origin form cannot read the response, so this means submitted, not confirmed delivered.
    let frame=document.getElementById('joelAppsScriptResponseFrame');
    if(!frame){frame=document.createElement('iframe');frame.id='joelAppsScriptResponseFrame';frame.name='joelAppsScriptResponseFrame';frame.style.display='none';document.body.appendChild(frame)}
    const form=document.createElement('form');form.method='POST';form.action=cfg.appsScriptUrl;form.target=frame.name;form.style.display='none';
    const payload={to_email:cfg.ownerEmail,subject:subject,order_message:message,zip_data:zipData,zip_filename:'Joel-Frame-Works-order-'+Date.now()+'.zip'};
    const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify(payload);form.appendChild(input);document.body.appendChild(form);form.submit();form.remove();
    return {sent:true,submitted:true,reason:'Order submitted to Google Apps Script. Check Gmail to confirm delivery.',size:zipBlob.size};
  }
  function openWhatsApp(message){const url=`https://wa.me/${cfg.ownerWhatsApp||'918610493135'}?text=${encodeURIComponent(message)}`;return window.open(url,'_blank','noopener');}
  function download(file){const a=document.createElement('a'),u=URL.createObjectURL(file);a.href=u;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)}
  async function shareOrderFiles({files,message,filename}){
    if(!window.JSZip) throw new Error('The ZIP library could not load. Please reload the website and try again.');
    const zip=new JSZip();for(const file of files)zip.file(file.name,file);zip.file('WHATSAPP-ORDER-MESSAGE.txt',message);
    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:4}});const bundle=new File([blob],filename||`Joel-Frame-Works-order-${Date.now()}.zip`,{type:'application/zip'});
    if(navigator.share&&navigator.canShare&&navigator.canShare({files:[bundle]})){try{await navigator.share({title:'Joel Frame Work’s order',text:message,files:[bundle]});return {mode:'shared',fileName:bundle.name}}catch(err){if(err&&err.name==='AbortError')return {mode:'cancelled',fileName:bundle.name}}}
    download(bundle);return {mode:'downloaded',fileName:bundle.name};
  }
  window.JoelOrderNotifications={sendEmail,openWhatsApp,download,shareOrderFiles,emailConfigured,ownerEmail:cfg.ownerEmail,ownerWhatsApp:cfg.ownerWhatsApp||'918610493135'};
})();
