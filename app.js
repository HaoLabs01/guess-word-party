const wordGroups = [
  {
    name: "成语",
    words: [
      "画蛇添足",
      "守株待兔",
      "掩耳盗铃",
      "亡羊补牢",
      "杯弓蛇影",
      "狐假虎威",
      "刻舟求剑",
      "拔苗助长",
      "叶公好龙",
      "井底之蛙",
      "滥竽充数",
      "买椟还珠",
      "对牛弹琴",
      "盲人摸象",
      "惊弓之鸟",
      "草船借箭",
      "悬梁刺股",
      "三顾茅庐",
      "纸上谈兵",
      "破釜沉舟",
      "指鹿为马",
      "闻鸡起舞",
      "愚公移山",
      "自相矛盾",
      "胸有成竹",
      "卧薪尝胆",
      "完璧归赵",
      "负荆请罪",
    ],
  },
  {
    name: "美食",
    words: [
      "火锅",
      "奶茶",
      "麻辣烫",
      "烤冷面",
      "羊肉串",
      "蛋炒饭",
      "烧烤",
      "饺子",
      "雪糕",
      "月饼",
      "小笼包",
      "臭豆腐",
      "糖葫芦",
      "煎饼果子",
      "螺蛳粉",
      "肉夹馍",
      "酸辣粉",
      "北京烤鸭",
      "佛跳墙",
      "东坡肉",
      "锅包肉",
      "凉皮",
      "豆腐脑",
      "烤红薯",
      "炸酱面",
      "肠粉",
      "双皮奶",
      "酸菜鱼",
    ],
  },
  {
    name: "地名",
    words: [
      "山海关",
      "故宫",
      "兵马俑",
      "长城",
      "西湖",
      "黄山",
      "泰山",
      "九寨沟",
      "张家界",
      "布达拉宫",
      "东方明珠",
      "外滩",
      "鼓浪屿",
      "都江堰",
      "秦淮河",
      "夫子庙",
      "大雁塔",
      "丽江古城",
      "乌镇",
      "少林寺",
      "天安门",
      "颐和园",
      "峨眉山",
      "莫高窟",
      "橘子洲",
      "洱海",
      "洪崖洞",
      "宽窄巷子",
    ],
  },
  {
    name: "影视",
    words: [
      "孙悟空",
      "葫芦娃",
      "哪吒",
      "喜羊羊",
      "灰太狼",
      "白娘子",
      "蜘蛛侠",
      "钢铁侠",
      "哈利波特",
      "功夫熊猫",
      "流浪地球",
      "大话西游",
      "甄嬛传",
      "还珠格格",
      "变形金刚",
      "小黄人",
      "冰雪奇缘",
      "猫和老鼠",
      "熊出没",
      "奥特曼",
      "柯南",
      "哆啦A梦",
      "龙猫",
      "千与千寻",
      "疯狂动物城",
      "加勒比海盗",
      "速度与激情",
      "泰坦尼克号",
    ],
  },
  {
    name: "动物",
    words: [
      "熊猫",
      "金丝猴",
      "长颈鹿",
      "袋鼠",
      "企鹅",
      "海豚",
      "老虎",
      "狮子",
      "斑马",
      "骆驼",
      "考拉",
      "孔雀",
      "章鱼",
      "鲸鱼",
      "刺猬",
      "松鼠",
      "猫头鹰",
      "金鱼",
      "乌龟",
      "大象",
      "狐狸",
      "河马",
      "鸵鸟",
      "北极熊",
      "梅花鹿",
      "变色龙",
      "火烈鸟",
      "啄木鸟",
    ],
  },
  {
    name: "日常",
    words: [
      "外卖",
      "高铁",
      "红包",
      "广场舞",
      "自拍杆",
      "二维码",
      "电影院",
      "洗衣机",
      "电梯",
      "便利店",
      "快递",
      "闹钟",
      "图书馆",
      "口红",
      "咖啡",
      "篮球",
      "雨伞",
      "充电宝",
      "行李箱",
      "遥控器",
      "蓝牙耳机",
      "公交卡",
      "电饭煲",
      "空气炸锅",
      "榨汁机",
      "电动牙刷",
      "保温杯",
      "瑜伽垫",
    ],
  },
  {
    name: "运动",
    words: [
      "马拉松",
      "滑雪",
      "潜水",
      "龙舟",
      "跳绳",
      "羽毛球",
      "乒乓球",
      "足球",
      "排球",
      "游泳",
      "攀岩",
      "射箭",
      "拳击",
      "瑜伽",
      "冲浪",
      "骑行",
      "滑板",
      "跳高",
      "跳远",
      "举重",
      "体操",
      "击剑",
      "赛龙舟",
      "拔河",
      "旱冰",
      "保龄球",
      "太极拳",
      "飞盘",
    ],
  },
];

