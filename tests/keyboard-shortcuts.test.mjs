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
    this.options = [];
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
    this.options.push(child);
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
}

const elements = new Map();
const selectors = [
  "#setupScreen",
  "#gameScreen",
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
  "#categorySelect",
  "#cameraPreview",
  "#cameraButton",
  "#recordStatus",
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
    lastRecorderOptions = options;
    lastRecorder = this;
  }

  start() {
    this.state = "recording";
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
    clearInterval: () => {},
    setInterval: () => 1,
    setTimeout: (handler) => {
      handler();
      return 1;
    },
  },
  Date: {
    now: () => now,
  },
};

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const wordsSource = fs.readFileSync(new URL("../words.js", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");

assert.match(html, /src="\.\/words\.js"/, "loads the external word bank before the app");
assert.match(html, /id="setupScreen"/, "renders a setup screen before the game");
assert.match(html, /id="gameScreen"/, "renders a separate game screen");
assert.match(html, /id="setupStartButton"/, "renders the setup start button");
assert.match(html, /data-duration="60"/, "lets the user choose 60 seconds");
assert.match(html, /data-duration="180"/, "lets the user choose 180 seconds");
assert.match(html, /data-duration="300"/, "lets the user choose 300 seconds");
assert.match(html, /id="recordingsList"/, "renders saved recordings list");
assert.match(html, /点头\s*↓/, "correct action is labeled as nod down plus down arrow");
assert.match(html, /抬头\s*↑/, "skip action is labeled as lift head plus up arrow");
assert.match(html, /id="categoryName"/, "shows the current word category");
assert.match(html, /id="categorySelect"/, "renders a visible category selector");
assert.match(html, /id="cameraPreview"/, "renders the front camera preview");
assert.match(html, /id="cameraButton"/, "renders a camera permission button");
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
assert.ok(elements.get("#categorySelect").options.length >= 6, "category selector lists the word groups");
elements.get("#categorySelect").value = "1";
elements.get("#categorySelect").dispatchEvent({ type: "change" });
assert.equal(elements.get("#categoryName").textContent, "美食", "changing the selector changes the category");
assert.equal(elements.get("#statusChip").textContent, "美食", "changing the selector gives visible feedback");
assert.equal(typeof windowListeners.keydown, "function", "registers a keydown listener");
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
assert.equal(lastRecorder, null, "recording toggle does not start recording before the round");
assert.ok(elements.get("#cameraPreview").srcObject, "recording toggle shows the authorized preview stream");
assert.equal(elements.get("#recordStatus").textContent, "ON", "recording toggle shows the enabled state");
assert.equal(elements.get("#cameraButton").getAttribute("aria-checked"), "true", "recording toggle exposes its on state");

assert.equal(await press(" "), true, "Space starts the game");
assert.equal(elements.get("#startButton").disabled, true, "game is running after Space");
assert.equal(elements.get("#setupScreen").classList.contains("hidden"), true, "setup screen hides after starting");
assert.equal(elements.get("#gameScreen").classList.contains("hidden"), false, "game screen appears after starting");
assert.equal(elements.get("#timer").textContent, 300, "selected duration is used for the round");
assert.equal(elements.get("#statusChip").textContent, "开始", "Space shows start feedback");
assert.equal(lastMediaRequest.audio, true, "Space requests microphone audio");
assert.equal(lastMediaRequest.video.facingMode, "user", "Space requests the front camera");
assert.equal(mediaRequestCount, 1, "starting the round reuses the one recording permission");
assert.equal(lastRecorder.state, "recording", "recording starts with the round");
assert.match(lastRecorderOptions.mimeType, /^video\/mp4/, "recording prefers an iPhone-playable MP4 format");
assert.equal(elements.get("#recordStatus").textContent, "录制中", "recording status is visible");

windowListeners.deviceorientation?.({ beta: 90 });
windowListeners.deviceorientation?.({ beta: 118 });
assert.equal(elements.get("#score").textContent, 1, "nodding down from the forehead baseline marks a correct guess");
assert.equal(elements.get("#streak").textContent, 1, "nodding down from the forehead baseline increments the streak");
assert.equal(elements.get("#statusChip").textContent, "+1", "nodding down from the forehead baseline shows correct feedback");
now += 1_000;
windowListeners.deviceorientation?.({ beta: 90 });

windowListeners.deviceorientation?.({ beta: 62 });
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

assert.equal(await press("Escape"), true, "Escape stops the round");
assert.equal(elements.get("#startButton").disabled, false, "game is no longer running after Escape");
assert.equal(elements.get("#resultPanel").classList.contains("hidden"), false, "stopping shows the result panel");
assert.equal(lastRecorder.state, "inactive", "recording stops with the round");
assert.equal(lastUpload.url, "/recordings", "recording is uploaded to the project server");
assert.match(lastUpload.options.headers["Content-Type"], /^video\/mp4/, "MP4 recordings upload with an MP4 content type");
assert.equal(elements.get("#downloadRecording").download, "猜词派对.mp4", "download name uses the selected recording format");
await Promise.resolve();
await Promise.resolve();
assert.equal(elements.get("#savedRecordingPath").textContent, "recordings/test-round.mp4", "saved path is shown");

const playback = elements.get("#recordingPlayback");
playback.paused = false;
playback.currentTime = 12;
elements.get("#againButton").click();
assert.equal(playback.paused, true, "returning to setup stops recording playback");
assert.equal(playback.currentTime, 0, "returning to setup rewinds recording playback");
assert.equal(elements.get("#cameraButton").getAttribute("aria-checked"), "true", "recording stays enabled for the next round");

lastMediaRequest = null;
lastRecorder = null;
lastRecorderOptions = null;
lastUpload = null;
await elements.get("#cameraButton").click();
assert.equal(elements.get("#recordStatus").textContent, "OFF", "recording toggle shows the disabled state");
assert.equal(elements.get("#cameraButton").getAttribute("aria-checked"), "false", "recording toggle exposes its off state after disabling");
assert.ok(stoppedTracks > 0, "turning recording off stops the preview stream");

assert.equal(await press(" "), true, "Space starts a no-recording round");
assert.equal(lastMediaRequest, null, "disabled recording does not request camera permission on start");
assert.equal(lastRecorder, null, "disabled recording does not create a recorder");
assert.equal(elements.get("#recordStatus").textContent, "未录制", "disabled recording shows no recording status");
assert.equal(await press("Escape"), true, "Escape stops the no-recording round");
assert.equal(lastUpload, null, "disabled recording does not upload anything");

console.log("keyboard shortcuts passed");
