# OpenFlash

**Install a custom Android ROM from your browser.** Pick your phone, pick a ROM, follow the steps. No command line needed and, usually, no extra software. Everything runs in the page: the files you choose never leave your computer.

> ⚠️ Flashing erases your phone and can go wrong. This is a young project, use it at your own risk and read the guides first.

**Live site:** https://bobaka10.github.io/openflash/ (Chrome or Edge on a computer)

## What works today

Every ROM in the installer writes to the phone for real. There are no demo entries.

| Phone | ROM | Status | Tested with |
| --- | --- | --- | --- |
| Google Pixel 4 (`flame`) | LineageOS 24.0 | ✅ Works | build `20261015` |
| Google Pixel 4 (`flame`) | HeckerOS 1.0 (Android 17) | ✅ Works | build `20261026` |
| Google Pixel 4 (`flame`) | Evolution X, Android 17 (unofficial) | ✅ Works | Android 17 build from the ROM thread |
| Google Pixel 6a (`bluejay`) | Evolution X 11.11 (Android 16, official) | ✅ Works | build `20260915` |
| Google Pixel 6a (`bluejay`) | LineageOS (official) | ✅ Works | official build from the LineageOS site |
| Xiaomi Mi Pad 4 (`clover`) | PixelExperience Plus 13 | ✅ Works | build `20240126` |
| Xiaomi Mi Pad 4 Plus (`clover`) | PixelExperience Plus 13 | Untested, same codename as Mi Pad 4 | |

Tested from Chrome on Windows. Chrome or Edge on a computer is required (WebUSB). Firefox and Safari do not support it.

| Feature | Status |
| --- | --- |
| Install flow (flash, recovery, sideload) | ✅ Tested end to end on the devices marked "Works" above |
| Bootloader unlock page with instructions for Pixel 4, Pixel 6a and Mi Pad 4 | ✅ Written from the vendors' documented steps |
| Bootloader unlock from the browser (`fastboot flashing unlock`) on the Pixel 4 | ✅ Works |
| Bootloader unlock from the browser on the Pixel 6a | 🧪 Not tested. Same command as the Pixel 4, but the author's phone was already unlocked |
| Status check on the Mi Pad 4 unlock section | 🧪 Read-only, but not verified that the tablet reports its lock state |
| Light and dark theme | ✅ Follows the device by default, switch with the button in the header |

## What it does
0. Helps you unlock the bootloader first: step-by-step per device on [`unlock.html`](unlock.html), with a status check and a one-click unlock for the Pixels. Xiaomi tablets need Xiaomi's own Mi Unlock tool, so that part is explained but not automated.
1. Checks your files (type, size, optional SHA-256).
2. Connects to the phone in fastboot mode through WebUSB and **checks its codename and bootloader state before writing anything**.
3. Flashes the needed partitions.
4. Sends the ROM to the phone's recovery with a built-in ADB sideload client.
5. Explains every error in plain words, with what to do next.

There is also a plain-language page, [`learn.html`](learn.html), that explains what a ROM, a bootloader and a recovery are.

## Known issues and limitations
Please read these before you flash. Most of them have a fix in the **Guides** section of the site.

**Browser and computer**
- Only **Chrome or Edge on a computer** works (WebUSB). Firefox, Safari and phone browsers cannot flash.
- Open the site over `https` or `localhost`. It does not work from a `file://` address.
- **"Unable to claim interface":** another program holds the phone, usually a background `adb`. Run `adb kill-server`, close other tabs with the site, and replug the cable.
- **Windows drivers:** a phone in fastboot mode may show up as "Android" with a yellow triangle in Device Manager and will then not appear in the browser's USB list. Installing the "Android Bootloader Interface" driver (Device Manager → Update driver → Let me pick) fixed it for us. Linux needs udev rules for some phones.
- **Xiaomi Mi Pad 4 shows "Press any key to shutdown"** when plugged into a USB 3.x port on Windows. Use a USB 2.0 port or a USB 2.0 hub. A registry workaround is described in the Guides (advanced).

**Steps that stay manual**
- On the phone you still choose **Format data / Factory reset** and **Apply from ADB** yourself. The recovery menu cannot be driven from the browser.
- The **Mi Pad 4 does not reboot into recovery by itself.** If stock Android boots in between, it can restore the original recovery. You open the PE recovery by hand (Power + Volume Up).
- **Xiaomi unlocking** needs a Mi account, a waiting period and Xiaomi's Mi Unlock tool. This cannot be automated from a web page, so the Unlock page only explains it and checks the result.

