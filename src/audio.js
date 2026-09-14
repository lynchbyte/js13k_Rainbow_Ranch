export class AudioManager {
    constructor(stage) {

        this.ctx = stage.listener.context;
        this.dest = stage.listener.getInput();

        //for testing into tune
        //const unlockAudio = () => {


        // if (this.ctx.state === 'suspended') {

        //     this.ctx.resume();
        //     console.log('Audio context resumed');

        // }
        // // Remove the listener immediately so it only fires once
        // document.removeEventListener('click', unlockAudio);
        // document.removeEventListener('keydown', unlockAudio);
        // };

        // document.addEventListener('click', unlockAudio);
        // document.addEventListener('keydown', unlockAudio);

    }

    playSfx(v) {

        const c = this.ctx, t = c.currentTime;

        const o = (sF, eF, bnd, dur, type, st) => {
            const d = Math.max(0.001, dur), b = Math.max(0.001, bnd);

            const g = c.createGain();
            g.connect(this.dest);
            g.gain.setValueAtTime(1, st);
            g.gain.exponentialRampToValueAtTime(0.001, st + d);

            const os = c.createOscillator();
            os.type = type || 'sine';
            os.frequency.setValueAtTime(sF, st);
            os.frequency.linearRampToValueAtTime(eF, st + d * b);

            os.connect(g);
            os.start(st);
            os.stop(st + d);
        }

        // 1. Play the first sound immediately at time 't'
        o(v[0], v[1], v[2], v[3], v[4], t);

        // 2. If v[5] is true, play the second sound sequentially at 't + dur1'
        if (v[5]) {
            o(v[6], v[7], v[8], v[9], v[10], t + Math.max(0.001, v[3]));
        }
    }
  

    createTrigger(v, c = 0,) {

        // v = sound array, c = cooldown in seconds (0 means play once)
        let l = -99; // last played time
        return () => {
            let t = this.ctx.currentTime;
        
            if (c ? t - l >= c : l < 0) {
                l = t;
                this.playSfx(v);
            }
        };
    }

    initSong() {

        const p = new CPlayer();
        p.init(song);
        while (p.gen() < 1) { }
        const s = this.ctx.createBufferSource();
        s.buffer = p.create(this.ctx);
        s.loop = false;

        const g = this.ctx.createGain();
        g.gain.value = 0.15; //volume down
        s.connect(g);

        g.connect(this.dest);
        s.start();

    }
}

const song = {

    d: [
        {
            // i[0] changed from 3 to 1 to keep CPlayer stable
            i: [1, 100, 128, 0, 0, 201, 128, 0, 0, 0, 5, 6, 23, 0, 0, 0, 0, 195, 6, 1, 2, 135, 0, 0, 32, 147, 6, 121, 6],
            p: [1],
            c: [{ n: [147, 149, 151, 156, 154, 156, 154, , 147, 149, 151, 156, 154, 156, 154, , 147, 149, 151, 156, 154, 156, 154, 154, 154, 154, 154, 154] }]
        }
    ],
    r: 8269, l: 30, e: 0, c: 1

};


class CPlayer {

    init(s) {
        this.s = s;
        this.w = s.r * s.l * (s.e + 1) * 2;
        this.m = new Int32Array(this.w);
        this.col = 0;
        this.osc = [
            v => Math.sin(v * 6.283184),
            v => { let v2 = (v % 1) * 4; return v2 < 2 ? v2 - 1 : 3 - v2; }
        ];
    }

