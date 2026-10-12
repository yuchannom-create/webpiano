const audioContext = new (window.AudioContext || window.webkitAudioContext)();


const volumeSlider = document.getElementById("volume");
const volumeValue = document.getElementById("volume-value");

// 0〜100の値を0〜1の音量に変換
function getVolume() {
    return Number(volumeSlider.value) / 100;
}


volumeSlider.addEventListener("input", () => {
    volumeValue.textContent = `${volumeSlider.value}%`;

    // 今鳴っている音にも音量変更を反映
    Object.values(activeNotes).forEach(({ gainNode }) => {
        gainNode.gain.setTargetAtTime(
            getVolume(),
            audioContext.currentTime,
            0.02
        );
    });
});



const frequencies = {
    C4: 130.815,
    "C#4": 138.59,
    D4: 146.83,
    "D#4": 155.565,
    E4: 164.815,
    F4: 174.615,
    "F#4": 184.995,
    G4: 196.00,
    "G#4": 207.65,
    A4: 220.00,
    "A#4": 233.08,
    B4: 246.94,

    C5: 261.625,
    "C#5": 277.185,
    D5: 293.665,
    "D#5": 311.125,
    E5: 329.625,
    F5: 349.23,
    "F#5": 369.995,
    G5: 391.995,
    "G#5": 415.305,
    A5: 440.00,
    "A#5": 466.165,
    B5: 493.885,

    C6: 523.25,
    "C#6": 554.365,
    D6: 587.33,
    "D#6": 622.255,
    E6: 659.255,
    F6: 698.455
};



const activeNotes = {};
const activePointers = {};
const keys = document.querySelectorAll(".key");


// ====================
// 音を鳴らす
// ====================

function startNote(note) {

    if (activeNotes[note]) return;

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = frequencies[note];

    gainNode.gain.setValueAtTime(getVolume(), audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    activeNotes[note] = {
        oscillator: oscillator,
        gainNode: gainNode
    };
}


// ====================
// 音を止める
// ====================

function stopNote(note) {

    const activeNote = activeNotes[note];

    if (!activeNote) return;

    const currentTime = audioContext.currentTime;

    activeNote.gainNode.gain.cancelScheduledValues(currentTime);

    activeNote.gainNode.gain.setValueAtTime(
        activeNote.gainNode.gain.value,
        currentTime
    );

    activeNote.gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        currentTime + 0.1
    );

    activeNote.oscillator.stop(currentTime + 0.1);

    delete activeNotes[note];
}


// ====================
// 見た目
// ====================

function pressKey(key) {
    key.classList.add("pressed");
}

function releaseKey(key) {
    key.classList.remove("pressed");
}


// ====================
// 新しい鍵盤に移動
// ====================

function enterKey(key, pointerId) {

    const newNote = key.dataset.note;

    // 同じ鍵盤なら何もしない
    if (activePointers[pointerId]?.key === key) {
        return;
    }

    // 前の鍵盤を解除
    if (activePointers[pointerId]) {

        const oldKey = activePointers[pointerId].key;
        const oldNote = activePointers[pointerId].note;

        stopNote(oldNote);
        releaseKey(oldKey);
    }

    // 新しい鍵盤を記録
    activePointers[pointerId] = {
        key: key,
        note: newNote
    };

    // 新しい鍵盤を押した見た目にする
    pressKey(key);

    // 新しい音を鳴らす
    startNote(newNote);
}


// ====================
// 鍵盤を押した
// ====================

keys.forEach(key => {

    key.addEventListener("pointerdown", (event) => {

        event.preventDefault();

        enterKey(key, event.pointerId);
    });

});


// ====================
// 指を動かした
// ====================

document.addEventListener("pointermove", (event) => {

    const pointerId = event.pointerId;

    // 現在の指の位置にある要素を取得
    const element = document.elementFromPoint(
        event.clientX,
        event.clientY
    );

    if (!element) return;

    // 鍵盤かどうか確認
    const newKey = element.closest(".key");

    // 鍵盤の外なら何もしない
    if (!newKey) return;

    // 別の鍵盤に移動したら切り替える
    if (
        newKey !== activePointers[pointerId]?.key
    ) {
        enterKey(newKey, pointerId);
    }
});


// ====================
// ★ 指を離した
// ====================

document.addEventListener("pointerup", (event) => {

    const pointerId = event.pointerId;

    const active = activePointers[pointerId];

    if (!active) return;

    // 音を止める
    stopNote(active.note);

    // 鍵盤の見た目を元に戻す
    releaseKey(active.key);

    // 記録を削除
    delete activePointers[pointerId];
});


// ====================
// 指がキャンセルされた
// ====================

document.addEventListener("pointercancel", (event) => {

    const pointerId = event.pointerId;

    const active = activePointers[pointerId];

    if (!active) return;

    stopNote(active.note);
    releaseKey(active.key);

    delete activePointers[pointerId];
});

// ====================
// iPhoneの長押しルーペを無効化
// ====================

const piano = document.querySelector(".piano");

piano.addEventListener(
    "touchstart",
    (event) => {
        event.preventDefault();
    },
    { passive: false }
);

// iPhoneの長押しメニューを無効化
document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
});

// テキスト選択を無効化
document.addEventListener("selectstart", (event) => {
    event.preventDefault();
});

