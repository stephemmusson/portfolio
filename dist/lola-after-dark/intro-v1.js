'use strict';
(()=>{
const $=s=>document.querySelector(s),body=document.body;
let state='welcome',generation=0,soundOn=false,audio=null,master=null,tones=[],quietTimer=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const panels={welcome:$('.welcome'),intro:$('.intro'),title:$('.title'),quiet:$('.quiet'),explore:$('.explore')};
function show(next){state=next;body.dataset.state=next;for(const [k,p] of Object.entries(panels))p.hidden=k!==next;$('#skip').hidden=next!=='intro';$('#replay').hidden=!['title','quiet','explore'].includes(next);if(next==='quiet')body.classList.add('resting');else body.classList.remove('resting');}
function focus(selector){$(selector).focus({preventScroll:true});}
function schedule(fn,ms,token=generation){setTimeout(()=>{if(token===generation)fn();},ms);}
function title(){generation++;show('title');body.classList.add('woken');focus('#dream');}
function audioStart(){if(!audio){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;audio=new AC();master=audio.createGain();master.gain.value=0;master.connect(audio.destination);for(const [i,hz] of [130.81,196,261.63].entries()){let o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=.018/(i+1);o.connect(g);g.connect(master);o.start();tones.push(o);}}audio.resume().catch(()=>{});master.gain.setTargetAtTime(soundOn?.7:0,audio.currentTime,.5);return true;}
function chime(){if(!soundOn||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.frequency.setValueAtTime(783.99,audio.currentTime);o.frequency.exponentialRampToValueAtTime(523.25,audio.currentTime+.8);g.gain.setValueAtTime(0,audio.currentTime);g.gain.linearRampToValueAtTime(.045,audio.currentTime+.05);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+1.6);o.connect(g);g.connect(master);o.start();o.stop(audio.currentTime+1.7);}
function purr(){if(!soundOn||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=27;g.gain.setValueAtTime(.012,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+2);o.connect(g);g.connect(master);o.start();o.stop(audio.currentTime+2.1);}
function opening(){generation++;clearTimeout(quietTimer);body.classList.remove('woken','resting','stroking');$('.moth').style.left='';$('.moth').style.top='';$('#clock').innerHTML='11:59 <span>PM</span>';$('#caption').textContent='Everyone is asleep.';show('intro');focus('#skip');if(reduced.matches){body.classList.add('woken');$('#clock').innerHTML='12:00 <span>AM</span>';$('#caption').textContent='But the night belongs to Lola.';schedule(title,1500);return;}schedule(()=>{$('#clock').innerHTML='12:00 <span>AM</span>';$('#caption').textContent='But the night belongs to Lola.';chime();},2800);schedule(()=>{body.classList.add('woken');$('#caption').textContent='Something is stirring.';},4700);schedule(()=>{$('#caption').textContent='A familiar house. An unfamiliar night.';},7900);schedule(title,11000);}
$('#begin').addEventListener('click',opening);$('#skip').addEventListener('click',title);$('#replay').addEventListener('click',opening);
$('#sound').addEventListener('click',()=>{soundOn=!soundOn;try{if(!audioStart())soundOn=false;}catch(e){soundOn=false;}$('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound').setAttribute('aria-label',soundOn?'Turn sound off':'Turn sound on');$('#sound').innerHTML=soundOn?'Sound on <span aria-hidden="true">♪</span>':'Sound off <span aria-hidden="true">♪</span>';});
$('#together').addEventListener('click',()=>{generation++;show('quiet');purr();focus('#quiet-back');});$('#quiet-back').addEventListener('click',title);
$('#dream').addEventListener('click',()=>{generation++;show('explore');body.classList.add('woken');$('#hint').textContent='Tap Lola, or follow the glow.';focus('#stroke');});$('#explore-back').addEventListener('click',title);
$('#stroke').addEventListener('click',()=>{body.classList.remove('stroking');void body.offsetWidth;body.classList.add('stroking');$('#hint').textContent='A little head bump. A familiar purr.';purr();schedule(()=>body.classList.remove('stroking'),3000);});
$('#moth').addEventListener('click',()=>{const mobile=matchMedia('(max-aspect-ratio: 1/1)').matches;$('.moth').style.left='90%';$('.moth').style.top=mobile?'48%':'24%';$('#moth').style.left='84%';$('#moth').style.top=mobile?'40%':'15%';chime();$('#hint').textContent='Where will it take her? The first adventure is coming next.';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state!=='welcome')title();});
document.addEventListener('visibilitychange',()=>{if(audio&&master)master.gain.setTargetAtTime(document.hidden?0:(soundOn?.7:0),audio.currentTime,.2);});
for(let i=0;i<24;i++){let s=document.createElement('span');s.style.cssText=`left:${35+Math.random()*60}%;top:${20+Math.random()*65}%;animation-delay:${-Math.random()*12}s;animation-duration:${10+Math.random()*12}s`;$('#dust').append(s);}
// Warm the optional companion scene after the opening assets settle.
window.addEventListener('load',()=>{const img=new Image();img.src='assets/together-v1.webp';});
})();
