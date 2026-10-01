const districtsByDivision = {
  "ঢাকা বিভাগ": ["ঢাকা", "ফরিদপুর", "গাজীপুর", "গোপালগঞ্জ", "কিশোরগঞ্জ", "মাদারীপুর", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "নারায়ণগঞ্জ", "নরসিংদী", "রাজবাড়ী", "শরীয়তপুর", "টাঙ্গাইল"],
  "চট্টগ্রাম বিভাগ": ["বান্দরবান", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "চট্টগ্রাম", "কুমিল্লা", "কক্সবাজার", "ফেনী", "খাগড়াছড়ি", "লক্ষ্মীপুর", "নোয়াখালী", "রাঙামাটি"],
  "রাজশাহী বিভাগ": ["বগুড়া", "জয়পুরহাট", "নওগাঁ", "নাটোর", "চাঁপাইনবাবগঞ্জ", "পাবনা", "রাজশাহী", "সিরাজগঞ্জ"],
  "খুলনা বিভাগ": ["বাগেরহাট", "চুয়াডাঙ্গা", "যশোর", "ঝিনাইদহ", "খুলনা", "কুষ্টিয়া", "মাগুরা", "মেহেরপুর", "নড়াইল", "সাতক্ষীরা"],
  "বরিশাল বিভাগ": ["বরগুনা", "বরিশাল", "ভোলা", "ঝালকাঠি", "পটুয়াখালী", "পিরোজপুর"],
  "সিলেট বিভাগ": ["হবিগঞ্জ", "মৌলভীবাজার", "সুনামগঞ্জ", "সিলেট"],
  "রংপুর বিভাগ": ["দিনাজপুর", "গাইবান্ধা", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারী", "পঞ্চগড়", "রংপুর", "ঠাকুরগাঁও"],
  "ময়মনসিংহ বিভাগ": ["জামালপুর", "ময়মনসিংহ", "নেত্রকোণা", "শেরপুর"]
};

const sourceText = document.querySelector("#sourceText");
const districtSelect = document.querySelector("#districtSelect");
const targetSelect = document.querySelector("#targetSelect");
const otherWrap = document.querySelector("#otherLanguageWrap");
const otherInput = document.querySelector("#otherLanguage");
const translateButton = document.querySelector("#translateButton");
const statusMessage = document.querySelector("#statusMessage");
const results = document.querySelector("#results");
let latestTranslation = null;
let recognition = null;
let isListening = false;
let voiceBaseText = "";
let voiceFinalText = "";
let voiceHadError = false;

districtSelect.add(new Option("অটো শনাক্ত করুন", "Auto-detect"));
for (const [division, districts] of Object.entries(districtsByDivision)) {
  const group = document.createElement("optgroup");
  group.label = division;
  districts.forEach(name => group.append(new Option(name, name)));
  districtSelect.append(group);
}

sourceText.addEventListener("input", () => {
  document.querySelector("#charCount").textContent = `${sourceText.value.length} / 5000`;
  if (statusMessage.textContent) statusMessage.textContent = "";
});
targetSelect.addEventListener("change", () => {
  otherWrap.classList.toggle("hidden", targetSelect.value !== "Other (type below)");
  if (targetSelect.value === "Other (type below)") otherInput.focus();
});
document.querySelector("#clearButton").addEventListener("click", () => {
  if (isListening) recognition?.stop();
  sourceText.value = "";
  sourceText.dispatchEvent(new Event("input"));
  latestTranslation = null;
  results.classList.add("hidden");
  statusMessage.textContent = "";
  sourceText.focus();
});
document.querySelectorAll(".example-chip").forEach(button => button.addEventListener("click", () => {
  if (isListening) recognition?.stop();
  sourceText.value = button.dataset.example;
  districtSelect.value = button.dataset.district || "Auto-detect";
  sourceText.dispatchEvent(new Event("input"));
  sourceText.focus();
  document.querySelector(".translator-card").scrollIntoView({ behavior: "smooth", block: "center" });
}));

translateButton.addEventListener("click", translate);
document.querySelector("#voiceButton").addEventListener("click", toggleVoice);
sourceText.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") translate();
});
document.querySelector("#copyButton").addEventListener("click", async event => {
  if (!latestTranslation) return;
  const copyButton = event.currentTarget;
  const t = latestTranslation;
  const targetName = targetSelect.value === "Other (type below)" ? otherInput.value.trim() : targetSelect.value;
  const lines = [
    `শনাক্ত কথ্যরীতি: ${t.dialect}`,
    `প্রমিত বাংলা: ${t.standard_bn}`,
    `English: ${t.english}`,
    `${targetName}: ${t.target_translation}`,
    "শব্দ ও বাক্যাংশ:",
    ...(t.vocabulary || []).map(v => `• ${v.regional} → ${v.standard} → ${v.english}`),
    `কথার সুর ও প্রসঙ্গ: ${t.cultural_note}`
  ].join("\n");
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(lines);
    } else if (!copyWithFallback(lines)) {
      throw new Error("Clipboard is unavailable.");
    }
    showCopySuccess(copyButton);
  } catch {
    if (copyWithFallback(lines)) {
      showCopySuccess(copyButton);
    } else {
      statusMessage.textContent = "কপি করা যায়নি—লেখা নির্বাচন করে কপি করুন।";
    }
  }
});

