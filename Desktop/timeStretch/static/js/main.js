import * as stretch from "./stretch.js";

// Global variable representing all valid TunePad sounds (as of 9/2/2021)
const validSounds = [
	2, 3, 4, 8, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
	56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 70, 72, 73, 74, 75,
	78, 79, 80, 82, 83, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98,
	99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113,
	114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128,
	129, 130, 131, 132, 133, 134, 135, 136, 137, 139, 140, 142, 143, 145, 147,
	150, 152, 153, 155, 156, 158, 159, 160, 162, 164, 167, 168, 169, 170, 171,
	176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190,
	191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205,
	206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 221,
	222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236,
	237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251,
	252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266,
	267, 268, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 283, 284, 285,
	286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300,
	301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315,
	316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 331,
	332, 333, 334, 337, 338, 339, 341, 342, 343, 344, 345, 346, 347, 348, 349,
	350, 351, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365,
	366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380,
	381, 382, 383, 384, 385, 386, 387, 389, 390, 391, 392, 393, 394, 395, 396,
	397, 398, 399, 400, 401, 403, 406, 407, 408, 409, 410, 411, 412, 413, 414,
	415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429,
	430, 431, 432, 433, 434, 435, 436, 441, 442, 450, 452, 453, 454, 455, 456,
	457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 468, 469, 470, 471, 472,
	473, 474, 475, 476, 477, 478, 482, 483, 489, 491, 509, 511, 512, 513, 514,
	515, 516, 517, 518, 522, 523, 524, 528
];

/* Global variables set by the #sound-form element
	currentSound: undefined | Blob audio file
	alpha: undefined | float
	algorithm: undefined | string
*/
var algorithm;
var alpha;
var currentSound;
var winType;

/* Variables that refer to HTML elements in the "Sound ID Tester" section
	testForm: form element
	testField: input element that takes the sound ID
	testResult: paragraph element that displays the result
*/
const testForm = document.getElementById("test-form");
const testField = document.getElementsByName("test-field")[0];
const testResult = document.getElementById("test-result");

/* Variables that refer to HTML elements in the "Parameters" section
	soundField: input element that takes the sound ID
*/
const soundField = document.getElementsByName("sound-field")[0];
const stretchField = document.getElementsByName("stretch-field")[0];
const algoField = document.getElementsByName("algo-field")[0];
const winField = document.getElementsByName("win-field")[0];
const soundForm = document.getElementById("main-form");

const loadingText = document.getElementById("loading-text");
const loadedID = document.getElementById("loaded-id");
const loadedName = document.getElementById("loaded-name");
const loadedDuration = document.getElementById("loaded-duration");
const stretchedDuration = document.getElementById("stretched-duration");
const originalButton = document.getElementById("original-btn");
const stretchedButton = document.getElementById("stretched-btn");

const URL = "https://api.tunepad.space/recorder/audio/";
const metaURL = "https://api.tunepad.space/api/recording/";

/* Converts a Blob audio file into an ArrayBuffer
	Parameters:
		file: Blob audio file
	Returns:
		ArrayBuffer
*/
function readFile(file) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = () => reject();
		reader.readAsArrayBuffer(file);
	});
}

/* Set global variables `currentSound`, `alpha`, and `algorithm`
	Parameters:
		n: int
		factor: float
		algo: string
*/
function loadInfo(n, factor, algo, win) {
	// Handle the loading "animation" by changing `loadingText` every so .75s
	loadingText.innerHTML = "Loading";
	const loadingFunc = setInterval(() => {
		if (loadingText.innerHTML === "Loading...") {
			loadingText.innerHTML = "Loading";
		} else {
			loadingText.innerHTML += ".";
		}
	}, 750);
	
	// Send a GET request for metadata about the TunePad sound
	const metaRequest = new XMLHttpRequest();
	metaRequest.responseType = "json";
	metaRequest.open("GET", metaURL + n, true);
	
	metaRequest.onload = e => {
		if (metaRequest.status !== 200) {
			alert(n + " is not a valid TunePad sound number.");
		}
		
		let dur = metaRequest.response.duration;
		
		// Send a GET request for the TunePad sound's audio file
		const request = new XMLHttpRequest();
		request.responseType = "blob";
		request.open("GET", URL + n, true);
		
		request.onload = e => {
			if (request.status !== 200) {
				alert(n + " is not a valid TunePad sound number.");
			}
			
			// End the loading "animation"
			clearInterval(loadingFunc);
			loadingText.innerHTML = "&nbsp;";
			
			// Update display elements with the Tunepad sound's information
			loadedID.innerHTML = n;
			loadedName.innerHTML = metaRequest.response.name;
			loadedDuration.innerHTML = parseFloat(dur.toFixed(3));
			stretchedDuration.innerHTML = parseFloat((dur * factor).toFixed(3));
			
			// Update global variables with the Tunepad sound's information
			currentSound = request.response;
			alpha = 1 / factor;
			algorithm = algo;
			winType = win;
		};
		request.send();
	};
	metaRequest.send();
}