if (window.WORD_GROUPS?.length) {
  wordGroups.splice(0, wordGroups.length, ...window.WORD_GROUPS);
}

const roundSeconds = 180;
const tiltThreshold = 46;
const neutralThreshold = 24;
const actionCooldown = 850;
const keyboardActionCooldown = 160;

const state = {
  groupIndex: 0,
  deck: [],
  wordIndex: 0,
  score: 0,
  streak: 0,
  durationSeconds: 180,
  secondsLeft: roundSeconds,
  running: false,
  armed: true,
  lastActionAt: 0,
  timerId: null,
  mediaStream: null,
  mediaRecorder: null,
  recordedChunks: [],
  recordingUrl: null,
};

const els = {
  setupScreen: document.querySelector("#setupScreen"),
  gameScreen: document.querySelector("#gameScreen"),
  setupStartButton: document.querySelector("#setupStartButton"),
  durationButtons: document.querySelector("#durationButtons"),
  recordingsList: document.querySelector("#recordingsList"),
  recordingsStatus: document.querySelector("#recordingsStatus"),
  score: document.querySelector("#score"),
  streak: document.querySelector("#streak"),
  timer: document.querySelector("#timer"),
  timerRing: document.querySelector("#timerRing"),
  word: document.querySelector("#word"),
  wordCard: document.querySelector("#wordCard"),
  statusChip: document.querySelector("#statusChip"),
  categoryName: document.querySelector("#categoryName"),
  categorySelect: document.querySelector("#categorySelect"),
  cameraPreview: document.querySelector("#cameraPreview"),
  cameraButton: document.querySelector("#cameraButton"),
  recordStatus: document.querySelector("#recordStatus"),
  recordingPlayback: document.querySelector("#recordingPlayback"),
  downloadRecording: document.querySelector("#downloadRecording"),
  savedRecordingPath: document.querySelector("#savedRecordingPath"),
  resultPanel: document.querySelector("#resultPanel"),
  finalScore: document.querySelector("#finalScore"),
  startButton: document.querySelector("#startButton"),
  correctButton: document.querySelector("#correctButton"),
  skipButton: document.querySelector("#skipButton"),
  againButton: document.querySelector("#againButton"),
  resetButton: document.querySelector("#resetButton"),
  wordsButton: document.querySelector("#wordsButton"),
};

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function currentGroup() {
  return wordGroups[state.groupIndex];
}

function populateCategorySelect() {
  els.categorySelect.innerHTML = "";
  wordGroups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = group.name;
    els.categorySelect.appendChild(option);
  });
}

function showSetupScreen() {
  state.running = false;
  window.clearInterval(state.timerId);
  stopRecordingPlayback();
  els.setupScreen.classList.remove("hidden");
  els.gameScreen.classList.add("hidden");
  els.resultPanel.classList.add("hidden");
  setStatus("准备", null);
  loadRecordings();
  render();
}

function showGameScreen() {
  els.setupScreen.classList.add("hidden");
  els.gameScreen.classList.remove("hidden");
  els.resultPanel.classList.add("hidden");
}

function setDuration(seconds) {
  if (state.running) return;
  if (![60, 180, 300].includes(seconds)) return;

  state.durationSeconds = seconds;
  state.secondsLeft = seconds;

  for (const button of document.querySelectorAll?.(".time-button") ?? []) {
    button.classList.toggle("selected", Number(button.dataset.duration) === seconds);
  }

  render();
}

function selectWordGroup(index, showFeedback = true) {
  if (state.running) {
    setStatus("本局中", null);
    return;
  }

  const nextIndex = Number(index);
  if (!Number.isInteger(nextIndex) || !wordGroups[nextIndex]) return;

  state.groupIndex = nextIndex;
  resetDeck();
  if (showFeedback) {
    setStatus(currentGroup().name, null);
  }
  render();
}

