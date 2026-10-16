/*! OpenFlash ADB client | https://github.com/bobaka10/openflash
 *  Copyright (c) 2026 @bobaka10
 *  SPDX-License-Identifier: MIT. See the LICENSE file. */
/* Minimal ADB-over-WebUSB client, only what is needed for `adb sideload` in Lineage Recovery.
   Protocol: https://android.googlesource.com/platform/packages/modules/adb/+/refs/heads/main/protocol.txt */

const CMD = { CNXN:0x4e584e43, AUTH:0x48545541, OPEN:0x4e45504f, OKAY:0x59414b4f, CLSE:0x45534c43, WRTE:0x45545257 };
const VERSION = 0x01000001;          // no payload checksum needed
const OUR_MAX_DATA = 256 * 1024;
const BLOCK = 64 * 1024;             // same block size as the adb host tool
const enc = s => new TextEncoder().encode(s);
const dec = b => new TextDecoder().decode(b);
const name = c => Object.keys(CMD).find(k => CMD[k] === c) || "0x" + c.toString(16);

export class AdbSideloader {
  static supported(){ return typeof navigator !== "undefined" && !!navigator.usb; }
  /* Must be called from a click handler. The phone shows up as a NEW USB device once
     recovery switches to "Apply from ADB", so it has to be picked again. */
  static requestDevice(){
    return navigator.usb.requestDevice({ filters: [{ classCode: 0xff, subclassCode: 0x42, protocolCode: 0x01 }] });
  }

  constructor(device){ this.dev = device; this.rx = ""; this.maxData = 4096; this.version = 0x01000000; }

  async open(){
    const d = this.dev;
    await d.open();
    let found = null;
    for(const cfg of d.configurations)
      for(const itf of cfg.interfaces)
        for(const alt of itf.alternates)
          if(alt.interfaceClass === 0xff && alt.interfaceSubclass === 0x42 && alt.interfaceProtocol === 0x01 && !found)
            found = { cfg, itf, alt };
    if(!found) throw new Error("This USB device has no ADB interface.");
    if(d.configuration === null || d.configuration.configurationValue !== found.cfg.configurationValue)
      await d.selectConfiguration(found.cfg.configurationValue);
    await d.claimInterface(found.itf.interfaceNumber);
    if(found.alt.alternateSetting) await d.selectAlternateInterface(found.itf.interfaceNumber, found.alt.alternateSetting);
    for(const ep of found.alt.endpoints){
      if(ep.direction === "in") this.epIn = ep.endpointNumber; else this.epOut = ep.endpointNumber;
    }
    this.itf = found.itf.interfaceNumber;
  }

  async close(){ try{ await this.dev.releaseInterface(this.itf); }catch(e){} try{ await this.dev.close(); }catch(e){} }

  async _in(n){
    const out = new Uint8Array(n); let got = 0;
    while(got < n){
      const r = await this.dev.transferIn(this.epIn, n - got);
      if(r.status === "stall"){ await this.dev.clearHalt("in", this.epIn); continue; }
      if(r.status !== "ok") throw new Error("USB read failed: " + r.status);
      out.set(new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength), got);
      got += r.data.byteLength;
    }
    return out;
  }

  async _send(cmd, a0, a1, data){
    data = data || new Uint8Array(0);
    const h = new DataView(new ArrayBuffer(24));
    let sum = 0;
    if(this.version < VERSION) for(let i = 0; i < data.length; i++) sum = (sum + data[i]) >>> 0;
    h.setUint32(0, cmd, true); h.setUint32(4, a0, true); h.setUint32(8, a1, true);
    h.setUint32(12, data.length, true); h.setUint32(16, sum, true); h.setUint32(20, (cmd ^ 0xffffffff) >>> 0, true);
    await this.dev.transferOut(this.epOut, h.buffer);
    if(data.length) await this.dev.transferOut(this.epOut, data);
  }

  async _recv(){
    const h = new DataView((await this._in(24)).buffer);
    const cmd = h.getUint32(0, true), a0 = h.getUint32(4, true), a1 = h.getUint32(8, true), len = h.getUint32(12, true);
    if(((cmd ^ 0xffffffff) >>> 0) !== h.getUint32(20, true)) throw new Error("Bad ADB packet (magic mismatch).");
    return { cmd, a0, a1, data: len ? await this._in(len) : new Uint8Array(0) };
  }

  /* ADB handshake. Returns the device banner, e.g. "sideload::...". */
  async connect(){
    await this._send(CMD.CNXN, VERSION, OUR_MAX_DATA, enc("host::\0"));
    for(;;){
      const p = await this._recv();
      if(p.cmd === CMD.CNXN){
        this.version = Math.min(p.a0, VERSION); this.maxData = Math.min(p.a1, OUR_MAX_DATA);
        return dec(p.data);
      }
      if(p.cmd === CMD.AUTH) throw new Error("The phone asks for ADB authorization. Make sure it is in recovery with 'Apply from ADB' selected (not normal Android).");
    }
  }

  /* Waits for the device's OKAY. Any data the device sends meanwhile is acknowledged and queued. */
  async _waitOkay(local, remote){
    for(;;){
      const p = await this._recv();
      if(p.cmd === CMD.OKAY) return;
      if(p.cmd === CMD.WRTE){ this.rx += dec(p.data); await this._send(CMD.OKAY, local, remote); continue; }
      if(p.cmd === CMD.CLSE) throw new Error("The phone closed the sideload connection.");
    }
  }

  async _write(local, remote, bytes){
    for(let o = 0; o < bytes.length; o += this.maxData){
      await this._send(CMD.WRTE, local, remote, bytes.subarray(o, Math.min(bytes.length, o + this.maxData)));
      await this._waitOkay(local, remote);
    }
  }

  /* Equivalent of `adb sideload file.zip`. */
  async sideload(file, onProgress){
    const local = 1;
    await this._send(CMD.OPEN, local, 0, enc(`sideload-host:${file.size}:${BLOCK}\0`));
    let remote = null;
    while(remote === null){
      const p = await this._recv();
      if(p.cmd === CMD.OKAY) remote = p.a0;
      else if(p.cmd === CMD.CLSE) throw new Error("The phone refused sideload. Choose 'Apply update' -> 'Apply from ADB' in recovery first.");
    }
    const total = Math.ceil(file.size / BLOCK);
    for(;;){
      while(this.rx.length < 8){
        const p = await this._recv();
        if(p.cmd === CMD.WRTE){ this.rx += dec(p.data); await this._send(CMD.OKAY, local, remote); }
        else if(p.cmd === CMD.CLSE) throw new Error("The phone closed the connection before the install finished.");
      }
      const tok = this.rx.slice(0, 8); this.rx = this.rx.slice(8);
      if(tok === "DONEDONE"){ try{ await this._send(CMD.CLSE, local, remote); }catch(e){} return; }
      if(tok === "FAILFAIL") throw new Error("The phone reported that the install failed. Check the message on its screen.");
      const block = parseInt(tok, 10);
      if(!Number.isInteger(block) || block < 0 || block >= total) throw new Error("The phone asked for an invalid block: " + JSON.stringify(tok));
      // The phone expects exactly the remaining bytes for the LAST block (it pads with zeros itself).
      // Sending a full padded block would shift the stream and corrupt everything after it.
      const buf = new Uint8Array(await file.slice(block * BLOCK, Math.min(file.size, (block + 1) * BLOCK)).arrayBuffer());
      await this._write(local, remote, buf);
      if(onProgress) onProgress(Math.min(1, (block + 1) / total), block, total);
    }
  }
}
