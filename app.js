/*! OpenFlash ADB client | https://github.com/bobaka10/openflash
 *  Copyright (c) 2026 @bobaka10
 *  SPDX-License-Identifier: MIT. See the LICENSE file. */
/* The flashing code is loaded on demand so the page itself always renders, even if a host serves a file wrongly. */
const lib={};
async function load(){
  if(!lib.ok){
    try{
      const [f,a,hp]=await Promise.all([import("./flash.js"),import("./adb.js"),import("./help.js")]);
      Object.assign(lib,{Flasher:f.Flasher,FastbootError:f.FastbootError,AdbSideloader:a.AdbSideloader,explain:hp.explain,ok:true});
    }catch(e){
      throw new Error("The installer code could not be loaded ("+((e&&e.message)||e)+"). The web host may be serving the .js files with a wrong type, or some files were not uploaded. Upload the whole folder (app.js, flash.js, adb.js, help.js, fastboot.min.js) and reload with Ctrl+F5.");
    }
  }
  return lib;
}
load().catch(()=>{});   // preload in the background, errors are shown when you press a button

/* ---------- Data ---------- */
const DEVICES = [
{id:"bluejay", brand:"Google", name:"Google Pixel 6a", note:"bluejay · easiest to start with", unlock:"Standard Pixel unlock. Wipes data.", roms:[
 {id:"graphene", name:"GrapheneOS", src:"grapheneos.org", tag:"Official", kind:"ok",
  desc:"Privacy and security focused. Flashes the official factory image.",
  url:"https://grapheneos.org/releases#bluejay-stable",
  files:[{role:"factory", label:"Factory image", ext:".zip", minMB:300, codename:true, sha256:"", hint:"A large .zip file. The name usually starts with your device codename and contains the word factory."}],
  steps:["Verify SHA-256 of the factory zip","Reboot to bootloader","fastboot flashing unlock","fastboot flash bootloader + radio","fastboot flash system images","Optional: lock the bootloader again","Reboot into GrapheneOS"]},
 {id:"lineage", name:"LineageOS", src:"lineageos.org", tag:"Official", kind:"ok",
  desc:"Popular, close to stock Android. Installed through recovery.",
  url:"https://download.lineageos.org/devices/bluejay/builds",
  files:[{role:"recovery", label:"Recovery image", ext:".img", minMB:20, sha256:"", hint:"Download 'recovery.img' (or 'boot.img') from the exact same LineageOS download page, right next to the ROM zip."},{role:"rom", label:"ROM zip", ext:".zip", minMB:300, codename:true, sha256:"", hint:"The main system file, a large .zip. Its name should contain your device codename."}],
  steps:["Verify SHA-256 of recovery.img and the ROM zip","Reboot to bootloader","fastboot flash boot recovery.img","On the phone: Apply update → Apply from ADB","adb sideload the ROM zip","Reboot into LineageOS"]}]},
{id:"flame", brand:"Google", name:"Google Pixel 4", note:"flame · works, tested", unlock:"Standard Pixel unlock. Wipes data.",
 prereq:"My Pixel 4 runs the latest stock Android 13 firmware. LineageOS requires it for the installed system (vendor firmware); with another version the ROM may fail to install or crash.", roms:[
 {id:"lineage", name:"LineageOS", src:"lineageos.org", tag:"Official", kind:"ok",
  desc:"Installed through Lineage Recovery.",
  url:"https://download.lineageos.org/devices/flame/builds",
  files:[
   {role:"dtbo", label:"dtbo.img", ext:".img", minMB:0.5, sha256:"", hint:"Download 'dtbo.img' from the LineageOS builds page for flame (same build as the ROM zip). It is flashed first, without it recovery will not boot."},
   {role:"boot", label:"Lineage Recovery (boot.img)", ext:".img", minMB:20, sha256:"", hint:"Download 'boot.img' from the same page. On Pixel 4 the recovery lives inside the boot image."},
   {role:"rom", label:"ROM Zip", ext:".zip", minMB:300, codename:true, sha256:"", hint:"Download the main system package (lineage-*-flame.zip) from the same LineageOS builds page."}],
  plan:{product:"flame", flash:[{role:"dtbo", partition:"dtbo", reboot:"bootloader"},{role:"boot", partition:"boot"}]},
  steps:["Verify the files (dtbo.img, boot.img, ROM zip)","Phone in Bootloader mode (Power + Vol Down), connect via WebUSB","Flash dtbo.img, then reboot to bootloader","Flash boot.img (Lineage Recovery)","Reboot to recovery (or pick 'Recovery mode' with the volume keys)","On phone: Factory reset -> Format data / factory reset","On phone: Apply update -> Apply from ADB, then sideload the ROM zip from this page","Reboot into LineageOS"]}]},
{id:"clover", brand:"Xiaomi", name:"Xiaomi Mi Pad 4 / 4 Plus", note:"clover · works, tested. Bootloader must be unlocked", unlock:"Needs a Mi account and a waiting period (often several days) to unlock. Wipes data.",
 prereq:"My tablet's bootloader is already unlocked, and I understand this ROM only works with its own PE recovery (TWRP and OrangeFox will not work).", roms:[
 {id:"pe-plus", name:"PixelExperience Plus (Android 13)", src:"xdaforums.com, discontinued", tag:"Official, discontinued", kind:"ok",
  desc:"Includes Google apps, so no GApps package is needed. It uses dynamic partitions, so it needs the PE recovery that comes with the ROM.",
  url:"https://xdaforums.com/t/rom-13-official-4-19-dynamicpartition-pixelexperience-plus-for-mi-pad-4-4-plus-discontinued.4551151/",
  files:[
   {role:"recovery", label:"PE Recovery (recovery.img)", ext:".img", minMB:10, sha256:"", hint:"The recovery .img from the same folder as the ROM on the download page (a file of about 28 MB). Do not use TWRP or OrangeFox."},
   {role:"rom", label:"ROM zip", ext:".zip", minMB:300, codename:true, sha256:"", hint:"The ROM, for example PixelExperience_Plus_clover-13.0-20240126-2042-OFFICIAL.zip (about 1.6 GB). If the download keeps failing, pick a different mirror on the file host."}],
  plan:{products:["clover"], flash:[{role:"recovery", partition:"recovery"}],
   manualRecovery:"IMPORTANT: do NOT start Android now. If Android boots, the original recovery can replace the one you just flashed, and you would have to flash it again.\nOpen the recovery by hand:\n  1. Unplug the cable.\n  2. Hold Power + Volume Up on the tablet and keep holding them. The tablet restarts.\n  3. When the Mi logo appears, release Power but keep holding Volume Up until the PixelExperience recovery menu shows.\nStill Android or back at fastboot? Switch the tablet off, enter the bootloader with Power + Volume Down and flash the recovery again.",
   sideloadNote:"Messages about 'metadata' or 'libfs_mgr' during the first install are normal for this ROM, ignore them."},
  steps:["Verify the files (recovery.img and the ROM zip)","Tablet in Fastboot mode (Power + Volume Down), connect via WebUSB","Flash recovery.img (PE Recovery)","Hold Power + Volume Up to open the recovery (do not boot Android first)","On the tablet: Factory reset -> Format data / factory reset","On the tablet: Apply update -> Apply from ADB, then sideload the ROM zip from this page","Reboot into PixelExperience"]}]}
];

