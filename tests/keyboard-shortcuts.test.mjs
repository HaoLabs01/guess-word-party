import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

class FakeClassList {
  constructor() {
    this.items = new Set();
  }

  add(...names) {
    names.forEach((name) => this.items.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.items.delete(name));
  }

  contains(name) {
    return this.items.has(name);
  }

  toggle(name, force) {
    const shouldAdd = force ?? !this.items.has(name);
    if (shouldAdd) {
      this.items.add(name);
    } else {
      this.items.delete(name);
    }
    return shouldAdd;
  }
}

class FakeElement {
  constructor() {
    this.textContent = "";
    this.innerHTML = "";
    this.value = "";
    this.disabled = false;
    this.hidden = false;
    this.href = "";
    this.src = "";
    this.srcObject = null;
    this.currentTime = 0;
    this.paused = true;
    this.pauseCalls = 0;
    this.download = "";
    this.children = [];
    this.dataset = {};
    this.attributes = new Map();
    this.classList = new FakeClassList();
    this.style = { setProperty: () => {} };
    this.listeners = {};
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  dispatchEvent(event) {
    return this.listeners[event.type]?.(event);
  }

  click() {
    return this.listeners.click?.({ preventDefault: () => {} });
  }

  pause() {
    this.paused = true;
    this.pauseCalls += 1;
  }

  closest() {
    return this;
  }
}

const elements = new Map();
const selectors = [
  "#setupScreen",
  "#gameScreen",
  "#refreshButton",
  "#setupStartButton",
  "#durationButtons",
  "#recordingsList",
  "#recordingsStatus",
  "#score",
  "#streak",
  "#timer",
  "#timerRing",
  "#word",
  "#wordCard",
  "#statusChip",
  "#categoryName",
  "#categoryGrid",
  "#cameraBackdrop",
  "#cameraPreview",
  "#cameraButton",
  "#motionButton",
  "#motionStatus",
  "#recordStatus",
  "#countdownOverlay",
  "#countdownNumber",
  "#recordingPlayback",
  "#downloadRecording",
  "#savedRecordingPath",
  "#resultPanel",
  "#finalScore",
  "#startButton",
  "#correctButton",
  "#skipButton",
  "#againButton",
  "#resetButton",
  "#wordsButton",
];

for (const selector of selectors) {
  elements.set(selector, new FakeElement());
}

elements.get("#resultPanel").classList.add("hidden");

const windowListeners = {};
let now = 1_000;
let lastMediaRequest = null;
let mediaRequestCount = 0;
let lastRecorder = null;
let lastRecorderOptions = null;
let lastUpload = null;
let stoppedTracks = 0;
let motionPermissionRequests = 0;
let locationReplaceTarget = null;
let nextTimerId = 1;
const intervals = new Map();

const DeviceOrientationEvent = {
  async requestPermission() {
    motionPermissionRequests += 1;
    return "granted";
  },
};

function runLatestInterval() {
  const latestId = [...intervals.keys()].at(-1);
  assert.ok(latestId, "expected an active interval");
  intervals.get(latestId)?.();
}

async function finishCountdown() {
  runLatestInterval();
  assert.equal(elements.get("#countdownNumber").textContent, "2", "countdown advances to 2");
  runLatestInterval();
  assert.equal(elements.get("#countdownNumber").textContent, "1", "countdown advances to 1");
  runLatestInterval();
  await Promise.resolve();
  await Promise.resolve();
}

class FakeMediaRecorder {
  static isTypeSupported(mimeType) {
    return mimeType.startsWith("video/mp4");
  }

  constructor(stream, options = {}) {
    this.stream = stream;
    this.mimeType = options.mimeType || "video/webm";
    this.state = "inactive";
    this.ondataavailable = null;
    this.onstop = null;
    this.startTimeslice = null;
    lastRecorderOptions = options;
    lastRecorder = this;
  }

  start(timeslice) {
    this.state = "recording";
    this.startTimeslice = timeslice;
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: { size: 12 } });
    this.onstop?.();
  }
}

