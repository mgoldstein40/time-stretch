import * as fft from "./lib/fft.js";

/* Object mapping strings to anonymous functions that will return the
value for a window of length `winLength` at sample `n`*/
const winTypes = {
    bartlett: (n, winLength) => {
        let halfWin = 0.5 * winLength;
        return 1 - Math.abs((n - halfWin) / halfWin);
    },
    blackman: (n, winLength) => {
        let a0 = 0.42;
        let a1 = 0.5;
        let a2 = 0.08;
        return a0 - (a1 * Math.cos((2 * Math.PI * n) / winLength)) + (a2 * Math.cos((4 * Math.PI * n) / winLength));
    },
    hamming: (n, winLength) => {
        let a0 = 0.53836;
        let a1 = 0.46164;
        return a0 - (a1 * Math.cos((2 * Math.PI * n) / winLength));
    },
    hann: (n, winLength) => Math.pow(winTypes["sin"](n, winLength), 2),
    sin: (n, winLength) => Math.sin((Math.PI * n) / winLength),
    welch: (n, winLength) => {
        let halfWin = 0.5 * winLength;
        return 1 - Math.pow(((n - halfWin) / halfWin), 2);
    }
}

/* Creates a window of the specified type of length `winLength`
    Parameters:
        winType: string
        winLength: int
    Returns:
        Array[float]
*/
function createWindow(winType, winLength) {
    let w = Array(winLength);
    if (winType === "rect") {
        w.fill(1);
    } else {
        for (let n = 0; n < winLength; n++) {
            w[n] = winTypes[winType](n, winLength);
        }
    }
    return w;
}

/* Performs cross-correlation between two arrays and returns the
delay (in samples) that most closely matches the two arrays
    Parameters:
        f, g: Array[float]
    Returns:
        int
*/
function crossCorrArgMax(f, g) {
    f.reverse();
    let h = Array(f.length);
    fft.convolveReal(f, g, h);

    let maxIndex = 0;
    let max = 0;
    for (let i = 1; i < h.length; i++) {
        if (h[i] > max) {
            maxIndex = i;
            max = h[i];
        }
    }
    return maxIndex;
}

/* Stretches audio data while preserving pitch
    Parameters:
        x: Array[float]
            Input signal
        alpha: float
            Stretching factor
        ws: bool
            Whether or not to apply waveform similarity
        winType: string
            Type of window
        frameLength: int
            Length of each frame
        inHopLength: int
            Length of analysis hop
    Returns:
        Array[float]
            Output signal
*/
export function OLA(x, alpha, ws=false, winType="hann", frameLength=2048, inHopLength) {

    if (inHopLength === undefined) {
        inHopLength = Math.floor(frameLength / 4);
    }

    // Input signal length
    let M = x.length;

    // Output signal length
    let L = Math.floor(alpha * M);

    // Empty output signal
    let y = Array(L).fill(0);

    // Number of frames
    let nFrames = Math.floor((M - frameLength + 1) / inHopLength) + 1;

    // Array of frames
    let frames = Array.from(Array(nFrames), () => new Array(frameLength));

    // Window to be applied to each frame
    let w = createWindow(winType, frameLength);

    // Populate `y` by calculating windows from `x`
    for (let i = 0; i < nFrames; i++) {
        for (let n = 0; n < frameLength; n++) {
            frames[i][n] = x[(i * inHopLength) + n] * w[n];
        }

        /* If `ws` is true, add optimal delay to each frame by comparing it to
        the previous frame*/
        if (ws && i > 1) {
            let delay_i = crossCorrArgMax(frames[i], frames[i - 1]);
            if (delay_i < inHopLength && delay_i > -inHopLength && delay_i !== 0) {
                for (let n = 0; n < frameLength; n ++) {
                    frames[i][n] = x[index_i + n + delay_i] * w[n];
                }
            }
        }
    }

    // Synthesis hop length
    let outHopLength = Math.floor(inHopLength * alpha);

    // Synthesize the windows into y
    for (let i = 0; i < nFrames; i++) {
        for (let n = 0; n < frameLength; n++) {
            y[(i * outHopLength) + n] += frames[i][n]
        }
    }

    return y;
}

