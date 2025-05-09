class Audio {
    constructor(fileName) {
        this.audioContext = new AudioContext();
        this.panner = this.audioContext.createPanner();
        this.filter = this.audioContext.createBiquadFilter();
        this.filter.type = 'highpass';

        this.useFilter = true;
        this.fileName = fileName;

        const listener = this.audioContext.listener;
        listener.setPosition(0, 0, 0);
        listener.setOrientation(0, 0, -1, 0, 1, 0);

        this.fetchAudio(fileName);
    }

    fetchAudio(fileName) {
        fetch(fileName)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => this.play(audioBuffer))
            .catch(error => console.error('Error loading audio file:', error));
    }

    play(audioBuffer) {
        const src = this.audioContext.createBufferSource();
        src.buffer = audioBuffer;
        src.connect(this.panner);

        this.updateRouting();

        src.start();
    }

    updatePos(x, y, z) {
        this.panner.setPosition(x, y, z);
    }

    enableFilter(enabled) {
        this.useFilter = enabled;
        this.updateRouting();
    }

    updateRouting() {
        try {
            this.panner.disconnect();
        } catch (e) {
        }

        if (this.useFilter) {
            this.panner.connect(this.filter);
            this.filter.connect(this.audioContext.destination);
        } else {
            this.panner.connect(this.audioContext.destination);
        }
    }
}

export { Audio };