const context = {
  console,
  Blob,
  DeviceOrientationEvent,
  MediaRecorder: FakeMediaRecorder,
  URL: {
    createObjectURL: () => "blob:round-recording",
    revokeObjectURL: () => {},
  },
  fetch: async (url, options) => {
    lastUpload = { url, options };
    const contentType = options?.headers?.["Content-Type"] ?? "";
    const extension = contentType.startsWith("video/mp4") ? "mp4" : "webm";
    return {
      ok: true,
      json: async () => ({ ok: true, path: `recordings/test-round.${extension}` }),
    };
  },
  document: {
    querySelector(selector) {
      return elements.get(selector);
    },
    createElement(tagName) {
      const element = new FakeElement();
      element.tagName = tagName.toUpperCase();
      return element;
    },
  },
  navigator: {
    mediaDevices: {
      async getUserMedia(constraints) {
        lastMediaRequest = constraints;
        mediaRequestCount += 1;
        return {
          getTracks: () => [{ stop: () => { stoppedTracks += 1; } }],
        };
      },
    },
  },
  window: {
    addEventListener(type, handler) {
      windowListeners[type] = handler;
    },
    clearInterval: (id) => {
      intervals.delete(id);
    },
    setInterval: (handler) => {
      const id = nextTimerId;
      nextTimerId += 1;
      intervals.set(id, handler);
      return id;
    },
    setTimeout: (handler) => {
      handler();
      return 1;
    },
    location: {
      href: "https://guess-word-party.test/?from=homescreen",
      replace(target) {
        locationReplaceTarget = target;
      },
    },
  },
  Date: {
    now: () => now,
  },
};

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const stylesSource = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const wordsSource = fs.readFileSync(new URL("../words.js", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");

assert.match(html, /src="\.\/words\.js"/, "loads the external word bank before the app");
assert.match(html, /id="setupScreen"/, "renders a setup screen before the game");
assert.match(html, /id="gameScreen"/, "renders a separate game screen");
assert.match(html, /id="refreshButton"/, "renders an in-app restart button for standalone Safari");
assert.match(html, /aria-label="[^"]*重启[^"]*"/, "restart button explains that it restarts the app");
assert.match(html, /id="setupStartButton"/, "renders the setup start button");
assert.match(html, /data-duration="60"/, "lets the user choose 60 seconds");
assert.match(html, /data-duration="180"/, "lets the user choose 180 seconds");
assert.match(html, /data-duration="300"/, "lets the user choose 300 seconds");
assert.match(html, /class="setup-grid"/, "setup page is organized into four visible areas");
assert.match(html, /id="categoryPanel"/, "setup page has a word bank area");
assert.match(html, /id="durationPanel"/, "setup page has a time area");
assert.match(html, /id="recordingPanel"/, "setup page has a recording area");
assert.match(html, /id="recordingsPanel"/, "setup page has a saved videos area");
assert.match(html, /id="recordingsList"/, "renders saved recordings list");
assert.match(html, /id="cameraBackdrop"/, "renders a fullscreen camera backdrop");
assert.match(html, /点头\s*↓/, "correct action is labeled as nod down plus down arrow");
assert.match(html, /抬头\s*↑/, "skip action is labeled as lift head plus up arrow");
assert.match(html, /id="categoryName"/, "shows the current word category");
assert.match(html, /id="categoryGrid"/, "renders a visible category button grid");
assert.doesNotMatch(html, /<select[^>]*id="categorySelect"/, "does not render the word bank as a dropdown");
assert.match(html, /id="cameraPreview"/, "renders the front camera preview");
assert.match(html, /id="cameraButton"/, "renders a camera permission button");
assert.match(html, /id="motionButton"/, "renders a motion permission button");
assert.match(html, /id="motionStatus"/, "shows motion permission status");
assert.match(html, /id="countdownOverlay"/, "renders a pre-round countdown overlay");
assert.match(html, /id="countdownNumber"/, "renders a pre-round countdown number");
assert.doesNotMatch(html, /camera-preview-frame/, "does not reserve a boxed camera preview on the setup page");
assert.match(html, /录制视频/, "recording toggle is labeled as video recording");
assert.match(html, /role="switch"/, "recording toggle uses switch semantics");
assert.match(html, /aria-checked="false"/, "recording toggle exposes its off state");
assert.match(html, /OFF/, "recording switch shows the off side");
assert.match(html, /ON/, "recording switch shows the on side");
assert.match(html, /id="recordingPlayback"/, "renders a recording playback element");
assert.match(html, /id="savedRecordingPath"/, "shows the saved recording path");
assert.doesNotMatch(html, /id="feedback"/, "does not render a duplicate feedback button group");
assert.doesNotMatch(html, /feedback-item/, "does not keep the old feedback cards");
assert.match(html, /id="setupStartButton"[^>]*aria-keyshortcuts="Space"/, "space starts the game from setup");
assert.doesNotMatch(html, /id="correctButton"[^>]*>猜对<\/button>/, "correct button is not only labeled 猜对");
assert.doesNotMatch(html, /id="skipButton"[^>]*>跳过<\/button>/, "skip button is not only labeled 跳过");
vm.createContext(context);
vm.runInContext(wordsSource, context);

const wordGroups = context.window.WORD_GROUPS;
assert.ok(Array.isArray(wordGroups), "word bank exports WORD_GROUPS");
assert.ok(wordGroups.length >= 12, "word bank includes a broad set of categories");
for (const expectedName of ["成语", "美食", "地名", "影视", "动物", "日常", "运动", "职业", "品牌", "游戏", "网络热梗", "物品", "动作", "难词挑战"]) {
  assert.ok(wordGroups.some((group) => group.name === expectedName), `has ${expectedName} category`);
}
for (const group of wordGroups) {
  assert.ok(group.words.length >= 40, `${group.name} has enough curated words`);
  assert.equal(new Set(group.words).size, group.words.length, `${group.name} has no duplicate words`);
}
assert.doesNotMatch(wordsSource, /combine\(/, "word bank does not generate fake compound words");
assert.doesNotMatch(wordsSource, /TARGET_WORDS_PER_CATEGORY/, "word bank does not pad categories to a target size");
assert.doesNotMatch(wordsSource, /草原犀牛|热带金丝猴|动物园熊猫/, "word bank excludes forced fake combinations");

assert.match(appSource, /durationSeconds:\s*180/, "default round length is 180 seconds");
assert.match(appSource, /facingMode:\s*"user"/, "requests the front-facing camera");
assert.match(appSource, /audio:\s*withAudio/, "requests microphone audio only when starting a recording");
assert.match(appSource, /fetch\("\/recordings"/, "uploads recordings to the local project server");
assert.match(appSource, /fetch\("\/recordings"\)/, "loads saved recordings from the local project server");
assert.match(serverSource, /request\.method === "GET" && request\.url === "\/recordings"/, "server lists saved recordings");
assert.match(serverSource, /video\/mp4/, "server serves iPhone-playable MP4 recordings");
assert.match(serverSource, /\.mp4/, "server lists MP4 recordings");
assert.match(stylesSource, /\.category-grid/, "styles the word bank as a grid of category tiles");
assert.match(stylesSource, /\.category-button/, "styles each word bank category as a selectable tile");
assert.match(stylesSource, /\.camera-backdrop[\s\S]*position:\s*fixed[\s\S]*inset:\s*0/, "camera preview fills the whole screen behind the UI");
assert.match(stylesSource, /\.camera-backdrop[\s\S]*pointer-events:\s*none/, "camera backdrop cannot block foreground controls");
assert.match(stylesSource, /\.camera-backdrop[\s\S]*opacity:\s*0/, "camera backdrop is hidden before recording is enabled");
assert.match(stylesSource, /\.camera-backdrop\.active[\s\S]*opacity:\s*0\.[6-9]/, "active camera backdrop is visible enough for describers to see themselves");
assert.match(stylesSource, /#cameraPreview[\s\S]*width:\s*100%[\s\S]*height:\s*100%/, "camera preview fills the fullscreen backdrop");
assert.match(stylesSource, /\.game-screen[\s\S]*pointer-events:\s*auto/, "game controls remain interactive above the camera preview");
assert.match(stylesSource, /\.score-panel,[\s\S]*\.timer[\s\S]*background:\s*rgba\([^)]*0\.[0-3][^)]*\)/, "HUD panels do not hide the camera preview");
assert.match(stylesSource, /\.status-chip[\s\S]*background:\s*rgba\([^)]*0\.[0-3][^)]*\)/, "status chip does not hide the camera preview");
assert.match(stylesSource, /\.word-card[\s\S]*background:\s*rgba\([^)]*0\.[0-3][^)]*\)/, "word card lets the camera preview show through during play");
assert.match(stylesSource, /\.word-card\.correct[\s\S]*background:\s*rgba\([^)]*0\.[0-4][^)]*\)/, "correct feedback keeps the preview visible");
assert.match(stylesSource, /\.word-card\.skip[\s\S]*background:\s*rgba\([^)]*0\.[0-4][^)]*\)/, "skip feedback keeps the preview visible");
assert.match(stylesSource, /\.countdown-overlay[\s\S]*background:\s*rgba\([^)]*0\.[0-3][^)]*\)/, "countdown overlay does not hide the camera preview");
assert.match(stylesSource, /\.ghost[\s\S]*background:\s*rgba\([^)]*0\.[0-3][^)]*\)/, "secondary controls do not hide the camera preview");