**ROM specific**
- **Pixel 4 + LineageOS / HeckerOS** need the latest stock **Android 13** firmware first. Other firmware may fail to install or crash.
- **Pixel 6a + LineageOS** follows the official LineageOS install page. That page asks for a specific stock firmware version, which can be lower than the LineageOS version. Always take `boot.img`, `dtbo.img`, `vendor_boot.img` and the zip from the **same build**. One forum report describes a Pixel 6a that stopped responding after a flash with mismatched or faulty images, so do not mix files.
- **HeckerOS** is an unofficial development build by one developer. Its release notes say USB debugging is on by default and computers are accepted without an authorization prompt. Turn it off in Developer options after installing.
- **Evolution X for the Pixel 4** is an unofficial build. The title of its XDA thread still says Android 16, but the linked post on page 9 has the Android 17 files. The installer links straight to that post.
- **Evolution X for the Pixel 6a** has a Google apps build and a vanilla build. Use all four files from the same one.
- The **Pixel 4 XL (`coral`)** and the **Mi Pad 4 Plus** are not tested. The installer stops if the phone's codename does not match the files' device.
- The ROM download pages often do not publish a SHA-256. The checksum check is optional.

**The code**
- The built-in **ADB sideload client is minimal.** It only works with a recovery that is waiting in "Apply from ADB" (no authorization support) and has no resume if the cable is pulled.
- There are **no automated tests.** The logic was checked against simulated USB devices and then by hand on the phones listed above.
- Devices live in the `DEVICES` list in `app.js`. A separate JSON file per device with validation is planned.
- Google Fonts is loaded from Google's servers (see Privacy).

## Something went wrong?
You usually will not brick a phone with these steps, but flashing is never risk free. The page explains most errors in plain words, and the **Guides** cover the common cases. If you open an issue, please include:
- phone model and ROM build, with the exact file names you used,
- browser and operating system,
- the text from the log box on the page,
- a photo of the phone's screen if the phone shows an error.

## Run it locally
```
python -m http.server 8000
```
Open `http://localhost:8000` in Chrome. For a public copy, any static host with https works, for example GitHub Pages (the `.nojekyll` file is already included). WebUSB needs https or localhost.

## How it is built
| File | Role |
| --- | --- |
| `index.html`, `learn.html`, `unlock.html`, `style.css` | The site and the guides |
| `theme.js` | Light and dark theme switch. Follows the device until you pick one |
| `unlock.js` | The unlock page: device tabs, status check and the unlock command |
| `app.js` | Device list, installer steps and screens |
| `flash.js` | Fastboot flashing and unlocking on top of fastboot.js |
| `adb.js` | Minimal ADB over WebUSB, only what `adb sideload` needs |
| `help.js` | Turns technical errors into plain-language help |
| `fastboot.min.js` | [fastboot.js](https://github.com/kdrag0n/fastboot.js) (MIT) |

## Roadmap and help wanted
- Test the browser unlock on a locked Pixel 6a, then update the tables above.
- More phones and ROMs, each only after a real end-to-end test.
- One JSON file per device with automatic validation.
- Translations of the Learn page and the guides.
- Automated tests with simulated USB devices.

## Add a phone or a ROM
See [`CONTRIBUTING.md`](CONTRIBUTING.md). The one rule: only add or mark something as working after you installed it end to end on a real device.

## Privacy
There is no server and no analytics. Your files are read in your browser only. The only outside request is Google Fonts for the typefaces. The page stores one thing in your browser: your light or dark theme choice.

## License and credit
OpenFlash is released under the [MIT License](LICENSE). You are free to use, copy and modify it, but you must **keep the copyright notice and the license text** in copies and substantial parts of it. If you build on OpenFlash, a link back to this project is appreciated.

Copyright (c) 2026 @bobaka10.

Built on [fastboot.js](https://github.com/kdrag0n/fastboot.js) and inspired by [android-webinstall](https://github.com/kdrag0n/android-webinstall), both by Danny Lin (kdrag0n). See [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).

ROMs belong to their authors. OpenFlash is not affiliated with Google, Xiaomi, LineageOS, PixelExperience, Evolution X, HeckerOS or any other ROM project.