/* ---------- Incremental SHA-256 ---------- */
function Sha256(){
  const K=[], H=[]; let p=2;
  const fr=x=>((x-Math.floor(x))*4294967296)|0;
  while(K.length<64){
    let prime=true; for(let d=2;d*d<=p;d++) if(p%d===0){prime=false;break}
    if(prime){ if(H.length<8) H.push(fr(Math.sqrt(p))); K.push(fr(Math.cbrt(p))) }
    p++;
  }
  const W=new Int32Array(64), buf=new Uint8Array(64); let bl=0, total=0;
  const rr=(x,n)=>(x>>>n)|(x<<(32-n));
  function block(b,o){
    for(let i=0;i<16;i++) W[i]=b[o+4*i]<<24|b[o+4*i+1]<<16|b[o+4*i+2]<<8|b[o+4*i+3];
    for(let i=16;i<64;i++){
      const a=W[i-15], c=W[i-2];
      W[i]=(W[i-16]+(rr(a,7)^rr(a,18)^(a>>>3))+W[i-7]+(rr(c,17)^rr(c,19)^(c>>>10)))|0;
    }
    let [A,B,C,D,E,F,G,Hh]=H;
    for(let i=0;i<64;i++){
      const t1=(Hh+(rr(E,6)^rr(E,11)^rr(E,25))+((E&F)^(~E&G))+K[i]+W[i])|0;
      const t2=((rr(A,2)^rr(A,13)^rr(A,22))+((A&B)^(A&C)^(B&C)))|0;
      Hh=G;G=F;F=E;E=(D+t1)|0;D=C;C=B;B=A;A=(t1+t2)|0;
    }
    H[0]=(H[0]+A)|0;H[1]=(H[1]+B)|0;H[2]=(H[2]+C)|0;H[3]=(H[3]+D)|0;
    H[4]=(H[4]+E)|0;H[5]=(H[5]+F)|0;H[6]=(H[6]+G)|0;H[7]=(H[7]+Hh)|0;
  }
  return {
    update(d){
      total+=d.length; let i=0;
      if(bl){ while(i<d.length&&bl<64) buf[bl++]=d[i++]; if(bl===64){block(buf,0);bl=0} }
      for(;i+64<=d.length;i+=64) block(d,i);
      while(i<d.length) buf[bl++]=d[i++];
    },
    hex(){
      const bits=total*8, pad=new Uint8Array(((bl<56)?56-bl:120-bl)+8); pad[0]=0x80;
      const dv=new DataView(pad.buffer);
      dv.setUint32(pad.length-8, Math.floor(bits/4294967296)); dv.setUint32(pad.length-4, bits>>>0);
      this.update(pad);
      return H.map(x=>(x>>>0).toString(16).padStart(8,"0")).join("");
    }
  };
}
async function hashFile(file,onProgress){
  const s=Sha256(), CH=8*1048576;
  for(let o=0;o<file.size;o+=CH){
    s.update(new Uint8Array(await file.slice(o,o+CH).arrayBuffer()));
    onProgress(Math.min(1,(o+CH)/file.size));
  }
  return s.hex();
}