vm.runInContext(appSource, context);

async function press(key) {
  let prevented = false;
  await windowListeners.keydown?.({
    key,
    preventDefault() {
      prevented = true;
    },
  });
  return prevented;
}

assert.equal(elements.get("#setupScreen").classList.contains("hidden"), false, "setup screen is visible before starting");
assert.equal(elements.get("#gameScreen").classList.contains("hidden"), true, "game screen is hidden before starting");
assert.equal(elements.get("#timer").textContent, 180, "round defaults to 180 seconds");
assert.ok(elements.get("#categoryName").textContent.length > 0, "category name is rendered");
assert.ok(elements.get("#categoryGrid").children.length >= 6, "category grid lists the word groups");
assert.equal(elements.get("#categoryGrid").children[0].getAttribute("aria-pressed"), "true", "selected category tile is marked");
elements.get("#categoryGrid").listeners.click({ target: elements.get("#categoryGrid").children[1] });
assert.equal(elements.get("#categoryName").textContent, "美食", "clicking a category tile changes the category");
assert.equal(elements.get("#statusChip").textContent, "美食", "clicking a category tile gives visible feedback");
assert.equal(elements.get("#categoryGrid").children[1].getAttribute("aria-pressed"), "true", "clicked category tile becomes selected");
assert.equal(typeof windowListeners.keydown, "function", "registers a keydown listener");
assert.equal(elements.get("#setupStartButton").disabled, true, "start is disabled until motion permission is granted");
assert.equal(elements.get("#motionStatus").textContent, "未开启", "motion permission starts as not enabled on iPhone");
await elements.get("#motionButton").click();
assert.equal(motionPermissionRequests, 1, "motion permission is requested on the setup page");
assert.equal(elements.get("#motionStatus").textContent, "已开启", "motion permission status updates on the setup page");
assert.equal(elements.get("#setupStartButton").disabled, false, "start is enabled after motion permission is granted");
elements.get("#durationButtons").listeners.click({
  target: {
    dataset: { duration: "300" },
    classList: new FakeClassList(),
  },
});
assert.equal(elements.get("#timer").textContent, 300, "duration buttons update the timer preview");

