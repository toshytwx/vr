class Audio {
    constructor(fileName) {
        this.audioContext = new AudioContext();
        this.panner = this.audioContext.createPanner();
        this.fileName = fileName;

        this.fetchAudio(fileName);
    }

    fetchAudio(fileName) {
        fetch(fileName).then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => this.play(audioBuffer)).catch(error => console.error('Error loading audio file:', error));
    }

    play(audioBuffer) {
        const src = this.audioContext.createBufferSource();
        this.setFilter();

        src.buffer = audioBuffer;
        src.connect(this.audioContext.destination);
        src.connect(this.panner);
        src.start();

        this.panner.connect(this.audioContext.destination);

        const listener = this.audioContext.listener;
        listener.setPosition(0, 0, 0);
        listener.setOrientation(0, 0, -1, 0, 1, 0)
    }

    updatePos(x, y, z) {
        this.panner.setPosition(x, y, z);
    }

    setFilter() {
        const biquadFilter = this.audioContext.createBiquadFilter();

        biquadFilter.connect(this.audioContext.destination);
        biquadFilter.type = 'highpass'; // High-pass filter
        this.panner.connect(biquadFilter);
    }
}

export { Audio };