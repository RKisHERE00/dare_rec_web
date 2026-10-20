const steps=[...document.querySelectorAll('.form-step')], indicators=[...document.querySelectorAll('.step')], progressBar=document.querySelector('#progressBar'), progressLabel=document.querySelector('#progressLabel'), progressPercent=document.querySelector('#progressPercent'), form=document.querySelector('#axiosForm'), roleSelect=document.querySelector('#roleSelect'), programSelect=document.querySelector('#programSelect'), roleLabel=document.querySelector('#roleLabel'), roleLockNote=document.querySelector('#roleLockNote'), reviewBox=document.querySelector('#reviewBox'), status=document.querySelector('#formStatus'), resumeInput=document.querySelector('#resume'), resumeName=document.querySelector('#resumeName'), chosenHero=document.querySelector('#chosenHero'), heroPreview=document.querySelector('#heroSelectionPreview'), modal=document.querySelector('#applyModal'), siteProgress=document.querySelector('#siteProgress'), soundToggle=document.querySelector('#soundToggle'), soundLabel=document.querySelector('#soundLabel'), siteAudio=document.querySelector('#siteAudio');
let current=0;
const roleMeta={
 'Data Science and Analytics':['HARRY POTTER','DATA SCIENCE & ANALYTICS','DATA SCIENCE AND ANALYTICS','assets/characters/harry-data-science.jpg'],
 'AI and ML':['RON WEASLEY','ARTIFICIAL INTELLIGENCE & MACHINE LEARNING','AI AND ML','assets/characters/ron-ai-ml.jpg'],
 'Competitive Programming':['HERMIONE GRANGER','COMPETITIVE PROGRAMMING','COMPETITIVE PROGRAMMING','assets/characters/hermione-competitive-programming.jpg'],
 'Web Dev':['SEVERUS SNAPE','WEB DEVELOPMENT','WEB DEV','assets/characters/snape-web-dev.jpg'],
 'Event Team':['RUBEUS HAGRID','EVENTS & EXPERIENCES','EVENT TEAM','assets/characters/hagrid-event-team.jpg'],
 'PR & Outreach Team':['ALASTOR MOODY','PR & OUTREACH','PR & OUTREACH TEAM','assets/characters/moody-pr-outreach.jpg'],
 'Social Media Team':['BELLATRIX LESTRANGE','SOCIAL MEDIA','SOCIAL MEDIA TEAM','assets/characters/bellatrix-social-media.jpg'],
 'Video Editor':['ALBUS DUMBLEDORE','VIDEO EDITING','VIDEO EDITOR','assets/characters/dumbledore-video-editor.jpg'],
 'Graphic Designer':['MINERVA MCGONAGALL','GRAPHIC DESIGN','GRAPHIC DESIGNER','assets/characters/mcgonagall-graphic-design.jpg'],
 'Volunteer':['LORD VOLDEMORT','FIRST-YEAR VOLUNTEER','VOLUNTEER ONLY','assets/characters/voldemort-volunteer.jpg']
};
const leadershipRoles=Object.keys(roleMeta).filter(role=>role!=='Volunteer');
function showStep(index){current=Math.max(0,Math.min(index,steps.length-1));steps.forEach((s,i)=>s.classList.toggle('active',i===current));indicators.forEach((s,i)=>s.classList.toggle('active',i<=current));const pct=((current+1)/steps.length)*100;progressBar.style.width=`${pct}%`;progressLabel.textContent=`0${current+1} / 0${steps.length}`;progressPercent.textContent=`${Math.round(pct)}%`}
function validateStep(){const fields=[...steps[current].querySelectorAll('input[required], select[required], textarea[required]')];for(const field of fields){if(field.type==='checkbox'&&!field.checked){field.focus();return false}if(field.type==='file'&&!field.files.length){field.focus();return false}if(field.type!=='checkbox'&&field.type!=='file'&&!field.value.trim()){field.focus();field.animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:220});return false}}return true}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function updateHero(role){
  const meta=roleMeta[role];
  if(!meta){chosenHero.innerHTML='<span>SELECTED SPELL</span><b>UNASSIGNED</b><small>Choose a spell from the roster.</small>';heroPreview.innerHTML='<span>✦</span><div><b>NO SPELL SELECTED</b><small>Select your batch and spell to claim a mission.</small></div>';return}
  chosenHero.innerHTML=`<span>${role==='Volunteer'?'FIRST-YEAR PATH':'SELECTED SPELL'}</span><b>${escapeHtml(meta[0])}</b><small>${escapeHtml(meta[1])} // ${escapeHtml(meta[2])}</small>`;
  const portrait=meta[3]?`<img class="preview-portrait" src="${meta[3]}" alt="">`:'<span>✦</span>';
  const message=role==='Volunteer'?'BTech first-years are assigned as volunteers.':'Selected role preview.';
  heroPreview.innerHTML=`${portrait}<div><b>${escapeHtml(meta[0])}</b><small>${escapeHtml(meta[1])} // ${escapeHtml(meta[2])}. ${message}</small></div>`
}
function values(){const data=Object.fromEntries(new FormData(form).entries());if(roleSelect.disabled)data.role=roleSelect.value;return data}
function buildReview(){const v=values(),m=roleMeta[v.role]||['Unassigned','',''];const items=[['NAME',v.name],['SCHOLAR NO.',v.scholarNo],['PROGRAM',v.academicProgram],['BRANCH',v.branch],['CONTACT',v.contactNo],['EMAIL',v.emailId],['SPELL',m[0]],['ROLE',v.role],['RESUME',resumeInput?.files[0]?.name||'—']];reviewBox.innerHTML=items.map(([k,val])=>`<div class="review-item"><small>${k}</small>${escapeHtml(val||'—')}</div>`).join('')}
function fileToBase64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const r=String(reader.result||''),comma=r.indexOf(',');resolve(comma>=0?r.slice(comma+1):r)};reader.onerror=reject;reader.readAsDataURL(file)})}
function syncProgramRole(){
  const isFirstYear=programSelect.value==='Btech 1st year';
  const previous=roleSelect.value;
  roleSelect.disabled=isFirstYear;
  if(isFirstYear){
    roleSelect.innerHTML='<option value="Volunteer">Volunteer — assigned</option>';
    roleSelect.value='Volunteer';
    roleLabel.textContent='ASSIGNED PATH';
    roleLockNote.hidden=false;
  }else{
    roleSelect.innerHTML='<option value="">Select your spell</option>'+leadershipRoles.map(role=>`<option>${escapeHtml(role)}</option>`).join('');
    roleSelect.value=leadershipRoles.includes(previous)?previous:'';
    roleLabel.textContent='CHOOSE YOUR SPELL / TEAM ROLE *';
    roleLockNote.hidden=true;
  }
  updateHero(roleSelect.value);
}
function openModal(role=''){playBackgroundMusic();modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';if(role==='Volunteer')programSelect.value='Btech 1st year';syncProgramRole();if(role&&role!=='Volunteer'&&!roleSelect.disabled&&roleMeta[role]){roleSelect.value=role;updateHero(role)}showStep(0);setTimeout(()=>modal.querySelector('input,select,textarea,button')?.focus(),80)}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow=''}
async function playBackgroundMusic(){
  if(!siteAudio)return false;
  try{await siteAudio.play();setSoundState('MUTE MUSIC',true);return true}
  catch(error){setSoundState('TAP FOR MUSIC',false);return false}
}
function setSoundState(label,active=false){
  if(soundLabel)soundLabel.textContent=label;
  soundToggle?.classList.toggle('off',!active);
  soundToggle?.setAttribute('aria-label',active?'Pause background music':'Play background music');
}
function toggleBackgroundMusic(){
  if(siteAudio.paused){playBackgroundMusic()}
  else{siteAudio.pause();setSoundState('PLAY MUSIC',false)}
}
soundToggle?.addEventListener('click',toggleBackgroundMusic);
siteAudio?.addEventListener('play',()=>setSoundState('MUTE MUSIC',true));
siteAudio?.addEventListener('pause',()=>setSoundState('PLAY MUSIC',false));
setSoundState('TAP FOR MUSIC',false);
playBackgroundMusic();
document.querySelectorAll('[data-open-form]').forEach(button=>button.addEventListener('click',()=>openModal()));
document.querySelectorAll('[data-close-modal]').forEach(button=>button.addEventListener('click',closeModal));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal.classList.contains('open'))closeModal();if(event.key.toLowerCase()==='m')toggleBackgroundMusic()});
// Stable interaction layer
function goNext(){
  if(!validateStep()) return;
  if(current===4) buildReview();
  showStep(current+1);
}
document.querySelectorAll('.next-btn').forEach(btn=>btn.addEventListener('click',goNext));
document.querySelectorAll('.back-btn').forEach(btn=>btn.addEventListener('click',()=>showStep(current-1)));
document.querySelectorAll('[data-scroll]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector(btn.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));
document.querySelectorAll('.hero-card').forEach(card=>card.addEventListener('click',()=>openModal(card.dataset.role)));
programSelect?.addEventListener('change',syncProgramRole);roleSelect?.addEventListener('change',e=>updateHero(e.target.value));
resumeInput?.addEventListener('change',()=>{
  const file=resumeInput.files[0];
  resumeName.textContent=file?.name||'DROP YOUR RESUME HERE';
  if(file){
    const maxBytes=(window.DARE_FORM_CONFIG?.MAX_RESUME_MB||5)*1024*1024;
    if(file.size>maxBytes){
      resumeInput.value='';
      resumeName.textContent='DROP YOUR RESUME HERE';
      status.textContent=`RESUME TOO LARGE — MAX ${window.DARE_FORM_CONFIG?.MAX_RESUME_MB||5} MB`;
    } else status.textContent='';
  }
});

let submissionFrame=null;
let submissionTimer=null;
let submissionHandled=false;
function submitViaHiddenFrame(cfg,data){
  return new Promise((resolve,reject)=>{
    submissionHandled=false;
    const iframe=document.createElement('iframe');
    iframe.name='axiosSubmissionFrame_'+Date.now();
    iframe.style.display='none';
    iframe.setAttribute('aria-hidden','true');
    document.body.appendChild(iframe);

    const wireForm=document.createElement('form');
    wireForm.action=cfg.APPS_SCRIPT_URL;
    wireForm.method='POST';
    wireForm.target=iframe.name;
    wireForm.style.display='none';
    Object.entries(data).forEach(([key,value])=>{
      const input=document.createElement('input');
      input.type='hidden'; input.name=key; input.value=value??'';
      wireForm.appendChild(input);
    });
    document.body.appendChild(wireForm);
    submissionFrame=iframe;

    const cleanup=()=>{
      clearTimeout(submissionTimer);
      window.removeEventListener('message',msgHandler);
      wireForm.remove(); iframe.remove(); submissionFrame=null;
    };
    const resolveOnce=(d)=>{ if(submissionHandled)return; submissionHandled=true; cleanup(); resolve(d); };
    const rejectOnce=(err)=>{ if(submissionHandled)return; submissionHandled=true; cleanup(); reject(err); };
    const msgHandler=(event)=>{
      const d=event.data;
      if(!d || d.source!=='axios-recruitment' || submissionHandled) return;
      if(d.ok) resolveOnce(d); else rejectOnce(new Error(d.message||'Submission failed.'));
    };
    window.addEventListener('message',msgHandler);

    // Fallback for browsers that block the cross-origin postMessage response:
    // the iframe loading twice means the POST response has completed.
    let loadCount=0;
    iframe.addEventListener('load',()=>{
      loadCount += 1;
      if(loadCount >= 2){
        setTimeout(()=>{ if(!submissionHandled) resolveOnce({ok:true,message:'Submission completed.'}); },500);
      }
    });

    submissionTimer=setTimeout(()=>rejectOnce(new Error('Upload timed out. Please check the Apps Script deployment and try again.')),45000);
    wireForm.submit();
  });
}

form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!validateStep()) return;
  const cfg=window.DARE_FORM_CONFIG||{};
  const v=values();
  const resume=resumeInput?.files[0];
  if(!cfg.APPS_SCRIPT_URL){status.textContent='BACKEND URL IS NOT CONFIGURED.';return;}
  const maxBytes=(cfg.MAX_RESUME_MB||5)*1024*1024;
  if(resume && resume.size>maxBytes){status.textContent=`RESUME TOO LARGE — MAX ${cfg.MAX_RESUME_MB||5} MB.`;return;}

  const submitBtn=form.querySelector('button[type="submit"]');
  submitBtn.disabled=true;
  status.textContent=resume?'ASSEMBLING APPLICATION + UPLOADING RESUME…':'ASSEMBLING APPLICATION…';
  try{
    const resumeBase64=resume?await fileToBase64(resume):'';
    await submitViaHiddenFrame(cfg,{ 
      name:v.name||'', scholarNo:v.scholarNo||'', academicProgram:v.academicProgram||'',
      contactNo:v.contactNo||'', emailId:v.emailId||'', branch:v.branch||'', role:v.role||'',
      whyInterested:v.whyInterested||'', resumeName:resume?.name||'',
      resumeMimeType:resume?.type||'', resumeBase64
    });
    status.textContent=resume?'APPLICATION SUBMITTED ✓ — RESUME SAVED TO DRIVE.':'APPLICATION SUBMITTED ✓ — RESUME WAS OPTIONAL AND WAS NOT UPLOADED.';
    setTimeout(()=>{form.reset(); resumeName.textContent='DROP YOUR RESUME HERE'; syncProgramRole(); updateHero(''); showStep(0); closeModal();},1200);
  }catch(err){
    console.error(err);
    status.textContent=`SUBMISSION FAILED — ${err.message||'PLEASE TRY AGAIN.'}`;
  }finally{submitBtn.disabled=false;}
});

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('is-visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
document.addEventListener('pointermove',e=>{const glow=document.querySelector('.cursor-glow');if(glow){glow.style.left=`${e.clientX}px`;glow.style.top=`${e.clientY}px`}});
window.addEventListener('scroll',()=>{const h=document.documentElement.scrollHeight-window.innerHeight;const pct=h>0?(window.scrollY/h)*100:0;if(siteProgress)siteProgress.style.width=`${pct}%`});
showStep(0); syncProgramRole(); updateHero('');