/* Plays the original or stretched version of sounds based on the current
values of global variables
	Parameters:
		isStretched: bool
*/
async function handlePlay(isStretched) {
	// Handle cases where the form is not filled out completely
	if (currentSound === undefined) {
		alert("Please select a sound number first.");
	} else if (alpha === undefined) {
		alert("Please select a stretching factor first.");
	} else if (algorithm === undefined) {
		alert("Please select a stretching algorithm first.");
	} else {
		// Read the sound as an ArrayBuffer from its Blob representation
		let arrayBuffer = await readFile(currentSound);

		// Initialize a new WebAudio AudioContext
		var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

		/* Decode `arrayBuffer` and apply stretching algorithms to it if the
		`isStretched` parameter is true*/
		audioCtx.decodeAudioData(arrayBuffer.slice(0)).then(decodedBuff => {
			// Initialize empty ArrayBuffer `newBuffer` to hold output data
			let nChannels = decodedBuff.numberOfChannels;
			let sr = decodedBuff.sampleRate;
			let len = decodedBuff.length;
			if (isStretched) {
				len = Math.round(len * alpha);
			}
			let newBuffer = audioCtx.createBuffer(nChannels, len, sr);
			
			/* For each channel, iterate through the channel data from `decodedBuff`,
			copying it into the corresponding channel of `newBuffer` if `isStretched`
			is false and stretching it using the appropriate algorithm otherwise*/
			for (let channel = 0; channel < nChannels; channel++) {
				var oldChannelData = decodedBuff.getChannelData(channel);
			
				if (isStretched) {
					var stretchedChannelData;
					if (algorithm === "OLA") {
						stretchedChannelData = stretch.OLA(oldChannelData.slice(0), alpha, false, winType);
					} else if (algorithm === "WSOLA") {
						stretchedChannelData = stretch.OLA(oldChannelData.slice(0), alpha, true, winType);
					} else {
						stretchedChannelData = stretch.phaseVocoder(oldChannelData.slice(0), alpha, winType);
					}
				}

				var newChannelData = newBuffer.getChannelData(channel);
				for (let i = 0; i < newChannelData.length; i++) {
					if (isStretched) {
						newChannelData[i] = stretchedChannelData[i];
					} else {
						newChannelData[i] = oldChannelData[i];
					}
				}
			}

			// Volume control for the `AudioContext`
			const primaryGainControl = audioCtx.createGain();
			primaryGainControl.gain.setValueAtTime(0.5, 0);
			primaryGainControl.connect(audioCtx.destination);

			// Load `newBuffer` into the AudioContext and play it
			const bufferSource = audioCtx.createBufferSource();
			bufferSource.buffer = newBuffer;
			bufferSource.connect(primaryGainControl);
			bufferSource.start();
		}).catch(() => alert("Could not read sound file."));
	}
}

// Handle submitting the "Sound Tester ID" form
testForm.addEventListener("submit", e => {
	e.preventDefault();
	let isValid = validSounds.includes(parseInt(testField.value));
	testResult.innerHTML = (isValid) ? "Valid" : "Not Valid";
});

// Handle submitting the "Parameters"
soundForm.addEventListener("submit", e => {
	e.preventDefault();
	loadInfo(
		soundField.value,
		stretchField.value,
		algoField.value,
		winField.value
	);
});

// Handle playing the original sound
originalButton.removeEventListener("click", handlePlay);
originalButton.addEventListener("click", () => handlePlay(false));

// Handle playing the stretched sound
stretchedButton.removeEventListener("click", handlePlay);
stretchedButton.addEventListener("click", () => handlePlay(true));