function showCopySuccess(button) {
  button.textContent = "✓ কপি হয়েছে";
  setTimeout(() => { button.innerHTML = '<span aria-hidden="true">▢</span> সব কপি'; }, 1500);
}

function toggleVoice() {
  if (isListening) {
    recognition?.stop();
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusMessage.textContent = "এই ব্রাউজারে voice input নেই। Chrome বা Edge-এর সর্বশেষ সংস্করণ ব্যবহার করুন।";
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "bn-BD";
  recognition.continuous = true;
  recognition.interimResults = true;
  voiceBaseText = sourceText.value.trim();
  voiceFinalText = "";
  voiceHadError = false;

  recognition.onstart = () => {
    isListening = true;
    setVoiceState(true);
    statusMessage.textContent = "শুনছি… কথা শেষ হলে ‘শোনা থামান’ চাপুন।";
  };
  recognition.onresult = event => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const spoken = event.results[i][0].transcript.trim();
      if (event.results[i].isFinal) voiceFinalText += `${spoken} `;
      else interim += `${spoken} `;
    }
    const spokenText = `${voiceFinalText}${interim}`.trim();
    sourceText.value = [voiceBaseText, spokenText].filter(Boolean).join(" ").slice(0, 5000);
    sourceText.dispatchEvent(new Event("input"));
  };
  recognition.onerror = event => {
    voiceHadError = true;
    const messages = {
      "not-allowed": "মাইক্রোফোন ব্যবহারের অনুমতি দিন, তারপর আবার চেষ্টা করুন।",
      "service-not-allowed": "ব্রাউজার voice recognition বন্ধ রেখেছে। Chrome বা Edge-এ আবার চেষ্টা করুন।",
      "no-speech": "কোনো কথা শোনা যায়নি। আবার মাইক্রোফোন চাপুন।",
      network: "Voice recognition-এর জন্য ইন্টারনেট সংযোগ দরকার।",
      aborted: "Voice input বন্ধ করা হয়েছে।"
    };
    statusMessage.textContent = messages[event.error] || `Voice input কাজ করেনি (${event.error})। আবার চেষ্টা করুন।`;
  };
  recognition.onend = () => {
    isListening = false;
    setVoiceState(false);
    if (!voiceHadError && voiceFinalText.trim()) {
      statusMessage.textContent = "কথা লেখা হয়েছে—চাইলে ঠিক করে ‘অনুবাদ করুন’ চাপুন।";
    } else if (!voiceHadError && !voiceFinalText.trim()) {
      statusMessage.textContent = "কোনো কথা লেখা হয়নি। আবার মাইক্রোফোন চাপুন।";
    }
  };
  try {
    recognition.start();
  } catch {
    statusMessage.textContent = "মাইক্রোফোন চালু করা যায়নি। পেজ reload করে আবার চেষ্টা করুন।";
  }
}