/* Stretches audio data while preserving pitch
    Parameters:
        x: Array[float]
            Input signal
        alpha: float
            Stretching factor
        winType: string
            Type of window
        frameLength: int
            Length of each frame
        inHopLength: int
            Length of analysis hop
    Returns:
        Array[float]
            Output signal
*/
export function phaseVocoder(x, alpha, winType="hann", frameLength=2048, inHopLength) {

    if (inHopLength === undefined) {
        inHopLength = Math.floor(frameLength / 4);
    }

    // Input signal length
    let M = x.length;

    // Output signal length
    let L = Math.floor(alpha * M);

    // Empty output signal
    let y = Array(L).fill(0);

    // Number of frames
    let nFrames = Math.floor((M - frameLength + 1) / inHopLength) + 1;

    // Array of frames
    let frames = Array.from(Array(nFrames), () => new Array(frameLength));

    // Window to be applied to each frame
    let w = createWindow(winType, frameLength);

    // Populate X by calculating windows from x
    for (let i = 0; i < nFrames; i++) {
        for (let n = 0; n < frameLength; n++) {
            frames[i][n] = x[(i * inHopLength) + n] * w[n];
        }
    }

    // Synthesis hop length
    let outHopLength = Math.floor(inHopLength * alpha);

    // `omega[k]` is the center frequency of the frequency bin `k`
    let omega = Array(frameLength);
    for (let k = 0; k < frameLength; k++) {
        omega[k] = (2 * Math.PI * k) / frameLength;
    }

    // Array of last input frame phase values
    let lastPhi = Array(frameLength).fill(0);

    // Array of last output frame phase values
    let lastPhiY = Array(frameLength).fill(0);
    
    for (let i = 0; i < nFrames; i++) {
        // Perform FFT on the input frame
        let realX = frames[i].slice(0);
        let imagX = fft.newArrayOfZeros(frameLength);
        fft.transform(realX, imagX);

        // Empty real portion of the output frame
        let realY = Array(frameLength);

        // Empty imaginary portion of the output frame
        let imagY = Array(frameLength);

        for (let k = 0; k < frameLength; k++) {
            // Magnitude of the kth bin of the input frame
            let mag = Math.sqrt((realX[k] ** 2) + (imagX[k] ** 2));

            // Phase of the kth bin of the input phrame
            let phi = Math.atan(imagX[k] / realX[k]);

            /* Difference between the phase of this bin and the last bin and
            the central frequency of bin k*/
            let phiDiff = phi - lastPhi[k] - omega[k];

            // `phiDiff` unwrapped for continuity
            let unwrappedDiff = ((phiDiff + Math.PI) % (2 * Math.PI) - Math.PI);

            // Unwrapped frequency in bin k
            let freq = omega[k] + (unwrappedDiff / inHopLength);

            // Output frequency for bin k
            let phiY = lastPhiY[k] + (outHopLength * freq);

            // Set the kth value of the output arrays
            realY[k] = mag * Math.cos(phiY);
            imagY[k] = mag * Math.sin(phiY);

            // Set the kth values of these variables for the next iteration
            lastPhi[k] = phi;
            lastPhiY[k] = phiY;
        }

        // Perform the inverse FFT on the output frame arrays
        fft.inverseTransform(realY, imagY);

        // Load the windowed output frame into the `frames` variable
        for (let k = 0; k < frameLength; k++) {
            frames[i][k] = realY[k] * w[k];
        }
    }

    // Synthesize the windows into y
    for (let i = 0; i < nFrames; i++) {
        for (let n = 0; n < frameLength; n++) {
            y[n + (i * outHopLength)] += frames[i][n];
        }
    }
    
    return y;
}