/* ---------- UI ---------- */
const S={step:0,brand:null,dev:null,rom:null,ok:{},files:{}}, labels=["Brand","Device","ROM","Files","Prepare","Install"];
let busy=false;
let stage, stepsContainer;
const mb=n=>(n/1048576).toFixed(1);
function h(t,a,c){const e=document.createElement(t);Object.assign(e,a||{});(c||[]).forEach(x=>e.append(x));return e}

function renderSteps(){
  if(!stepsContainer) return;
  stepsContainer.innerHTML="";
  labels.forEach((l,i)=>stepsContainer.append(h("li",{className:i===S.step?"on":i<S.step?"done":"",textContent:(i+1)+". "+l})));
}

function openGuide(id){
  const d=document.getElementById(id);
  if(!d) return;
  d.open=true;
  d.scrollIntoView({behavior:"smooth",block:"start"});
}

function nav(next){
  const r=h("div",{className:"row"});
  if(S.step>0) r.append(h("button",{className:"btn ghost",textContent:"Back",disabled:busy,onclick:()=>{
    S.step--;
    if (S.step < 3) { S.ok = {}; S.files = {}; }
    render();
  }}));
  if(next) r.append(next);
  return r;
}

function fileCard(f,upd){
  const st=h("p",{className:"st",textContent:"No file chosen."});
  const bar=h("i"), pr=h("div",{className:"bar2",hidden:true},[bar]);
  const inp=h("input",{type:"file",accept:f.ext});
  const sum=h("input",{type:"text",className:"sumin",placeholder:"Optional: SHA-256 checksum, only if the download page shows one",value:f.sha256||"",readOnly:!!f.sha256,spellcheck:false,autocomplete:"off"});
  const btn=h("button",{className:"btn ghost",textContent:"Verify file",disabled:true});
  const say=(t,c)=>{st.textContent=t;st.className="st "+(c||"")};
  const reset=()=>{S.ok[f.role]=false;delete S.files[f.role];upd()};
  
  inp.onchange=()=>{reset();btn.disabled=!inp.files[0];say(inp.files[0]?"Ready to verify.":"No file chosen.")};
  
  btn.onclick=async()=>{
    const file=inp.files[0], exp=sum.value.trim().toLowerCase(); reset();
    if(!file) return say("Choose a file first.","bad");
    if(!file.name.toLowerCase().endsWith(f.ext)) return say("Wrong file type. Expected a "+f.ext+" file but got "+file.name+".","bad");
    if(file.size<(f.minMB||0)*1048576) return say("The file is only "+mb(file.size)+" MB, too small for a "+f.label.toLowerCase()+". The download may be incomplete.","bad");
    
    try {
        const head=new Uint8Array(await file.slice(0,8).arrayBuffer()), txt=String.fromCharCode(...head);
        const isAndroid=txt==="ANDROID!", isSparse=head[0]===0x3a&&head[1]===0xff&&head[2]===0x26&&head[3]===0xed, isDtbo=head[0]===0xd7&&head[1]===0xb7&&head[2]===0xab&&head[3]===0x1e;
        const magic=f.ext===".zip" ? txt.startsWith("PK") : f.role==="dtbo" ? (isDtbo||isSparse) : (isAndroid||isSparse);
        if(!magic) return say("The contents do not look like a real "+f.label+". It may be damaged or you picked the wrong file (for example boot.img in the dtbo box).","bad");
        
        if(exp&&!/^[0-9a-f]{64}$/.test(exp)) return say("A SHA-256 checksum has 64 characters (0-9, a-f). Fix it or leave the field empty.","bad");
        const warn=(f.codename&&!file.name.toLowerCase().includes(S.dev.id))?" Warning: the file name does not contain '"+S.dev.id+"'. Make sure this build is for your device.":"";
        
        if(exp){
          busy=true; btn.disabled=inp.disabled=true; pr.hidden=false; say("Checking the checksum…");
          const got=await hashFile(file,p=>{bar.style.width=Math.round(p*100)+"%"});
          if(got!==exp) { say("The checksum does not match. Download the file again and do not flash this one.","bad"); }
          else { S.ok[f.role]=true; S.files[f.role]=file; say("Verified. "+file.name+" ("+mb(file.size)+" MB) matches the checksum."+warn,warn?"warn":"ok"); }
          busy=false; btn.disabled=inp.disabled=false; pr.hidden=true;
        } else {
          S.ok[f.role]=true;S.files[f.role]=file;
          say("Basic checks passed (file type, size, contents). No checksum was compared."+warn,"warn");
        }
    } catch(e) {
        say("Could not read the file: "+e.message,"bad");
        busy=false; btn.disabled=inp.disabled=false; pr.hidden=true;
    }
    upd();
  };
  return h("div",{className:"fcard"},[h("b",{textContent:f.label+" ("+f.ext+")"}),h("p",{className:"hint",textContent:f.hint}),inp,sum,h("a",{className:"hint",href:"#guide-sha",textContent:"How do I get the SHA-256 of my file?",onclick:e=>{e.preventDefault();openGuide("guide-sha")}}),h("div",{className:"row tight"},[btn]),pr,st]);
}

