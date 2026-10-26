let installEvent=null;
const installButton=document.getElementById('installApp'),installInfo=document.getElementById('installInfo');
const standalone=window.matchMedia('(display-mode: standalone)');
function installedUI(){if(installButton)installButton.hidden=standalone.matches||navigator.standalone===true;}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;});
window.addEventListener('appinstalled',()=>{installEvent=null;if(installButton)installButton.hidden=true;if(installInfo)installInfo.textContent='A Black Limousine ikon hozzáadva az alkalmazásokhoz.';});
standalone.addEventListener?.('change',installedUI);installedUI();
installButton?.addEventListener('click',async()=>{
 if(installEvent){const prompt=installEvent;installEvent=null;try{await prompt.prompt();const choice=await prompt.userChoice;installInfo.textContent=choice.outcome==='accepted'?'A telepítés jóváhagyva. Keresd a Black Limousine ikont a kezdőképernyőn vagy az alkalmazások között.':'A telepítést most megszakítottad. Később a böngésző menüjéből is hozzáadhatod.';}catch{installInfo.textContent='Nyisd meg Chrome-ban, majd a ⋮ menüben válaszd a Hozzáadás a kezdőképernyőhöz / Alkalmazás telepítése lehetőséget.';}}
 else installInfo.textContent=/iPhone|iPad|iPod/.test(navigator.userAgent)?'Safariban: Megosztás → Főképernyőhöz adás. Az ikon neve Black Limousine.':'Androidon Chrome-ban: ⋮ → Hozzáadás a kezdőképernyőhöz / Alkalmazás telepítése. Számítógépen a böngésző telepítési menüjét használd. Ez megnyitóikon; élő adatot mutató widgetet a webes változat nem ad.';
});