function resetDeck() {
  state.deck = shuffle(currentGroup().words);
  state.wordIndex = 0;
  els.word.textContent = state.deck[state.wordIndex];
}

function render() {
  els.score.textContent = state.score;
  els.streak.textContent = state.streak;
  els.timer.textContent = state.secondsLeft;
  els.timerRing.style.setProperty("--progress", `${(state.secondsLeft / state.durationSeconds) * 100}%`);
  els.categoryName.textContent = currentGroup().name;
  els.categorySelect.value = String(state.groupIndex);
  els.categorySelect.disabled = state.running;
  els.wordsButton.disabled = state.running;
  els.resetButton.setAttribute("aria-label", state.running ? "停止本局" : "重新开始");
  els.startButton.textContent = state.running ? "进行中" : "开始";
  els.startButton.disabled = state.running;
}

function setStatus(text, kind) {
  els.statusChip.textContent = text;
  els.wordCard.classList.remove("correct", "skip");
  if (kind) {
    els.wordCard.classList.add(kind);
    window.setTimeout(() => els.wordCard.classList.remove(kind), 240);
  }
}

function nextWord() {
  state.wordIndex += 1;
  if (state.wordIndex >= state.deck.length) {
    state.deck = shuffle(currentGroup().words);
    state.wordIndex = 0;
  }
  els.word.textContent = state.deck[state.wordIndex];
}

async function requestMotionPermission() {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    try {
      await DeviceOrientationEvent.requestPermission();
    } catch {
      setStatus("可用按钮", null);
    }
  }
}

function setRecordingStatus(text) {
  els.recordStatus.textContent = text;
}

function stopRecordingPlayback() {
  els.recordingPlayback.pause?.();
  els.recordingPlayback.currentTime = 0;
}

function clearRecordingUrl() {
  stopRecordingPlayback();
  if (state.recordingUrl) {
    URL.revokeObjectURL(state.recordingUrl);
    state.recordingUrl = null;
  }

  els.recordingPlayback.removeAttribute("src");
  els.recordingPlayback.classList.add("hidden");
  els.downloadRecording.href = "#";
  els.downloadRecording.classList.add("hidden");
  els.savedRecordingPath.textContent = "";
}

async function requestCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setRecordingStatus("不支持");
    return null;
  }

  if (state.mediaStream) {
    return state.mediaStream;
  }

  try {
    state.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: true,
    });
    els.cameraPreview.srcObject = state.mediaStream;
    setRecordingStatus("已开启");
    return state.mediaStream;
  } catch {
    setRecordingStatus("未授权");
    return null;
  }
}