await elements.get("#cameraButton").click();
assert.equal(mediaRequestCount, 1, "turning recording on requests permission once");
assert.equal(lastMediaRequest.audio, true, "recording toggle requests microphone audio");
assert.equal(lastMediaRequest.video.facingMode, "user", "recording toggle requests the front camera");
assert.equal(JSON.stringify(lastMediaRequest.video.width), JSON.stringify({ ideal: 960 }), "recording requests a playback-friendly width");
assert.equal(JSON.stringify(lastMediaRequest.video.height), JSON.stringify({ ideal: 540 }), "recording requests a playback-friendly height");
assert.equal(JSON.stringify(lastMediaRequest.video.frameRate), JSON.stringify({ ideal: 24, max: 30 }), "recording caps frame rate for smoother phone playback");
assert.equal(lastRecorder, null, "recording toggle does not start recording before the round");
assert.ok(elements.get("#cameraPreview").srcObject, "recording toggle shows the authorized preview stream");
assert.equal(elements.get("#cameraBackdrop").classList.contains("active"), true, "recording toggle shows the fullscreen preview backdrop");
assert.equal(elements.get("#recordStatus").textContent, "ON", "recording toggle shows the enabled state");
assert.equal(elements.get("#cameraButton").getAttribute("aria-checked"), "true", "recording toggle exposes its on state");

