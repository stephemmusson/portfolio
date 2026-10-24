/* Google Analytics loads only after an explicit opt-in, on the deployed site. */
(() => {
  const measurementId='G-GMQVGS6W66';
  const preferenceKey='henson-smith-analytics-consent-v1';
  const isPreview=document.body.dataset.preview==='true'||['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname)||location.protocol==='file:';
  const settings=document.querySelector('.analytics-settings');
  let loaded=false;
  window['ga-disable-'+measurementId]=true;
  function readChoice(){try{return localStorage.getItem(preferenceKey);}catch{return null;}}
  function saveChoice(value){try{localStorage.setItem(preferenceKey,value);}catch{/* Choice applies for this visit when storage is unavailable. */}}
  function startAnalytics(){
    if(isPreview||loaded)return;
    loaded=true;window['ga-disable-'+measurementId]=false;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js',new Date());
    window.gtag('config',measurementId,{allow_google_signals:false,allow_ad_personalization_signals:false});
    const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;document.head.append(script);
  }
  function removeAnalyticsCookies(){
    const labels=location.hostname.split('.');const domains=[''];
    for(let i=0;i<labels.length-1;i++)domains.push(labels.slice(i).join('.'),'.'+labels.slice(i).join('.'));
    const paths=['/'];const parts=location.pathname.split('/').filter(Boolean);let path='';for(const part of parts){path+='/'+part;paths.push(path,path+'/');}
    document.cookie.split(';').map(c=>c.trim().split('=')[0]).filter(n=>/^_ga(?:_|$)|^_gid$|^_gat/.test(n)).forEach(name=>domains.forEach(domain=>paths.forEach(path=>{document.cookie=name+'=; Max-Age=0; Path='+path+(domain?'; Domain='+domain:'')+'; SameSite=Lax';})));
  }
  const panel=document.createElement('section');panel.className='analytics-choice';panel.hidden=true;panel.setAttribute('aria-label','Website analytics choice');
  const heading=document.createElement('h2');heading.textContent='A LITTLE FEEDBACK ON THE MUSIC.';
  const text=document.createElement('p');text.textContent=isPreview?'Google Analytics is disabled in this development preview. On the live site, visitors can accept or decline analytics.':'With your permission, Google Analytics helps us understand visits and how the site is used. Google receives usage and device information and analytics cookies are stored in your browser. Declining keeps Google Analytics off. Change your choice at any time using “Analytics settings” in the footer.';
  const policy=document.createElement('a');policy.href='https://policies.google.com/privacy';policy.target='_blank';policy.rel='noopener';policy.textContent='Google privacy information ↗';
  const actions=document.createElement('div');actions.className='analytics-actions';
  function hidePanel(){panel.hidden=true;}
  function choose(value){saveChoice(value);if(value==='accepted')startAnalytics();else{window['ga-disable-'+measurementId]=true;if(window.gtag)window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});removeAnalyticsCookies();}hidePanel();settings?.focus();}
  if(!isPreview){for(const [label,value] of [['DECLINE','declined'],['ACCEPT ANALYTICS','accepted']]){const button=document.createElement('button');button.textContent=label;button.addEventListener('click',()=>choose(value));actions.append(button);}}
  else{const close=document.createElement('button');close.textContent='CLOSE';close.addEventListener('click',hidePanel);actions.append(close);}
  panel.append(heading,text,policy,actions);document.body.append(panel);
  settings?.addEventListener('click',()=>{panel.hidden=false;panel.querySelector('button')?.focus();});
  if(isPreview)return;
  const choice=readChoice();if(choice==='accepted')startAnalytics();else if(choice!=='declined')panel.hidden=false;
})();
