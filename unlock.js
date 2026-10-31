/*! OpenFlash unlock page | https://github.com/bobaka10/openflash
 *  Copyright (c) 2026 @bobaka10
 *  SPDX-License-Identifier: MIT. See the LICENSE file. */

/* Loaded on demand so the page always renders, even if the host serves a file wrongly. */
const lib = {};
async function load(){
  if(!lib.ok){
    try{
      const [f, h] = await Promise.all([import("./flash.js"), import("./help.js")]);
      Object.assign(lib, { Flasher: f.Flasher, explain: h.explain, ok: true });
    }catch(e){
      throw new Error("The page code could not be loaded (" + ((e && e.message) || e) + "). Upload every file (unlock.js, flash.js, help.js, fastboot.min.js) and reload with Ctrl+F5.");
    }
  }
  return lib;
}
load().catch(() => {});

/* ---------- device tabs ---------- */
const tabs = [...document.querySelectorAll(".dtab")], panels = [...document.querySelectorAll(".devpanel")];
const ids = tabs.map(t => t.dataset.dev);
function show(id){
  tabs.forEach(t => { const on = t.dataset.dev === id; t.classList.toggle("on", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
  panels.forEach(p => { p.hidden = p.id !== "dev-" + id; });
}
tabs.forEach(t => t.addEventListener("click", () => { show(t.dataset.dev); history.replaceState(null, "", "#" + t.dataset.dev); }));
window.addEventListener("hashchange", () => { const h = location.hash.slice(1); if(ids.includes(h)) show(h); });
{ const h = location.hash.slice(1); show(ids.includes(h) ? h : ids[0]); }

/* ---------- check / unlock tools ---------- */
let busy = false;
document.querySelectorAll(".tool").forEach(tool => {
  const code = tool.dataset.product, canUnlock = tool.dataset.unlock === "yes";
  const log = tool.querySelector(".log"), bCheck = tool.querySelector(".b-check"), bUnlock = tool.querySelector(".b-unlock"), ack = tool.querySelector(".ack-box");
  const buttons = [bCheck, bUnlock].filter(Boolean);
  let phase = "connect";

  const say = t => { log.textContent += t + "\n"; log.scrollTop = log.scrollHeight; };
  const setBusy = b => { busy = b; buttons.forEach(x => { x.disabled = b; }); if(!b && bUnlock) bUnlock.disabled = !ack.checked; };
  if(ack) ack.addEventListener("change", () => { if(!busy) bUnlock.disabled = !ack.checked; });

  const friendly = e => lib.explain ? lib.explain(e, phase) : "ERROR: " + ((e && e.message) || String(e));

  async function connect(){
    if(!navigator.usb) throw new Error("WebUSB is not supported in this browser. Use Chrome or Edge on a computer.");
    const { Flasher } = await load();
    say("Connecting. Choose the device in the USB window...");
    const fb = new Flasher();
    const info = await fb.connect();
    say("Connected: product=" + info.product + ", unlocked=" + info.unlocked + ", mode=" + (info.userspace === "yes" ? "fastbootd" : "bootloader"));
    if(info.product !== code) throw new Error("This phone reports codename '" + info.product + "', but this section is for '" + code + "'. Stopped, nothing was changed.");
    return { fb, info };
  }

  function stateLine(info, ability){
    const st = info.unlocked === "yes" ? "UNLOCKED" : info.unlocked === "no" ? "LOCKED" : "not reported by the device";
    say("Bootloader: " + st);
    if(canUnlock && ability !== null) say("OEM unlocking: " + (ability === "1" ? "ON (unlocking is allowed)" : "OFF (unlocking is not allowed)"));
  }

  bCheck.onclick = async () => {
    if(busy) return;
    setBusy(true); log.textContent = ""; phase = "connect";
    try{
      const { fb, info } = await connect();
      const ability = canUnlock ? await fb.unlockAbility() : null;
      stateLine(info, ability);
      if(info.unlocked === "yes") say("\nDone. This device is unlocked. You can continue on the Install page.");
      else if(canUnlock && ability === "0") say("\nUnlocking is switched off. On the phone turn on OEM unlocking in Developer options (see step 2), restart into the bootloader and check again.");
      else if(info.unlocked === "no" && canUnlock) say("\nThe device is locked and unlocking is allowed. Tick the box and click 'Unlock bootloader' when you are ready.");
      else if(info.unlocked === "no") say("\nThe device is locked. Use Xiaomi's Mi Unlock tool (see the steps above).");
      else say("\nThe device did not say whether it is locked, so this page cannot tell. " + (canUnlock ? "You can still try to unlock it." : "The Mi Unlock tool shows the state. If it says unlocked, continue on the Install page."));
    }catch(err){
      say("\n" + friendly(err)); console.error(err);
    }finally{ setBusy(false); }
  };

  if(bUnlock) bUnlock.onclick = async () => {
    if(busy || !ack.checked) return;
    if(!confirm("This will ERASE ALL DATA on the phone. Continue?")) return;
    setBusy(true); log.textContent = ""; phase = "connect";
    try{
      const { fb, info } = await connect();
      if(info.unlocked === "yes"){ say("\nThis device is already unlocked. Nothing to do."); return; }
      const ability = await fb.unlockAbility();
      stateLine(info, ability);
      if(ability === "0") throw new Error("Unlocking is not allowed: OEM unlocking is off. Flashing Unlock is not allowed.");
      phase = "unlock";
      say("\nLOOK AT THE PHONE NOW. It shows an unlock screen:\n  - press a Volume key until it says 'Unlock the bootloader'\n  - press Power to confirm\nThis page waits for your answer. Do not unplug the cable.");
      const res = await fb.unlock();
      if(res === "ok") say("\nThe phone accepted the command. It is erasing itself and will restart. This takes a few minutes, do not unplug it.");
      else say("\nThe phone disconnected. That is normal while it erases itself and restarts. Do not unplug it and wait a few minutes.");
      say("When it is back, put it in the bootloader again (Power + Volume Down) and click 'Check status'. It should say UNLOCKED. If it still says LOCKED, you probably chose 'Do not unlock' on the phone: just try again.");
    }catch(err){
      say("\n" + friendly(err)); console.error(err);
    }finally{ setBusy(false); }
  };
});