    gen() {
        let chn = new Int32Array(this.w), s = this.s, instr = s.d[this.col], r = s.r, l = s.l;
        let low = 0, band = 0, high, filterAct = false, noteCache = [];

        for (let p = 0; p <= s.e; ++p) {
            let cp = instr.p[p];
            for (let row = 0; row < l; ++row) {
                let oLFO = this.osc[instr.i[16]], lAmt = instr.i[17] / 512, lFreq = (2 ** (instr.i[18] - 9)) / r;
                let fLFO = instr.i[19], fFilt = instr.i[20], fFreq = instr.i[21] * 43.23529 * 3.141592 / 44100;
                let q = 1 - instr.i[22] / 255, dist = instr.i[23] * 1e-5, drive = instr.i[24] / 32;
                let pAmt = instr.i[25] / 512, pFreq = 6.283184 * (2 ** (instr.i[26] - 9)) / r;
                let dAmt = instr.i[27] / 255, dly = (instr.i[28] * r) & ~1, rs = (p * l + row) * r;

                for (let c = 0; c < 4; ++c) {
                    let n = cp && instr.c[cp - 1] && instr.c[cp - 1].n ? instr.c[cp - 1].n[row + c * l] : 0;
                    if (n) {
                        if (!noteCache[n]) {
                            let a = instr.i[10] ** 2 * 4, su = instr.i[11] ** 2 * 4, re = instr.i[12] ** 2 * 4;
                            let nb = new Int32Array(a + su + re), c1 = 0, c2 = 0;
                            for (let j = 0; j < a + su + re; j++) {
                                let o1 = 0.0039595 * (2 ** ((n + instr.i[2] - 256) / 12));
                                let o2 = 0.0039595 * (2 ** ((n + instr.i[6] - 256) / 12)) * (1 + 0.0008 * instr.i[7]);
                                let e = j < a ? j / a : j >= a + su ? (1 - (j - a - su) / re) * (3 ** (-instr.i[13] / 16 * ((j - a - su) / re))) : 1;
                                c1 += o1 * (e ** (instr.i[3] / 32)); c2 += o2 * (e ** (instr.i[8] / 32));
                                nb[j] = (80 * (this.osc[instr.i[0]](c1) * instr.i[1] + this.osc[instr.i[4]](c2) * instr.i[5]) * e) | 0;
                            }
                            noteCache[n] = nb;
                        }
                        let nb = noteCache[n];
                        for (let j = 0, i = rs * 2; j < nb.length; j++, i += 2) chn[i] += nb[j];
                    }
                }

                for (let j = 0; j < r; j++) {
                    let k = (rs + j) * 2, rsmp = chn[k], lsmp;
                    if (rsmp || filterAct) {
                        let f = fFreq;
                        if (fLFO) f *= oLFO(lFreq * k) * lAmt + 0.5;
                        f = 1.5 * Math.sin(f);
                        low += f * band; high = q * (rsmp - band) - low; band += f * high;
                        rsmp = fFilt == 3 ? band : fFilt == 1 ? high : low;
                        if (dist) { rsmp *= dist; rsmp = rsmp < 1 ? rsmp > -1 ? Math.sin(rsmp * .25) : -1 : 1; rsmp /= dist; }
                        rsmp *= drive; filterAct = rsmp * rsmp > 1e-5;
                        let t = Math.sin(pFreq * k) * pAmt + 0.5;
                        lsmp = rsmp * (1 - t); rsmp *= t;
                    } else lsmp = 0;
                    if (k >= dly) { lsmp += chn[k - dly + 1] * dAmt; rsmp += chn[k - dly] * dAmt; }
                    chn[k] = lsmp | 0; chn[k + 1] = rsmp | 0;
                    this.m[k] += lsmp | 0; this.m[k + 1] += rsmp | 0;
                }
            }
        }
        return ++this.col / s.c;
    }

    create(ctx) {
        let b = ctx.createBuffer(2, this.w / 2, 44100);
        for (let i = 0; i < 2; i++) {
            let d = b.getChannelData(i);
            for (let j = i; j < this.w; j += 2) d[j >> 1] = this.m[j] / 65536;
        }
        return b;
    }
}

export const sfx = {
  
    dkIncoming: [800, 50, 1, 2.0, 'sawtooth'],

    dkHeeHaw: [250, 430, 1, 0.2, 'sawtooth', true, 220, 55, 0.6, 1, 'sawtooth'],


    dogWoof: [700, 70, 0.2, 0.3, 'square', true, 600, 60, 0.2, 0.3, 'square'],

    losePowerDown: [700, 40, 1, 1.5, 'square'],

    keanuHarp: [400, 1600, 0.5, 1.5, 'sine'],
    keanuWin: [700, 100, 1, 1, 'sine', true, 800, 100, 1, 1, 'sine'],
};

//audioManager.playSfx(sfx.gem);