assert.equal(await press(" "), true, "Space starts the game");
assert.equal(elements.get("#startButton").disabled, true, "game is running after Space");
assert.equal(elements.get("#setupScreen").classList.contains("hidden"), true, "setup screen hides after starting");
assert.equal(elements.get("#gameScreen").classList.contains("hidden"), false, "game screen appears after starting");
assert.equal(elements.get("#timer").textContent, 300, "selected duration is used for the round");
assert.equal(elements.get("#countdownOverlay").classList.contains("hidden"), false, "Space shows the countdown before the first word");
assert.equal(elements.get("#countdownNumber").textContent, "3", "countdown starts at 3");
assert.equal(elements.get("#cameraBackdrop").classList.contains("active"), true, "fullscreen preview stays visible during countdown");
assert.equal(lastMediaRequest.audio, true, "Space requests microphone audio");
assert.equal(lastMediaRequest.video.facingMode, "user", "Space requests the front camera");
assert.equal(mediaRequestCount, 1, "starting the round does not request camera permission again");
assert.equal(motionPermissionRequests, 1, "starting the round does not request motion permission again");
assert.equal(lastRecorder, null, "recording does not start until the countdown ends");

windowListeners.deviceorientation?.({ beta: 90 });
windowListeners.deviceorientation?.({ beta: 118 });
assert.equal(elements.get("#score").textContent, 0, "orientation gestures do not score during countdown");
now += 1_000;
windowListeners.deviceorientation?.({ beta: 90 });

await finishCountdown();
assert.equal(elements.get("#countdownOverlay").classList.contains("hidden"), true, "countdown hides before play begins");
assert.equal(elements.get("#statusChip").textContent, "开始", "round shows start feedback after countdown");
assert.equal(lastRecorder.state, "recording", "recording starts with the round");
assert.equal(lastRecorder.startTimeslice, 1000, "recording flushes small chunks for stable phone playback");
assert.match(lastRecorderOptions.mimeType, /^video\/mp4/, "recording prefers an iPhone-playable MP4 format");
assert.equal(lastRecorderOptions.videoBitsPerSecond, 900_000, "recording limits video bitrate for iPhone playback");
assert.equal(lastRecorderOptions.audioBitsPerSecond, 64_000, "recording limits audio bitrate for iPhone playback");
assert.equal(elements.get("#recordStatus").textContent, "录制中", "recording status is visible");
assert.equal(elements.get("#cameraBackdrop").classList.contains("active"), true, "fullscreen preview stays visible while recording during play");

windowListeners.deviceorientation?.({ beta: 90 });
windowListeners.deviceorientation?.({ beta: 112 });
assert.equal(elements.get("#score").textContent, 0, "small forehead movement does not trigger a correct guess");
windowListeners.deviceorientation?.({ beta: 122 });
assert.equal(elements.get("#score").textContent, 0, "first strong nod sample only confirms intent");
windowListeners.deviceorientation?.({ beta: 123 });
assert.equal(elements.get("#score").textContent, 1, "nodding down from the forehead baseline marks a correct guess");
assert.equal(elements.get("#streak").textContent, 1, "nodding down from the forehead baseline increments the streak");
assert.equal(elements.get("#statusChip").textContent, "+1", "nodding down from the forehead baseline shows correct feedback");
now += 1_000;
windowListeners.deviceorientation?.({ beta: 90 });

windowListeners.deviceorientation?.({ beta: 58 });
assert.equal(elements.get("#score").textContent, 1, "first strong lift sample only confirms intent");
windowListeners.deviceorientation?.({ beta: 57 });
assert.equal(elements.get("#score").textContent, 1, "lifting the head from the forehead baseline skips instead of scoring");
assert.equal(elements.get("#streak").textContent, 0, "lifting the head keeps streak at zero");
assert.equal(elements.get("#statusChip").textContent, "跳过", "lifting the head shows skip feedback");
now += 1_000;
windowListeners.deviceorientation?.({ beta: 90 });

assert.equal(await press("ArrowDown"), true, "prevents page movement for correct shortcut");
assert.equal(elements.get("#score").textContent, 2, "ArrowDown marks a correct guess");
assert.equal(elements.get("#streak").textContent, 1, "ArrowDown increments the streak after a skip");
assert.equal(elements.get("#statusChip").textContent, "+1", "ArrowDown shows correct feedback");

