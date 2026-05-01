type Stop = () => void

type AmbientHandle = {
  ctx: AudioContext
  master: GainNode
  setRoom: (roomId: string) => void
  stop: () => Promise<void>
}

const FADE = 1.2

function noiseBuffer(ctx: AudioContext, seconds = 4, kind: 'white' | 'brown' = 'brown'): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    if (kind === 'brown') {
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.2
    } else {
      data[i] = white
    }
  }
  return buffer
}

function bench(ctx: AudioContext, master: GainNode): Stop {
  // soft leaf rustle — high-pass filtered noise so there's NO low rumble
  const leaves = ctx.createBufferSource()
  leaves.buffer = noiseBuffer(ctx, 5, 'white')
  leaves.loop = true
  const leavesHp = ctx.createBiquadFilter()
  leavesHp.type = 'highpass'
  leavesHp.frequency.value = 1800
  const leavesLp = ctx.createBiquadFilter()
  leavesLp.type = 'lowpass'
  leavesLp.frequency.value = 6800
  const leavesGain = ctx.createGain()
  leavesGain.gain.value = 0
  leavesGain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + FADE)
  // slow swell so it's not flat
  const leavesLfo = ctx.createOscillator()
  leavesLfo.frequency.value = 0.085
  const leavesLfoDepth = ctx.createGain()
  leavesLfoDepth.gain.value = 0.012
  leavesLfo.connect(leavesLfoDepth)
  leavesLfoDepth.connect(leavesGain.gain)
  leaves.connect(leavesHp)
  leavesHp.connect(leavesLp)
  leavesLp.connect(leavesGain)
  leavesGain.connect(master)
  leaves.start()
  leavesLfo.start()

  // crickets — chirp pulses on bandpass-filtered noise
  const cricketSrc = ctx.createBufferSource()
  cricketSrc.buffer = noiseBuffer(ctx, 4, 'white')
  cricketSrc.loop = true
  const cricketBp = ctx.createBiquadFilter()
  cricketBp.type = 'bandpass'
  cricketBp.frequency.value = 4400
  cricketBp.Q.value = 14
  const cricketGain = ctx.createGain()
  cricketGain.gain.value = 0
  cricketSrc.connect(cricketBp)
  cricketBp.connect(cricketGain)
  cricketGain.connect(master)
  cricketSrc.start()

  let stopped = false
  function chirp(at: number) {
    if (stopped) return
    cricketGain.gain.setValueAtTime(0, at)
    cricketGain.gain.linearRampToValueAtTime(0.1, at + 0.018)
    cricketGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16)
  }
  function scheduleBurst() {
    if (stopped) return
    const t = ctx.currentTime
    chirp(t + 0.02)
    chirp(t + 0.34)
    chirp(t + 0.66)
    if (Math.random() > 0.5) chirp(t + 0.98)
    const next = 2400 + Math.random() * 2600
    setTimeout(scheduleBurst, next)
  }
  setTimeout(scheduleBurst, 800)

  return () => {
    stopped = true
    const t = ctx.currentTime
    leavesGain.gain.cancelScheduledValues(t)
    leavesGain.gain.linearRampToValueAtTime(0, t + FADE)
    cricketGain.gain.cancelScheduledValues(t)
    cricketGain.gain.linearRampToValueAtTime(0, t + FADE)
    setTimeout(() => {
      try { leaves.stop(); leavesLfo.stop(); cricketSrc.stop() } catch {}
    }, FADE * 1000 + 50)
  }
}

function rain(ctx: AudioContext, master: GainNode): Stop {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, 4, 'white')
  src.loop = true

  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 800
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 4200

  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.gain.linearRampToValueAtTime(0.13, ctx.currentTime + FADE)

  src.connect(hp)
  hp.connect(lp)
  lp.connect(gain)
  gain.connect(master)
  src.start()

  // distant low rumble
  const rumble = ctx.createBufferSource()
  rumble.buffer = noiseBuffer(ctx, 6, 'brown')
  rumble.loop = true
  const rlp = ctx.createBiquadFilter()
  rlp.type = 'lowpass'
  rlp.frequency.value = 180
  const rgain = ctx.createGain()
  rgain.gain.value = 0
  rgain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + FADE)
  rumble.connect(rlp)
  rlp.connect(rgain)
  rgain.connect(master)
  rumble.start()

  return () => {
    const t = ctx.currentTime
    gain.gain.cancelScheduledValues(t)
    gain.gain.linearRampToValueAtTime(0, t + FADE)
    rgain.gain.cancelScheduledValues(t)
    rgain.gain.linearRampToValueAtTime(0, t + FADE)
    setTimeout(() => {
      try { src.stop(); rumble.stop() } catch {}
    }, FADE * 1000 + 50)
  }
}