function setVoiceState(listening) {
  const button = document.querySelector("#voiceButton");
  button.classList.toggle("recording", listening);
  button.setAttribute("aria-pressed", String(listening));
  document.querySelector("#voiceButtonLabel").textContent = listening ? "শোনা থামান" : "কথা বলে লিখুন";
  document.querySelector("#voiceHint").textContent = listening ? "এখন আপনার কথা রেকর্ড হচ্ছে" : "মাইক্রোফোনে চাপ দিয়ে বাংলায় বলুন";
}

function copyWithFallback(text) {
  const temporary = document.createElement("textarea");
  temporary.value = text;
  temporary.setAttribute("readonly", "");
  temporary.style.position = "fixed";
  temporary.style.opacity = "0";
  document.body.append(temporary);
  temporary.select();
  const copied = document.execCommand("copy");
  temporary.remove();
  return copied;
}

async function translate() {
  const text = sourceText.value.trim();
  const targetLanguage = targetSelect.value === "Other (type below)" ? otherInput.value.trim() : targetSelect.value;
  if (!text) {
    statusMessage.textContent = "অনুবাদের জন্য আগে একটি বাক্য লিখুন।";
    sourceText.focus();
    return;
  }
  if (!targetLanguage) {
    statusMessage.textContent = "অন্য ভাষার নামটি লিখুন।";
    otherInput.focus();
    return;
  }
  statusMessage.textContent = "";
  setLoading(true);
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, district: districtSelect.value, targetLanguage })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "অনুবাদ করা যায়নি। আবার চেষ্টা করুন।");
    latestTranslation = data.translation;
    renderTranslation(data.translation, targetLanguage);
  } catch (error) {
    statusMessage.textContent = error.message || "সার্ভারের সঙ্গে যোগাযোগ করা যাচ্ছে না।";
  } finally {
    setLoading(false);
  }
}

function renderTranslation(t, targetLanguage) {
  document.querySelector("#dialectResult").textContent = t.dialect;
  document.querySelector("#standardResult").textContent = t.standard_bn;
  document.querySelector("#englishResult").textContent = t.english;
  document.querySelector("#targetLabel").textContent = targetLanguage;
  document.querySelector("#targetResult").textContent = t.target_translation;
  document.querySelector("#culturalResult").textContent = t.cultural_note || "বিশেষ কোনো সাংস্কৃতিক বা কথ্য ইঙ্গিত পাওয়া যায়নি।";
  const vocabulary = document.querySelector("#vocabularyResult");
  vocabulary.replaceChildren();
  if (!t.vocabulary?.length) {
    const empty = document.createElement("p");
    empty.className = "vocab-empty";
    empty.textContent = "আলাদা করে ব্যাখ্যা করার মতো শব্দ পাওয়া যায়নি।";
    vocabulary.append(empty);
  } else {
    for (const word of t.vocabulary) {
      const row = document.createElement("div");
      row.className = "vocab-row";
      [word.regional, word.standard, word.english].forEach(value => {
        const cell = document.createElement("span");
        cell.textContent = value;
        row.append(cell);
      });
      vocabulary.append(row);
    }
  }
  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setLoading(loading) {
  translateButton.disabled = loading;
  translateButton.querySelector("span:first-child").textContent = loading ? "অনুবাদ হচ্ছে…" : "অনুবাদ করুন";
  translateButton.querySelector(".arrow").textContent = loading ? "···" : "↗";
}
