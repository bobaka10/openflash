# OpenFlash

**Install a custom Android ROM from your browser.** Pick your phone, pick a ROM, follow the steps. No command line needed and, usually, no extra software. Everything runs in the page: the files you choose never leave your computer.

> ⚠️ Flashing erases your phone and can go wrong. This is a young project, use it at your own risk and read the guides first.

## What works today

| Phone | ROM | Status | Tested with |
| --- | --- | --- | --- |
| Google Pixel 4 (`flame`) | LineageOS 24.0 | ✅ Works | build `20261015` |
| Xiaomi Mi Pad 4 (`clover`) | PixelExperience Plus 13 | ✅ Works | build `20240126` |
| Xiaomi Mi Pad 4 Plus (`clover`) | PixelExperience Plus 13 | Untested, same codename as Mi Pad 4 | |
| Pixel 6a and others in the list | various | Simulation only, does not touch the phone | |

Tested from Chrome on Windows. Chrome or Edge on a computer is required (WebUSB). Firefox and Safari do not support it.

## What it does
1. Checks your files (type, size, optional SHA-256).
2. Connects to the phone in fastboot mode through WebUSB and **checks its codename and bootloader state before writing anything**.
3. Flashes the needed partitions.
4. Sends the ROM to the phone's recovery with a built-in ADB sideload client.
5. Explains every error in plain words, with what to do next.

There is also a plain-language page, [`learn.html`](learn.html), that explains what a ROM, a bootloader and a recovery are.

## Run it
```
python -m http.server 8000
```
Open `http://localhost:8000` in Chrome. For a public copy, any static host with https works, for example GitHub Pages. WebUSB needs https or localhost.

## How it is built
| File | Role |
| --- | --- |
| `index.html`, `learn.html`, `style.css` | The site and the guides |
| `app.js` | Device list, installer steps and screens |
| `flash.js` | Fastboot flashing on top of fastboot.js |
| `adb.js` | Minimal ADB over WebUSB, only what `adb sideload` needs |
| `help.js` | Turns technical errors into plain-language help |
| `fastboot.min.js` | [fastboot.js](https://github.com/kdrag0n/fastboot.js) (MIT) |

## Add a phone or a ROM
See [`CONTRIBUTING.md`](CONTRIBUTING.md). The one rule: only mark something as working after you installed it end to end on a real device.

## Privacy
There is no server and no analytics. Your files are read in your browser only. The only outside request is Google Fonts for the typefaces.

## License and credit
OpenFlash is released under the [MIT License](LICENSE). You are free to use, copy and modify it, but you must **keep the copyright notice and the license text** in copies and substantial parts of it. If you build on OpenFlash, a link back to this project is appreciated.

Copyright (c) 2026 @bobaka10.

Built on [fastboot.js](https://github.com/kdrag0n/fastboot.js) and inspired by [android-webinstall](https://github.com/kdrag0n/android-webinstall), both by Danny Lin (kdrag0n). See [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).

ROMs belong to their authors. OpenFlash is not affiliated with Google, Xiaomi, LineageOS, PixelExperience or any other ROM project.
