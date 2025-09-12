// そのまま 128 サンプル(≈8ms@16k) Int16 を postMessage
class AudioProcessor extends AudioWorkletProcessor {
  constructor(){ super(); this.seq=0; }
  process(inputs){
    const ch = inputs[0];
    if (ch && ch[0] && ch[0].length){
      const f32 = ch[0];
      const pcm = new Int16Array(f32.length);
      for (let i=0;i<f32.length;i++){
        let v=f32[i]; if (v>1)v=1; if(v<-1)v=-1;
        pcm[i] = v*32767;
      }
      this.port.postMessage(pcm, [pcm.buffer]);
    }
    return true;
  }
}
registerProcessor("audio-processor", AudioProcessor);