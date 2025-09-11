class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        // 入力は通常float32 (-1.0 to 1.0)
        const input = inputs[0];
        if (input.length > 0) {
            const pcmData = new Int16Array(input[0].length);
            for (let i = 0; i < input[0].length; i++) {
                // float32をint16に変換
                pcmData[i] = input[0][i] * 32767;
            }
            // メインスレッドにデータを送信
            this.port.postMessage(pcmData, [pcmData.buffer]);
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);