now += 1_000;

assert.equal(await press("ArrowUp"), true, "prevents page movement for wrong shortcut");
assert.equal(elements.get("#score").textContent, 2, "ArrowUp does not add score");
assert.equal(elements.get("#streak").textContent, 0, "ArrowUp resets the streak");
assert.equal(elements.get("#statusChip").textContent, "跳过", "ArrowUp shows skip feedback");

now += 1_000;

assert.equal(await press(" "), true, "Space is handled during the game");
assert.equal(elements.get("#score").textContent, 2, "Space does not mark a correct guess during the game");

now += 1_000;

const stoppedBeforeRecordedRoundEnd = stoppedTracks;
assert.equal(await press("Escape"), true, "Escape stops the round");
assert.equal(elements.get("#startButton").disabled, false, "game is no longer running after Escape");
assert.equal(elements.get("#resultPanel").classList.contains("hidden"), false, "stopping shows the result panel");
assert.equal(lastRecorder.state, "inactive", "recording stops with the round");
assert.ok(stoppedTracks > stoppedBeforeRecordedRoundEnd, "ending a recorded round releases the live camera stream");
assert.equal(elements.get("#cameraBackdrop").classList.contains("active"), false, "recorded playback is not competing with a live preview backdrop");
assert.equal(lastUpload.url, "/recordings", "recording is uploaded to the project server");
assert.match(lastUpload.options.headers["Content-Type"], /^video\/mp4/, "MP4 recordings upload with an MP4 content type");
assert.equal(elements.get("#downloadRecording").download, "猜词派对.mp4", "download name uses the selected recording format");
await Promise.resolve();
await Promise.resolve();
assert.equal(elements.get("#savedRecordingPath").textContent, "recordings/test-round.mp4", "saved path is shown");

const playback = elements.get("#recordingPlayback");
playback.paused = false;
playback.currentTime = 12;
await elements.get("#againButton").click();
await Promise.resolve();
await Promise.resolve();
assert.equal(playback.paused, true, "returning to setup stops recording playback");
assert.equal(playback.currentTime, 0, "returning to setup rewinds recording playback");
assert.equal(elements.get("#cameraButton").getAttribute("aria-checked"), "true", "recording stays enabled for the next round");
assert.equal(elements.get("#cameraBackdrop").classList.contains("active"), true, "returning to setup restores the preview for the next recorded round");

lastMediaRequest = null;
lastRecorder = null;
lastRecorderOptions = null;
lastUpload = null;
await elements.get("#cameraButton").click();
assert.equal(elements.get("#recordStatus").textContent, "OFF", "recording toggle shows the disabled state");
assert.equal(elements.get("#cameraButton").getAttribute("aria-checked"), "false", "recording toggle exposes its off state after disabling");
assert.ok(stoppedTracks > 0, "turning recording off stops the preview stream");
assert.equal(elements.get("#cameraBackdrop").classList.contains("active"), false, "turning recording off hides the fullscreen preview backdrop");

assert.equal(await press(" "), true, "Space starts a no-recording round");
assert.equal(lastMediaRequest, null, "disabled recording does not request camera permission on start");
assert.equal(lastRecorder, null, "disabled recording does not create a recorder");
assert.equal(elements.get("#countdownNumber").textContent, "3", "no-recording round still starts with countdown");
await finishCountdown();
assert.equal(elements.get("#recordStatus").textContent, "未录制", "disabled recording shows no recording status");
assert.equal(await press("Escape"), true, "Escape stops the no-recording round");
assert.equal(lastUpload, null, "disabled recording does not upload anything");

await elements.get("#cameraButton").click();
const stoppedBeforeRestart = stoppedTracks;
elements.get("#refreshButton").click();
assert.equal(elements.get("#cameraBackdrop").classList.contains("active"), false, "restarting the app releases the preview backdrop");
assert.ok(stoppedTracks > stoppedBeforeRestart, "restarting the app stops the camera stream first");
assert.match(locationReplaceTarget, /^https:\/\/guess-word-party\.test\/\?restart=\d+$/, "restart button reloads the standalone app with a fresh URL");

console.log("keyboard shortcuts passed");