async function uploadRecording(blob) {
  try {
    const response = await fetch("/recordings", {
      method: "POST",
      headers: { "Content-Type": "video/webm" },
      body: blob,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const result = await response.json();
    if (result.path) {
      els.savedRecordingPath.textContent = result.path;
      loadRecordings();
    }
  } catch {
    els.savedRecordingPath.textContent = "未连接本地保存服务，可手动下载";
  }
}

function renderRecordings(recordings) {
  els.recordingsList.innerHTML = "";

  if (!recordings.length) {
    els.recordingsStatus.textContent = "暂无录像";
    return;
  }

  els.recordingsStatus.textContent = `${recordings.length} 个`;
  recordings.forEach((recording) => {
    const link = document.createElement("a");
    link.href = recording.url;
    link.textContent = recording.name;
    link.target = "_blank";
    link.rel = "noreferrer";
    els.recordingsList.appendChild(link);
  });
}

async function loadRecordings() {
  try {
    els.recordingsStatus.textContent = "读取中";
    const response = await fetch("/recordings");
    if (!response.ok) {
      throw new Error("Cannot load recordings");
    }
    const result = await response.json();
    renderRecordings(Array.isArray(result) ? result : result.recordings ?? []);
  } catch {
    els.recordingsStatus.textContent = "未连接";
    els.recordingsList.innerHTML = "";
  }
}

function publishRecording() {
  if (!state.recordedChunks.length) {
    setRecordingStatus("未录制");
    return;
  }

  const blob = new Blob(state.recordedChunks, { type: "video/webm" });
  clearRecordingUrl();
  state.recordingUrl = URL.createObjectURL(blob);
  els.recordingPlayback.src = state.recordingUrl;
  els.recordingPlayback.classList.remove("hidden");
  els.downloadRecording.href = state.recordingUrl;
  els.downloadRecording.classList.remove("hidden");
  setRecordingStatus("已保存");
  uploadRecording(blob);
}

async function startRecording() {
  clearRecordingUrl();
  state.recordedChunks = [];

  const stream = await requestCamera();
  if (!stream) return;

  if (typeof MediaRecorder === "undefined") {
    setRecordingStatus("不支持");
    return;
  }

  state.mediaRecorder = new MediaRecorder(stream);
  state.mediaRecorder.ondataavailable = (event) => {
    if (event.data?.size > 0) {
      state.recordedChunks.push(event.data);
    }
  };
  state.mediaRecorder.onstop = publishRecording;
  state.mediaRecorder.start();
  setRecordingStatus("录制中");
}

function stopRecording() {
  if (state.mediaRecorder?.state === "recording") {
    state.mediaRecorder.stop();
  }
}

async function startRound() {
  requestMotionPermission();
  window.clearInterval(state.timerId);
  state.score = 0;
  state.streak = 0;
  state.secondsLeft = state.durationSeconds;
  state.running = true;
  state.armed = true;
  state.lastActionAt = 0;
  showGameScreen();
  resetDeck();
  await startRecording();
  setStatus("开始", null);
  render();

  state.timerId = window.setInterval(() => {
    state.secondsLeft -= 1;
    render();
    if (state.secondsLeft <= 0) {
      finishRound();
    }
  }, 1000);
}

function finishRound(statusText = "结束") {
  window.clearInterval(state.timerId);
  state.running = false;
  state.secondsLeft = 0;
  stopRecording();
  els.finalScore.textContent = state.score;
  els.resultPanel.classList.remove("hidden");
  setStatus(statusText, null);
  render();
}

function stopRound() {
  if (!state.running) return;
  finishRound("停止");
}

function registerAction(type, cooldown = actionCooldown) {
  if (!state.running) return;

  const now = Date.now();
  if (now - state.lastActionAt < cooldown) return;
  state.lastActionAt = now;

  if (type === "correct") {
    state.score += 1;
    state.streak += 1;
    setStatus("+1", "correct");
  } else {
    state.streak = 0;
    setStatus("跳过", "skip");
  }

  nextWord();
  render();
}

function handleOrientation(event) {
  if (!state.running || typeof event.beta !== "number") return;

  const beta = event.beta;
  if (Math.abs(beta) < neutralThreshold) {
    state.armed = true;
    return;
  }

  if (!state.armed) return;

  if (beta > tiltThreshold) {
    state.armed = false;
    registerAction("correct");
  }

  if (beta < -tiltThreshold) {
    state.armed = false;
    registerAction("skip");
  }
}

async function handleKeyboard(event) {
  const key = event.key === " " ? "space" : event.key.toLowerCase();
  if (key === "space") {
    event.preventDefault();
    if (!state.running) {
      await startRound();
    }
    return;
  }

  if (key === "escape") {
    event.preventDefault();
    stopRound();
    return;
  }

  const isCorrect = key === "arrowdown";
  const isSkip = key === "arrowup";

  if (!isCorrect && !isSkip) return;
  if (!state.running) return;

  event.preventDefault();
  registerAction(isCorrect ? "correct" : "skip", keyboardActionCooldown);
}

function switchWordGroup() {
  selectWordGroup((state.groupIndex + 1) % wordGroups.length);
}

els.categorySelect.addEventListener("change", () => selectWordGroup(els.categorySelect.value));
els.durationButtons.addEventListener("click", (event) => {
  const seconds = Number(event.target?.dataset?.duration);
  setDuration(seconds);
});
els.cameraButton.addEventListener("click", requestCamera);
els.setupStartButton.addEventListener("click", () => startRound());
els.againButton.addEventListener("click", showSetupScreen);
els.correctButton.addEventListener("click", () => registerAction("correct"));
els.skipButton.addEventListener("click", () => registerAction("skip"));
els.resetButton.addEventListener("click", () => {
  if (state.running) {
    stopRound();
  } else {
    startRound();
  }
});
els.wordsButton.addEventListener("click", switchWordGroup);
window.addEventListener("deviceorientation", handleOrientation);
window.addEventListener("keydown", handleKeyboard);

populateCategorySelect();
resetDeck();
setDuration(state.durationSeconds);
showSetupScreen();
render();
