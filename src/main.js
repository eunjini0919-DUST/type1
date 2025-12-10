// 1. 문장 반복 (3회)
const text = "두려움은 희망 없이 있을 수 없고 희망은 두려움 없이 있을 수 없다".repeat(3);

// === 사운드 엔진 (Web Audio API) ===
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSynthSound(type, xPosition) {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const panner = audioCtx.createStereoPanner();

    let freq = 440;

    if (type === 'pos') {
        osc.type = 'sine';
        const notes = [523.25, 659.25, 783.99, 1046.50];
        freq = notes[Math.floor(Math.random() * notes.length)];
    } else if (type === 'neg') {
        osc.type = 'triangle';
        const notes = [130.81, 164.81, 196.00, 261.63];
        freq = notes[Math.floor(Math.random() * notes.length)];
    } else {
        osc.type = 'sine';
        freq = 329.63;
    }

    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    const panValue = (xPosition * 2) - 1;
    panner.pan.value = panValue;

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    osc.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}
// ==========================================

// 모음 분류
const VOWEL_TYPES = {
    POS: ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ'], // 양성
    NEG: ['ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ'], // 음성
    NEU: ['ㅡ', 'ㅢ', 'ㅣ'] // 중성
};

function getVowelType(vowel) {
    if (VOWEL_TYPES.POS.includes(vowel)) return 'pos';
    if (VOWEL_TYPES.NEG.includes(vowel)) return 'neg';
    return 'neu';
}

function extractVowels(str) {
    const result = [];
    const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const code = char.charCodeAt(0);

        if (code >= 0xAC00 && code <= 0xD7A3) {
            const offset = code - 0xAC00;
            const jungIdx = Math.floor((offset / 28) % 21);
            const vowel = JUNG[jungIdx];

            result.push({
                t: vowel,
                type: getVowelType(vowel)
            });

        } else if (char === ' ') {
            result.push({ t: ' ', type: 's' });
        }
    }
    return result;
}

// 데이터 준비
const charsData = extractVowels(text);
const stage = document.querySelector('.stage');
const radius = Math.min(window.innerWidth, window.innerHeight) * 0.45;

// DOM 생성
charsData.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'char-wrapper';

    const inner = document.createElement('span');
    inner.className = `char-inner ${item.type}`;
    inner.textContent = item.t;

    if (item.type !== 's') {
        inner.addEventListener('mouseenter', (e) => {
            initAudio();
            const ratio = e.clientX / window.innerWidth;
            playSynthSound(item.type, ratio);
        });
    }

    wrapper.appendChild(inner);
    stage.appendChild(wrapper);
    item.el = wrapper;
});

// --- 렌더링 로직 ---
function render(ratio) {
    // ratio: 0(왼쪽) ~ 1(오른쪽)

    // 1. 공간 계수 (Space Factor)
    const negSpace = 3.0 - (ratio * 2.0); // 범위: 3.0 ~ 1.0

    // [수정] 양성 모음 최대 공간 확대: 5.5 -> 7.5에 맞춰 조정
    const posSpace = 1.0 + (ratio * 6.5); // 범위: 1.0 ~ 7.5

    const neuSpace = 1.0;
    const sSpace = 0.5;

    let totalFactor = 0;
    charsData.forEach(item => {
        if (item.type === 'neg') totalFactor += negSpace;
        else if (item.type === 'pos') totalFactor += posSpace;
        else if (item.type === 'neu') totalFactor += neuSpace;
        else totalFactor += sSpace;
    });

    // 배치 계산
    let currentAngle = -Math.PI / 2;

    charsData.forEach(item => {
        let myFactor = 1;
        if (item.type === 'neg') myFactor = negSpace;
        else if (item.type === 'pos') myFactor = posSpace;
        else if (item.type === 'neu') myFactor = neuSpace;
        else myFactor = sSpace;

        const myAngle = (myFactor / totalFactor) * (Math.PI * 2);
        const placeAngle = currentAngle + (myAngle / 2);

        const x = radius * Math.cos(placeAngle);
        const y = radius * Math.sin(placeAngle);
        const rotate = placeAngle + Math.PI / 2;

        item.el.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}rad)`;

        currentAngle += myAngle;
    });

    // [스타일 업데이트]
    const root = document.documentElement;

    // === 1. 음성 모음 (Negative) ===
    // 왼쪽(0)일 때 커짐
    root.style.setProperty('--neg-weight', 900 - (ratio * 600));
    root.style.setProperty('--neg-scale', 3.0 - (ratio * 1.8)); // Max 3.0 ~ Min 1.2

    // [수정] 블러 최소값 보장: 0px -> 2px (항상 연결감 유지)
    // 범위: 8px(Max) ~ 2px(Min)
    root.style.setProperty('--neg-blur', (8 - (ratio * 6)) + 'px');


    // === 2. 양성 모음 (Positive) ===
    // 오른쪽(1)일 때 커짐
    root.style.setProperty('--pos-weight', 300 + (ratio * 600));

    // [수정] 최대 스케일 대폭 확대: 5.5 -> 7.5
    // 범위: 1.2(Min) ~ 7.5(Max)
    root.style.setProperty('--pos-scale', 1.2 + (ratio * 6.3));

    // [수정] 블러 최소값 보장 및 최대값 상향
    // 범위: 2px(Min) ~ 10px(Max, 덩어리가 커진 만큼 블러도 강하게)
    root.style.setProperty('--pos-blur', (2 + (ratio * 8)) + 'px');


    // === 3. 중성 모음 (Neutral) ===
    root.style.setProperty('--neu-weight', 600);
    root.style.setProperty('--neu-scale', 1.8);
}

render(0.5);

document.addEventListener('click', initAudio, { once: true });
document.addEventListener('mousemove', (e) => {
    initAudio();
    const width = window.innerWidth;
    const ratio = e.clientX / width;
    requestAnimationFrame(() => render(ratio));
});