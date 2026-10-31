/*! OpenFlash flash layer | https://github.com/bobaka10/openflash
 *  Copyright (c) 2026 @bobaka10
 *  SPDX-License-Identifier: MIT. See the LICENSE file. */
/* Browser-side flashing layer. Talks to the phone over WebUSB using fastboot.js (MIT). */
import { FastbootDevice, FastbootError } from "./fastboot.min.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));

export { FastbootError };

export class Flasher {
  constructor(dev){ this.dev = dev || new FastbootDevice(); }
  static supported(){ return typeof navigator !== "undefined" && !!navigator.usb; }

  /* Opens the browser's USB picker (fastboot.js does this itself, it takes no
     device argument) and reads basic info. Read-only, changes nothing. */
  async connect(){
    await this.dev.connect();
    const get = async n => { try { return await this.dev.getVariable(n); } catch(e){ return null; } };
    return {
      product:   await get("product"),        // codename, e.g. "flame"
      unlocked:  await get("unlocked"),       // "yes" | "no" | null
      slot:      await get("current-slot"),
      userspace: await get("is-userspace"),   // "yes" = fastbootd, "no" = bootloader
      serial:    await get("serialno")
    };
  }

  /* "1" = the phone allows unlocking (OEM unlocking is on), "0" = not allowed, null = unknown. Read-only. */
  async unlockAbility(){
    try {
      const r = await this.dev.runCommand("flashing get_unlock_ability");
      const m = /(\d+)/.exec(r.text || "");
      return m ? m[1] : null;
    } catch(e){ if(e instanceof FastbootError) return null; throw e; }
  }

  /* Sends `fastboot flashing unlock`. The phone then asks for confirmation ON ITS SCREEN and erases itself.
     Resolves "ok" if the bootloader answered, "disconnected" if USB dropped (normal while it erases). */
  async unlock(){
    try { await this.dev.runCommand("flashing unlock"); return "ok"; }
    catch(e){ if(e instanceof FastbootError) throw e; return "disconnected"; }
  }

  /* Flashes a File/Blob to a partition. fastboot.js appends the active A/B slot itself. */
  flash(partition, file, onProgress){ return this.dev.flashBlob(partition, file, onProgress); }

  /* Reboots into another fastboot mode and waits until the phone shows up on USB again.
     The phone drops the USB link while rebooting, so a USB error right after
     the command is expected and ignored. A FAIL answer from the bootloader is real. */
  async rebootTo(target, timeoutMs = 90000){
    try { await this.dev.reboot(target, false); }
    catch(e){ if(e instanceof FastbootError) throw e; }
    await Promise.race([
      this.dev.waitForConnect(),
      sleep(timeoutMs).then(() => { throw new Error("Timed out waiting for the phone to come back in " + target + " mode. Look at the phone screen."); })
    ]);
  }

  /* Leaves fastboot for recovery. Resolves when the command was sent (the phone then
     disconnects). Throws FastbootError only if the bootloader refuses the command. */
  async rebootRecovery(){
    try { await this.dev.reboot("recovery", false); }
    catch(e){ if(e instanceof FastbootError) throw e; }
  }
}