function render(){
  if (!stage) return;
  renderSteps(); stage.innerHTML="";
  
  if(S.step===0){
    stage.append(h("p",{className:"sum",textContent:"Choose the brand of your device."}));
    const g=h("div",{className:"grid"});
    [...new Set(DEVICES.map(d=>d.brand))].sort().forEach(b=>{
      const n=DEVICES.filter(d=>d.brand===b).length;
      g.append(h("button",{className:"opt",onclick:()=>{S.brand=b;S.dev=null;S.rom=null;S.step=1;render()}},[h("b",{textContent:b}),h("small",{textContent:n+(n===1?" device":" devices")})]));
    });
    stage.append(g);
  } else if(S.step===1){
    stage.append(h("p",{className:"sum",textContent:"Which "+S.brand+" device do you want to flash?"}));
    const g=h("div",{className:"grid"});
    DEVICES.filter(d=>d.brand===S.brand).forEach(d=>g.append(h("button",{className:"opt",onclick:()=>{S.dev=d;S.rom=null;S.step=2;render()}},[h("b",{textContent:d.name}),h("small",{textContent:d.note})])));
    stage.append(g,nav());
  } else if(S.step===2){
    stage.append(h("p",{className:"sum",textContent:"Choose a ROM for "+S.dev.name+"."}));
    const g=h("div",{className:"grid"});
    (S.dev.roms || []).forEach(r=>g.append(h("button",{className:"opt",onclick:()=>{S.rom=r;S.ok={};S.files={};S.step=3;render()}},[h("b",{textContent:r.name}),h("small",{textContent:r.desc}),h("small",{textContent:"Source: "+r.src}),h("span",{className:"tag "+r.kind,textContent:r.tag})])));
    stage.append(g,nav());
  } else if(S.step===3){
    const r=S.rom;
    stage.append(h("p",{className:"sum",textContent:"Get the right files for your "+S.dev.name+" (codename: "+S.dev.id+"). Three steps:"}));
    const gl=h("ol",{className:"cmds"});
    ["Open the download page below.","Pick the build for the codename "+S.dev.id+" and download the file(s) listed under the boxes.","Choose each downloaded file in its box. Files stay on your computer, nothing is uploaded."].forEach(t=>gl.append(h("li",{textContent:t})));
    stage.append(gl);
    stage.append(r.url
      ? h("a",{className:"btn dl",href:r.url,target:"_blank",rel:"noopener",textContent:"Open "+r.name+" download page"})
      : h("p",{className:"demo",textContent:"No download link has been added for this build yet. Use the maintainer's page and copy its checksum."}));
    
    const cont=h("button",{className:"btn",textContent:"Continue",disabled:true,onclick:()=>{S.step=4;render()}});
    const upd=()=>{cont.disabled=busy||!(r.files||[]).every(f=>S.ok[f.role])};
    (r.files||[]).forEach(f=>stage.append(fileCard(f,upd)));
    stage.append(nav(cont));
  } else if(S.step===4){
    stage.append(h("p",{className:"sum",textContent:"Before you install "+S.rom.name+" on "+S.dev.name+", confirm each point."}));
    const items=["I backed up my data. Installing erases everything on the phone.","The battery is above 50% and I am using a good USB data cable plugged directly into the computer.","I closed other programs that use the phone over USB (adb, Android Studio, phone managers).","My bootloader is unlocked. "+S.dev.unlock,"I understand the phone could be bricked and I do this at my own risk."];
    if(S.dev.prereq) items.push(S.dev.prereq);
    if(S.rom.kind==="exp") items.push("This is an unofficial community build. I checked who made it and where it comes from.");
    const cont=h("button",{className:"btn",textContent:"Continue",disabled:true,onclick:()=>{S.step=5;render()}});
    items.forEach(t=>stage.append(h("label",{className:"chk"},[h("input",{type:"checkbox",onchange:()=>{cont.disabled=stage.querySelectorAll("input:not(:checked)").length>0}}),h("span",{textContent:t})])));
    stage.append(nav(cont));
  } else {
    stage.append(h("p",{className:"sum",textContent:"Install "+S.rom.name+" on "+S.dev.name+". Verified files:"}));
    const fl=h("ul",{className:"cmds"});
    (S.rom.files||[]).forEach(f=>{const x=S.files[f.role];fl.append(h("li",{textContent:x?x.name+" ("+mb(x.size)+" MB)":f.label}))});
    stage.append(fl,h("p",{className:"sum",textContent:"Fastboot Flash Process:"}));
    
    const ol=h("ol",{className:"cmds"}); 
    (S.rom.steps||[]).forEach(s=>ol.append(h("li",{textContent:s}))); 
    stage.append(ol);
    
    if(!navigator.usb) stage.append(h("div",{className:"demo",textContent:"This browser does not support WebUSB. Open the site in Chrome or Edge on a computer."}));
    
    const bar=h("i"), log=h("div",{className:"log"});
    let base="Ready.\nPut the phone in Bootloader mode (Power + Vol Down) and connect it with a good USB cable.\n";
    log.textContent=base;
    const say=t=>{base+=t+"\n"; log.textContent=base; log.scrollTop=log.scrollHeight};
    const prog=(t,p)=>{bar.style.width=Math.round(p*100)+"%"; log.textContent=base+t; log.scrollTop=log.scrollHeight};
    const plan=S.rom.plan;
    const go=h("button",{className:"btn",textContent:plan?"1. Connect & Flash Recovery":"Simulate install"});
    const side=h("button",{className:"btn",textContent:"2. Sideload ROM",hidden:!plan});

    let phase="connect";
    const friendly=e=>lib.explain?lib.explain(e,phase):((e&&e.message)||String(e));

    go.onclick=async()=>{
      if(busy) return;
      if(!plan){
        say("This device is a simulation only. Nothing was sent to your phone.");
        return;
      }
      if(!navigator.usb){ alert("WebUSB is not supported in this browser. Use Chrome or Edge on a computer."); return; }
      busy=true; go.disabled=side.disabled=true; bar.style.width="0%";
      phase="connect"; base=""; say("[1] Connecting. Choose your phone in the USB picker...");
      try{
        const {Flasher,FastbootError}=await load();
        const fb=new Flasher();
        const info=await fb.connect();
        say(`Connected: product=${info.product}, slot=${info.slot}, unlocked=${info.unlocked}, mode=${info.userspace==="yes"?"fastbootd":"bootloader"}`);
        const okProducts=plan.products||[plan.product];
        if(!okProducts.includes(info.product)) throw new Error(`This phone reports codename '${info.product}', but this install is for '${okProducts.join("/")}'. Stopped, nothing was flashed.`);
        if(info.unlocked==="no") throw new Error("The bootloader is locked. Unlock it first (see Guides). Stopped, nothing was flashed.");
        if(info.userspace==="yes"){ say("Phone is in fastbootd, switching to the bootloader..."); await fb.rebootTo("bootloader"); say("  back in bootloader."); }

        let n=2;
        for(const st of plan.flash){
          const file=S.files[st.role];
          if(!file) throw new Error("File '"+st.role+"' is missing. Go back and choose it.");
          phase="flash";
          say(`[${n++}] Flashing ${file.name} (${mb(file.size)} MB) to '${st.partition}'...`);
          await fb.flash(st.partition,file,p=>prog("    "+Math.round(p*100)+"%\n",p));
          bar.style.width="100%"; say("    done.");
          if(st.reboot){ say(`    Rebooting to ${st.reboot} (the screen goes black for a few seconds)...`); await fb.rebootTo(st.reboot); say("    phone is back, continuing."); bar.style.width="0%"; }
        }

        phase="reboot";
        if(plan.manualRecovery){
          say("\n"+plan.manualRecovery);
        } else {
          say(`[${n}] Rebooting to recovery...`);
          let manual=false;
          try{ await fb.rebootRecovery(); }
          catch(e){ if(e instanceof FastbootError) manual=true; else throw e; }
          if(manual){
            say("The bootloader refused the automatic reboot. Do it by hand:\n  1. On the phone, press Volume keys until 'Recovery mode' shows.\n  2. Press Power to select it.");
          } else {
            say("Command sent. The phone should show the LineageOS recovery in a few seconds.\nIf it returns to the fastboot screen instead, choose 'Recovery mode' with the volume keys + Power.");
          }
        }
        say("\nNext, on the phone (in recovery):\n  1. Factory reset -> Format data / factory reset -> confirm.\n  2. Back to the main menu: Apply update -> Apply from ADB.\n  3. Click 'Sideload ROM' below and pick the phone again in the USB picker.");
      }catch(err){
        say("\n"+friendly(err));
        console.error(err);
      }finally{
        busy=false; go.disabled=side.disabled=false; go.textContent="1. Flash recovery again";
      }
    };

    side.onclick=async()=>{
      if(busy) return;
      const rom=S.files.rom;
      if(!rom){ say("ROM zip is missing. Go back and choose it."); return; }
      if(!navigator.usb){ alert("WebUSB is not supported in this browser. Use Chrome or Edge on a computer."); return; }
      busy=true; go.disabled=side.disabled=true; bar.style.width="0%";
      phase="sideload";
      say("\n[Sideload] Pick the phone in the USB picker (the entry usually mentions 'adb' or 'sideload')...");
      let adb=null;
      try{
        const {AdbSideloader}=await load();
        const usb=await AdbSideloader.requestDevice();
        adb=new AdbSideloader(usb);
        await adb.open();
        const banner=await adb.connect();
        say("Connected to recovery ("+banner.replace(/\0/g,"").slice(0,40)+").\nSending "+rom.name+" ("+mb(rom.size)+" MB). Do not unplug the cable.");
        await adb.sideload(rom,(p,blk,tot)=>prog("    "+Math.round(p*100)+"%  ("+mb(Math.min(rom.size,(blk+1)*65536))+" / "+mb(rom.size)+" MB)\n",p));
        bar.style.width="100%";
        say("    done. The ROM was sent to the phone.\n\nNow watch the phone:\n  - 'Install completed with status 0' means the install worked.\n  - If it asks 'To install additional packages, you need to reboot recovery first', choose No. That is normal.\n  - Then choose 'Reboot system now'. The first start takes several minutes.\n  - If it says 'Signature verification failed', choose No: the ZIP is damaged or not official. Check its SHA-256 (see Guides) and download it again.");
      }catch(err){
        say("\n"+friendly(err));
        console.error(err);
      }finally{
        if(adb) await adb.close();
        busy=false; go.disabled=side.disabled=false;
      }
    };

    stage.append(h("div",{className:"bar2"},[bar]),log);
    const navRow=nav(go); navRow.append(side); stage.append(navRow);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  stage = document.getElementById("stage");
  stepsContainer = document.getElementById("steps");
  render();
  
  const bg=document.getElementById("burger"), nv=document.getElementById("nav");
  bg.onclick=()=>{const o=nv.classList.toggle("open");bg.setAttribute("aria-expanded",o)};
  nv.onclick=e=>{if(e.target.tagName==="A"){nv.classList.remove("open");bg.setAttribute("aria-expanded","false")}};
});