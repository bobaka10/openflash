# Contributing to OpenFlash

Thank you for helping! Please read this first, because this tool writes to real phones.

## The one rule
**A device or ROM may only be marked as working after it was installed end to end on a real device.** Add what you tested (device, ROM build, browser, operating system) to the table in `README.md`. Entries without a `plan` in `app.js` are simulations and never touch a phone.

## Run it locally
```
python -m http.server 8000
```
Open `http://localhost:8000` in Chrome or Edge. Do not open `index.html` by double-clicking, modules do not load from `file://`.

## Add a device or ROM
Devices are described in the `DEVICES` list at the top of `app.js`. A real install needs a `plan`:

```js
plan: {
  products: ["codename"],                       // what `fastboot getvar product` returns, flashing stops if it differs
  flash: [{ role: "recovery", partition: "recovery" }],   // files to write, in order; add `reboot: "bootloader"` to restart after one
  manualRecovery: "text",                       // optional: do not reboot by command, show these steps instead
  sideloadNote: "text"                          // optional: extra note shown after the ROM was sent
}
```
Each entry in `files` has a `role` that matches a `flash` step (or `rom` for the zip), the expected extension, a minimum size and a hint for the user. Take the steps from the ROM's own installation instructions, and link them.

## Other ways to help
- Test on more phones and report the exact log.
- Translate `learn.html` and the guides.
- Improve the error explanations in `help.js`.
- Move each device into its own JSON file with a validation check (planned).

## Pull requests
Keep them small and say in the description what you tested and on which device. By contributing you agree that your work is released under the MIT license of this project.