function store(ctx: AudioContext, master: GainNode): Stop {
  // soft low hum — single 120Hz with a touch of 60Hz, kept gentle
  const hum120 = ctx.createOscillator()
  hum120.type = 'sine'
  hum120.frequency.value = 120
  const hum60 = ctx.createOscillator()
  hum60.type = 'sine'
  hum60.frequency.value = 60
  const humGain = ctx.createGain()
  humGain.gain.value = 0
  humGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + FADE)
  hum60.connect(humGain)
  hum120.connect(humGain)
  humGain.connect(master)
  hum60.start()
  hum120.start()

  // fluorescent buzz — bandpass-filtered noise sitting in the audible mid range
  const buzzSrc = ctx.createBufferSource()
  buzzSrc.buffer = noiseBuffer(ctx, 4, 'white')
  buzzSrc.loop = true
  const buzzBp = ctx.createBiquadFilter()
  buzzBp.type = 'bandpass'
  buzzBp.frequency.value = 1700
  buzzBp.Q.value = 4.5
  const buzzGain = ctx.createGain()
  buzzGain.gain.value = 0
  buzzGain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + FADE)
  const buzzLfo = ctx.createOscillator()
  buzzLfo.frequency.value = 0.22
  const buzzLfoDepth = ctx.createGain()
  buzzLfoDepth.gain.value = 0.018
  buzzLfo.connect(buzzLfoDepth)
  buzzLfoDepth.connect(buzzGain.gain)
  buzzSrc.connect(buzzBp)
  buzzBp.connect(buzzGain)
  buzzGain.connect(master)
  buzzSrc.start()
  buzzLfo.start()

  // higher fluorescent shimmer
  const shimmerSrc = ctx.createBufferSource()
  shimmerSrc.buffer = noiseBuffer(ctx, 4, 'white')
  shimmerSrc.loop = true
  const shimmerBp = ctx.createBiquadFilter()
  shimmerBp.type = 'bandpass'
  shimmerBp.frequency.value = 3400
  shimmerBp.Q.value = 8
  const shimmerGain = ctx.createGain()
  shimmerGain.gain.value = 0
  shimmerGain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + FADE)
  shimmerSrc.connect(shimmerBp)
  shimmerBp.connect(shimmerGain)
  shimmerGain.connect(master)
  shimmerSrc.start()

  // refrigerator click — short noise burst every 6-12s
  const clickGain = ctx.createGain()
  clickGain.gain.value = 0
  const clickBp = ctx.createBiquadFilter()
  clickBp.type = 'bandpass'
  clickBp.frequency.value = 2200
  clickBp.Q.value = 3
  const clickSrc = ctx.createBufferSource()
  clickSrc.buffer = noiseBuffer(ctx, 4, 'white')
  clickSrc.loop = true
  clickSrc.connect(clickBp)
  clickBp.connect(clickGain)
  clickGain.connect(master)
  clickSrc.start()

  let stopped = false
  function pop(at: number) {
    if (stopped) return
    clickGain.gain.setValueAtTime(0, at)
    clickGain.gain.linearRampToValueAtTime(0.05, at + 0.008)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.12)
  }
  function scheduleClick() {
    if (stopped) return
    pop(ctx.currentTime + 0.05)
    const next = 6000 + Math.random() * 6000
    setTimeout(scheduleClick, next)
  }
  setTimeout(scheduleClick, 2200)

  return () => {
    stopped = true
    const t = ctx.currentTime
    humGain.gain.cancelScheduledValues(t)
    humGain.gain.linearRampToValueAtTime(0, t + FADE)
    buzzGain.gain.cancelScheduledValues(t)
    buzzGain.gain.linearRampToValueAtTime(0, t + FADE)
    shimmerGain.gain.cancelScheduledValues(t)
    shimmerGain.gain.linearRampToValueAtTime(0, t + FADE)
    clickGain.gain.cancelScheduledValues(t)
    clickGain.gain.linearRampToValueAtTime(0, t + FADE)
    setTimeout(() => {
      try {
        hum60.stop(); hum120.stop(); buzzSrc.stop(); buzzLfo.stop()
        shimmerSrc.stop(); clickSrc.stop()
      } catch {}
    }, FADE * 1000 + 50)
  }
}

function bus(ctx: AudioContext, master: GainNode): Stop {
  const drone = ctx.createOscillator()
  drone.type = 'triangle'
  drone.frequency.value = 92
  const droneOct = ctx.createOscillator()
  droneOct.type = 'sine'
  droneOct.frequency.value = 46
  const droneGain = ctx.createGain()
  droneGain.gain.value = 0
  droneGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + FADE)
  drone.connect(droneGain)
  droneOct.connect(droneGain)
  droneGain.connect(master)
  drone.start()
  droneOct.start()

  // wet road hiss — filtered noise
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, 5, 'white')
  src.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1400
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 300
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + FADE)
  src.connect(hp)
  hp.connect(lp)
  lp.connect(gain)
  gain.connect(master)
  src.start()

  return () => {
    const t = ctx.currentTime
    droneGain.gain.cancelScheduledValues(t)
    droneGain.gain.linearRampToValueAtTime(0, t + FADE)
    gain.gain.cancelScheduledValues(t)
    gain.gain.linearRampToValueAtTime(0, t + FADE)
    setTimeout(() => {
      try { drone.stop(); droneOct.stop(); src.stop() } catch {}
    }, FADE * 1000 + 50)
  }
}

const builders: Record<string, (ctx: AudioContext, master: GainNode) => Stop> = {
  bench,
  rain,
  store,
  bus,
}

export function startAmbient(initialRoom: string): AmbientHandle {
  const Ctor =
    typeof window !== 'undefined'
      ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
      : null

  if (!Ctor) throw new Error('Web Audio not supported')

  const ctx = new Ctor()
  const master = ctx.createGain()
  master.gain.value = 0.55
  master.connect(ctx.destination)

  let stopCurrent: Stop | null = null

  function setRoom(roomId: string) {
    const build = builders[roomId]
    if (!build) return
    if (stopCurrent) stopCurrent()
    stopCurrent = build(ctx, master)
  }

  setRoom(initialRoom)

  return {
    ctx,
    master,
    setRoom,
    async stop() {
      if (stopCurrent) stopCurrent()
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE)
      await new Promise((r) => setTimeout(r, FADE * 1000 + 80))
      try {
        await ctx.close()
      } catch {}
    },
  }
}
