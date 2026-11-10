/* Кодове королівство: music manager shared by all pages.
   CKA.music('m06-kurenivka')  loops a track with a crossfade
   CKA.sting('m09-quest-done') plays once over the music, which ducks under it
   CKA.sfx('ui-click',.5)        one-shot sound effect from audio/sfx/ (opts: {quiet:ms} skips it if another effect started within ms, {gap:ms} limits repeats)
   window.CKS(...) is the same as CKA.sfx and is safe to call before this file loads via window.CKS&&CKS(...)
   CKA.vo('intro/n04-camp')       plays a voice line from audio/vo/ (one at a time, music ducks under it); before the first click it waits
   Dialogue lines are voiced automatically: when #dText changes inside a visible #dlg, the closest line from audio/vo/index.js
   (same scene, hero's gender) plays; closing the dialog stops it.
   CKA.mute(true|false)         remembered in localStorage 'ck.audio'
   Browsers may block sound until the first click; the page tries to start at once and, if blocked, the sound button pulses until the first tap. */
(function(){
"use strict";
var BASE='audio/music/',VOL=.5,FADE=1.4;
var st=(function(){try{return JSON.parse(localStorage.getItem('ck.audio'))||{}}catch(e){return {}}})();
var muted=!!st.muted,unlocked=false,cur=null,want=null,duckK=1,pending=null;
function save(){try{localStorage.setItem('ck.audio',JSON.stringify({muted:muted}))}catch(e){}}
function mk(name,loop,dir){var a=new Audio((dir||BASE)+name+'.mp3');a.loop=loop;a.preload='auto';a.volume=0;a._g=0;a._t=0;a._name=name;return a;}
var tracks=[],voDuck=1;
function tick(){var dt=1/30;tracks.forEach(function(a){var tgt=a._t*(a._sting?1:a._amb?(voDuck<1?.7:1):duckK*voDuck)*(muted?0:(a._amb?AMBV:VOL));a._g+=(tgt-a._g)*Math.min(1,dt/FADE*4);if(Math.abs(a._g-tgt)<.002)a._g=tgt;try{a.volume=Math.max(0,Math.min(1,a._g));}catch(e){}
  if(a._t===0&&a._g<.003&&!a.paused){a.pause();}});
  tracks=tracks.filter(function(a){return !(a._t===0&&a.paused&&a!==cur&&!a._amb);});}
setInterval(tick,1000/30);
function start(a){if(muted)return;if(!unlocked){probe(a);return;}var p=a.play();if(p&&p.catch)p.catch(function(){});}
/* try to start without a click: works when the browser already allows sound on this site (e.g. after clicking on the previous page) */
var probing=false;function probe(a){if(probing||unlocked)return;probing=true;try{var p=a.play();if(p&&p.then)p.then(function(){probing=false;unlock();},function(){probing=false;a.pause();locked();});else{probing=false;}}catch(e){probing=false;}}
function locked(){if(unlocked||!btn)return;btn.classList.add('ck-wait');btn.title='Торкнись будь-де, щоб увімкнути звук';}
function music(name){want=name;if(cur&&cur._name===name){cur._t=1;start(cur);return;}
  if(cur)cur._t=0;cur=null;if(!name)return;cur=mk(name,true);cur._t=1;tracks.push(cur);start(cur);}
function sting(name,opts){opts=opts||{};if(!unlocked||muted)return;var a=mk(name,false);a._sting=1;a._t=1;a._g=muted?0:VOL;a.volume=a._g;tracks.push(a);
  duckK=opts.duck==null?.25:opts.duck;var p=a.play();if(p&&p.catch)p.catch(function(){});
  a.addEventListener('ended',function(){a._t=0;duckK=1;});}
var LAY={},AMBV=.7;
var SFXV=.8,SB='audio/sfx/',SC={},lastS={},lastAny=0;
function sfx(name,v,o){o=o||{};if(!unlocked||muted||document.hidden)return;var now=Date.now();
  if(o.quiet&&now-lastAny<o.quiet)return;if(lastS[name]&&now-lastS[name]<(o.gap||70))return;lastS[name]=now;lastAny=now;
  var b=SC[name];if(!b){b=SC[name]=new Audio(SB+name+'.mp3');b.preload='auto';}
  var a=b.paused||b.ended?b:b.cloneNode();try{a.currentTime=0;}catch(e){}
  a.volume=Math.max(0,Math.min(1,SFXV*(v==null?1:v)));var p=a.play();if(p&&p.catch)p.catch(function(){});}
/* ---- voice ---- */
var VOV=1,voA=null,voPend=null,once={};
function voStop(){voPend=null;if(voA){try{voA.pause();}catch(e){}voA=null;}voDuck=1;}
function vo(id,o){o=o||{};if(o.once){if(once[id])return;once[id]=1;}
  voStop();if(muted)return;if(!unlocked){voPend=id;return;}
  var a=voA=new Audio('audio/vo/'+id+'.mp3');a.volume=VOV;voDuck=.4;
  a.addEventListener('ended',function(){if(voA===a){voA=null;voDuck=1;}});var p=a.play();if(p&&p.catch)p.catch(function(){if(voA===a){voA=null;voDuck=1;}});}
var TERMS=[[/ дабл ю пі ей три /g,' wpa3 '],[/ дабл ю пі ей два /g,' wpa2 '],[/ дабл ю пі ей /g,' wpa '],[/ ю ес бі /g,' usb '],[/ веп /g,' wep '],[/ ван /g,' wan '],[/ лан /g,' lan ']];
function nrm(t){t=' '+String(t||'').toLowerCase().replace(/[’']/g,'').replace(/[^0-9a-zа-щьюяґєії]+/g,' ')+' ';TERMS.forEach(function(r){t=t.replace(r[0],r[1]);});return t.trim();}
function bg(t){var m={};for(var i=0;i<t.length-1;i++){var b=t.substr(i,2);m[b]=(m[b]||0)+1;}return m;}
function dice(a,b){var n=0,ta=0,tb=0,k;for(k in a){ta+=a[k];if(b[k])n+=Math.min(a[k],b[k]);}for(k in b)tb+=b[k];return ta+tb?2*n/(ta+tb):0;}
var SCENE=/kurenivka/.test(location.pathname)?'kur':/camp/.test(location.pathname)?'camp':'',IDX=null;
function heroSex(){try{var d=JSON.parse(localStorage.getItem('ck.v1'))||{},u=d.session&&d.users&&d.users[d.session];return u&&u.hero&&u.hero.sex==='f'?'f':'m';}catch(e){return 'm';}}
function voLine(text){if(!window.CKVO||!SCENE)return null;if(!IDX)IDX=window.CKVO.filter(function(e){return e[0].indexOf(SCENE+'/')===0;}).map(function(e){return {id:e[0],g:e[1],b:bg(nrm(e[2]))};});
  var sx=heroSex(),tb=bg(nrm(text)),best=null,bs=0;IDX.forEach(function(e){if(e.g&&e.g!==sx)return;var d=dice(tb,e.b);if(d>bs){bs=d;best=e;}});
  var r={text:text,id:best&&best.id,score:Math.round(bs*100)/100};CKA.voLast=r;(CKA.voLog=CKA.voLog||[]).push(r);
  if(best&&bs>=.6)vo(best.id);else voStop();return r;}
function watchDlg(){var dlg=document.getElementById('dlg'),dt=document.getElementById('dText');if(!dlg||!dt||!SCENE)return;
  var s=document.createElement('script');s.src='audio/vo/index.js';document.head.appendChild(s);var last='';
  new MutationObserver(function(){if(dlg.hidden)return;var t=dt.textContent;if(t&&t!==last){last=t;voLine(t);}}).observe(dt,{childList:true,characterData:true,subtree:true});
  new MutationObserver(function(){if(dlg.hidden){last='';voStop();}}).observe(dlg,{attributes:true,attributeFilter:['hidden']});}
/* every button clicks; on a mouse, a soft brush when the pointer moves onto a new button */
var CLK='button,.btn,[role=button],a[href],summary',hovEl=null;
document.addEventListener('click',function(e){var el=e.target.closest&&e.target.closest(CLK);if(el&&!el.disabled)sfx('ui-click',.5);},true);
document.addEventListener('pointerover',function(e){if(e.pointerType!=='mouse')return;var el=e.target.closest&&e.target.closest(CLK);if(el!==hovEl){hovEl=el;if(el&&!el.disabled)sfx('ui-hover',.22,{gap:90});}},true);
/* ambience layer: CKA.amb('a05-kurenivka',.6); volume 0 pauses it */
function amb(name,v){var a=LAY[name];if(!a){if(!(v>0))return;a=LAY[name]=mk(name,true,'audio/amb/');a._amb=1;tracks.push(a);}a._t=Math.max(0,Math.min(1,v||0));if(a._t>0&&a.paused)start(a);}
function unlock(){if(unlocked)return;unlocked=true;if(btn){btn.classList.remove('ck-wait');}if(voPend){var vp=voPend;voPend=null;setTimeout(function(){vo(vp)},120);}if(cur)start(cur);Object.keys(LAY).forEach(function(k){if(LAY[k]._t>0)start(LAY[k]);});}
['pointerdown','pointerup','mousedown','click','keydown','touchstart','touchend'].forEach(function(ev){window.addEventListener(ev,unlock,{capture:true,passive:true});});
document.addEventListener('visibilitychange',function(){tracks.forEach(function(a){if(document.hidden)a.pause();else if(a._t>0)start(a);});});
function setMute(m){muted=!!m;if(muted)voStop();save();btn.setAttribute('aria-pressed',String(!muted));btn.title=muted?'Увімкнути звук':'Вимкнути звук';btn.innerHTML=muted?ICON_OFF:ICON_ON;if(!muted){if(cur)start(cur);Object.keys(LAY).forEach(function(k){if(LAY[k]._t>0)start(LAY[k]);});}}
var ICON_ON='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
var ICON_OFF='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
var btn=document.createElement('button');btn.type='button';btn.className='ck-snd';
var css=document.createElement('style');css.textContent='.ck-snd{position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:40;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;background:rgba(18,16,13,.82);border:1px solid rgba(201,164,92,.6);color:#ecd39c}.ck-snd:hover{border-color:#ecd39c}.ck-snd.ck-wait{animation:ckw 1.6s ease-in-out infinite}@keyframes ckw{50%{box-shadow:0 0 0 7px rgba(236,211,156,.25);border-color:#ecd39c}}@media (prefers-reduced-motion:reduce){.ck-snd.ck-wait{animation:none;border-color:#ecd39c}}.ck-snd:focus-visible{outline:2px solid #ecd39c;outline-offset:2px}body:has(#dlg:not([hidden])) .ck-snd,body:has(#end:not([hidden])) .ck-snd{display:none}';
document.head.appendChild(css);
btn.onclick=function(e){e.stopPropagation();unlock();setMute(!muted);};
function mount(){document.body.appendChild(btn);setMute(muted);watchDlg();try{if(navigator.userActivation&&navigator.userActivation.hasBeenActive)unlock();}catch(e){}}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
window.CKS=sfx;window.CKA={vo:vo,voStop:voStop,voLine:voLine,music:music,sting:sting,amb:amb,sfx:sfx,mute:setMute,get muted(){return muted},get track(){return want}};
})();
