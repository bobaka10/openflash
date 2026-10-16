/*! OpenFlash ADB client | https://github.com/bobaka10/openflash
 *  Copyright (c) 2026 @bobaka10
 *  SPDX-License-Identifier: MIT. See the LICENSE file. */
/* Turns technical errors into plain-language help: what happened, is the phone OK, what to do. */
import { FastbootError } from "./flash.js";

/* phase = where we were when it failed: connect | flash | reboot | sideload */
const SAFE = {
  connect: "Nothing was changed on your phone.",
  flash: "Your phone is very unlikely to be damaged. This step does not touch the bootloader (the part that lets you flash again), so you can simply start over. If the transfer stopped halfway, Android may not start until the flash is repeated.",
  reboot: "Your phone is very unlikely to be damaged. The bootloader is untouched, so you can start over.",
  sideload: "Your phone is very unlikely to be damaged. The ROM is installed into the phone's other (inactive) system slot, so a failed attempt does not damage the system the phone is using. Just run the sideload again."
};

const BACK_TO_BOOTLOADER = "Switch the phone off (hold Power about 15 seconds), then hold Power + Volume Down until the bootloader screen appears.";

const CASES = [
  { re: /No device selected|NotFoundError/i,
    title: "No phone was selected",
    what: "The USB window was closed without choosing a device.",
    safe: SAFE.connect,
    todo: ["Click the button again.", "Choose your phone in the list. If the list is empty, open Guides -> 'The phone does not show up'."] },
  { re: /claimInterface|Unable to claim|Access denied|in use/i,
    title: "Another program is using the phone",
    what: "Only one program can talk to the phone at a time. Usually it is adb running in the background.",
    todo: ["Open Command Prompt and run: adb kill-server", "Close other tabs with this page, Android Studio and phone-manager programs.", "Unplug the cable, plug it in again, then click the button again."] },
  { re: /user gesture/i,
    title: "The browser wants a fresh click",
    what: "Browsers only open the USB window right after you click a button.",
    safe: SAFE.connect,
    todo: ["Click the button again."] },
  { re: /Timed out waiting/i,
    title: "The phone did not come back after rebooting",
    what: "After a reboot the phone has to reappear on USB, and that did not happen in time.",
    todo: ["Look at the phone. If it shows the bootloader screen, unplug and replug the cable.", "If the screen is black, " + BACK_TO_BOOTLOADER.charAt(0).toLowerCase() + BACK_TO_BOOTLOADER.slice(1), "Then click 'Connect & Flash Recovery' again. Already flashed steps are safe to repeat."] },
  { re: /reports codename/i,
    title: "These files are for a different phone",
    what: "The phone's codename does not match the one this install is made for. The install was stopped on purpose.",
    safe: SAFE.connect,
    todo: ["Do not flash these files on this phone.", "Go back and pick the device that matches your phone."] },
  { re: /bootloader is locked|locked state|not allowed in locked|unlock/i,
    title: "The bootloader is locked",
    what: "A locked bootloader refuses to flash anything.",
    safe: SAFE.connect,
    todo: ["Unlock it first: Guides -> 'How to unlock the bootloader'. This erases the phone.", "Then start again."] },
  { re: /is missing/i,
    title: "A file is missing",
    what: "One of the verified files is no longer selected.",
    safe: SAFE.connect,
    todo: ["Click Back, choose the file again and press 'Verify file'."] },
  { re: /refused sideload|no ADB interface/i,
    title: "The phone is not waiting for the ROM",
    what: "The phone must be in sideload mode before the ROM can be sent.",
    safe: SAFE.sideload,
    todo: ["On the phone: Apply update -> Apply from ADB.", "Click 'Sideload ROM' again and choose the phone in the USB list."] },
  { re: /ADB authorization/i,
    title: "The phone is not in recovery sideload mode",
    what: "The phone behaves like a normal running Android, which asks for authorization.",
    safe: SAFE.sideload,
    todo: ["Boot to recovery (Power + Volume Down -> Recovery mode).", "Choose Apply update -> Apply from ADB, then try again."] },
  { re: /closed the (sideload )?connection|install failed|invalid block|FAILFAIL/i,
    title: "The phone stopped the install",
    what: "The phone ended the transfer. The real reason is written on the phone's screen.",
    safe: SAFE.sideload,
    todo: [
      "Read the last lines on the phone. 'Signature verification failed' means the ZIP is damaged or not official: check its SHA-256 (Guides) and download it again. Choose No when it asks to install anyway.",
      "'Install completed with status 1' or 'status 2' usually means a damaged file or the wrong stock firmware (this ROM needs Android 13).",
      "On the phone choose Advanced -> Reboot to recovery, then Apply update -> Apply from ADB, and try again."] },
  { re: /disconnected|NetworkError|device has been lost|transfer was cancelled|USB read failed|No such device|stall/i,
    title: "The USB connection dropped",
    what: "The cable or port lost contact with the phone while data was being sent.",
    todo: ["Use a data cable (many cables only charge) and a USB port directly on the computer, not a hub.", "Check that the phone is still on the right screen (bootloader, or recovery with 'Apply from ADB').", "Xiaomi tablet showing 'Press any key to shutdown'? Use a USB 2.0 port or a USB 2.0 hub (Guides -> Xiaomi Mi Pad 4 tips).", "If the phone looks frozen: " + BACK_TO_BOOTLOADER, "Click the button again."] }
];

export function explain(err, phase) {
  const msg = (err && err.message) || String(err);
  let c = CASES.find(x => x.re.test(msg));
  if (!c && err instanceof FastbootError)
    c = { title: "The phone's bootloader refused a command",
          what: "The bootloader answered: " + msg,
          todo: ["Make sure you chose the files for this exact phone and build.", "Run the flash again from the bootloader screen. " + BACK_TO_BOOTLOADER, "If it keeps failing, copy this log and ask for help."] };
  if (!c)
    c = { title: "Something unexpected happened",
          what: "The page could not finish this step.",
          todo: ["Unplug the cable, " + BACK_TO_BOOTLOADER.charAt(0).toLowerCase() + BACK_TO_BOOTLOADER.slice(1), "Click the button again.", "If it keeps happening, take a photo of this log and the phone screen and ask for help."] };
  const safe = c.safe || SAFE[phase] || SAFE.flash;
  const lines = ["ERROR: " + c.title, "What happened: " + c.what, "Is my phone OK? " + safe, "What to do:"];
  c.todo.forEach((t, i) => lines.push("  " + (i + 1) + ". " + t));
  if (msg && !c.what.includes(msg)) lines.push("Technical details: " + msg);
  return lines.join("\n");
}
