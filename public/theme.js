(()=>{
 const key='south-tenders-theme',root=document.documentElement,media=globalThis.matchMedia?.('(prefers-color-scheme: dark)');let selected=null;
 try{const value=globalThis.localStorage?.getItem(key);if(value==='light'||value==='dark')selected=value;}catch{}
 const apply=theme=>{
  root.dataset.theme=theme;root.style.colorScheme=theme;
  const button=document.getElementById('theme-toggle');if(!button)return;
  const dark=theme==='dark',action=dark?'Светлая тема':'Тёмная тема';
  button.setAttribute('aria-label',action);button.removeAttribute('aria-pressed');button.title=action;
  const label=button.querySelector('[data-theme-label]');if(label)label.textContent=action;
  for(const name of ['moon','sun']){const icon=button.querySelector('[data-theme-icon="'+name+'"]');if(icon){if((name==='moon')===dark)icon.setAttribute('hidden','');else icon.removeAttribute('hidden');}}
 };
 const system=()=>'dark';apply(selected||system());
 const bind=()=>{const button=document.getElementById('theme-toggle');if(!button||button.dataset.bound)return;button.dataset.bound='true';apply(root.dataset.theme);button.addEventListener('click',()=>{selected=root.dataset.theme==='dark'?'light':'dark';try{globalThis.localStorage?.setItem(key,selected);}catch{}apply(selected);});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
 media?.addEventListener?.('change',()=>{if(!selected)apply(system());});
 globalThis.addEventListener?.('storage',event=>{if(event.key!==key)return;selected=event.newValue==='light'||event.newValue==='dark'?event.newValue:null;apply(selected||system());});
})();

(() => {
 const bind=()=>{
  const fine=()=>matchMedia('(hover:hover) and (pointer:fine)').matches;
  document.querySelectorAll('#theme-toggle,#search-submit').forEach(button=>{
    button.classList.add('managed');
    let pointer=null,inside=false,key=null,suppressClick=false;
    const paint=()=>{button.classList.toggle('is-hovered',inside&&fine());button.classList.toggle('is-pressing',Boolean(key||(pointer!==null&&inside)));};
    const hit=e=>{const r=button.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;};
    const clear=()=>{pointer=null;key=null;inside=false;paint();};
    button.addEventListener('pointerenter',e=>{inside=e.pointerType!=='touch';paint();});
    button.addEventListener('pointerleave',()=>{inside=false;paint();});
    button.addEventListener('pointerdown',e=>{if(button.disabled||e.button!==0)return;pointer=e.pointerId;inside=true;suppressClick=false;button.setPointerCapture?.(pointer);paint();});
    button.addEventListener('pointermove',e=>{if(pointer!==null){inside=hit(e);paint();}});
    button.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;const wasInside=hit(e);pointer=null;inside=wasInside&&e.pointerType!=='touch';suppressClick=!wasInside;paint();if(button.hasPointerCapture?.(e.pointerId))button.releasePointerCapture(e.pointerId);setTimeout(()=>{suppressClick=false},0);});
    button.addEventListener('pointercancel',clear);
    button.addEventListener('lostpointercapture',()=>{if(pointer!==null)clear();});
    button.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);
    button.addEventListener('keydown',e=>{if(button.disabled||e.repeat||![' ','Enter'].includes(e.key))return;key=e.key;if(e.key===' ')e.preventDefault();paint();});
    button.addEventListener('keyup',e=>{if(key!==e.key)return;const space=key===' ';key=null;paint();if(space){e.preventDefault();button.click();}});
    button.addEventListener('blur',clear);window.addEventListener('blur',clear);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  });
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
