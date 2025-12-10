// 1. 문장 반복 (3회)
const text = "두려움은 희망 없이 있을 수 없고 희망은 두려움 없이 있을 수 없다".repeat(3);

// === [NEW] 사운드 엔진 (Web Audio API) ===
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// 브라우저 정책상 사용자 인터랙션(클릭 등) 이후에만 오디오가 활성화됨
// 마우스가 처음 움직일 때 오디오 컨텍스트를 켭니다.
function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// 소리 합성 함수
function playSynthSound(type, xPosition) {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const panner = audioCtx.createStereoPanner();

    // 1. 소리 성향 설정 (Type에 따른 파형 및 주파수)
    let freq = 440; // 기본 라(A)

    if (type === 'pos') {
        // 양성 모음: 맑고 높은 소리 (Sine Wave)
        osc.type = 'sine';
        // 랜덤하게 화음을 쌓음 (C Major Scale: 도, 미, 솔, 높은도)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        freq = notes[Math.floor(Math.random() * notes.length)];

    } else if (type === 'neg') {
        // 음성 모음: 낮고 깊은 소리 (Triangle Wave)
        osc.type = 'triangle';
        // 낮은 화음 (C Major Low)
        const notes = [130.81, 164.81, 196.00, 261.63];
        freq = notes[Math.floor(Math.random() * notes.length)];

    } else {
        // 중성 모음: 중간 소리
        osc.type = 'sine';
        freq = 329.63; // 미(E)
    }

    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // 2. 스테레오 패닝 (마우스 위치에 따라 좌우 소리 조절)
    // xPosition: 0(왼쪽) ~ 1(오른쪽) -> Panner: -1(왼쪽) ~ 1(오른쪽)
    const panValue = (xPosition * 2) - 1;
    panner.pan.value = panValue;

    // 3. 볼륨 엔벨롭 (ADSR: 부드럽게 켜졌다가 사라짐)
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    // Attack: 0.05초 만에 볼륨 0.2까지 상승
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
    // Decay: 0.3초 뒤에 볼륨 0으로 하강
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    // 4. 연결 및 재생
    osc.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3); // 0.3초 뒤 소멸
}
// ==========================================


// 모음 분류
const VOWEL_TYPES = {
    POS: ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ'],
    NEG: ['ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ'],
    NEU: ['ㅡ', 'ㅢ', 'ㅣ']
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

    // === [이벤트] 마우스 오버 시 합성음 재생 ===
    if (item.type !== 's') {
        inner.addEventListener('mouseenter', (e) => {
            // 오디오 컨텍스트가 없으면 초기화
            initAudio();

            // 현재 마우스의 가로 비율 계산 (0~1)
            const ratio = e.clientX / window.innerWidth;

            // 소리 재생 (타입과 위치 전달)
            playSynthSound(item.type, ratio);
        });
    }
    // ========================================

    wrapper.appendChild(inner);
    stage.appendChild(wrapper);
    item.el = wrapper;
});

// --- 렌더링 로직 ---
function render(ratio) {
    const negSpace = 3.0 - (ratio * 2.0);
    const posSpace = 1.0 + (ratio * 4.5);
    const neuSpace = 1.0;
    const sSpace = 0.5;

    let totalFactor = 0;
    charsData.forEach(item => {
        if (item.type === 'neg') totalFactor += negSpace;
        else if (item.type === 'pos') totalFactor += posSpace;
        else if (item.type === 'neu') totalFactor += neuSpace;
        else totalFactor += sSpace;
    });

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

    const root = document.documentElement;

    // 음성 모음 (Negative)
    root.style.setProperty('--neg-weight', 900 - (ratio * 600));
    root.style.setProperty('--neg-scale', 3.0 - (ratio * 1.8));
    root.style.setProperty('--neg-blur', (6 - (ratio * 6)) + 'px');

    // 양성 모음 (Positive)
    root.style.setProperty('--pos-weight', 300 + (ratio * 600));
    root.style.setProperty('--pos-scale', 1.2 + (ratio * 4.3));
    root.style.setProperty('--pos-blur', (ratio * 6) + 'px');

    // 중성 모음 (Neutral)
    root.style.setProperty('--neu-weight', 600);
    root.style.setProperty('--neu-scale', 1.8);
}

render(0.5);

// 최초 사용자 반응 시 오디오 초기화
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('mousemove', (e) => {
    initAudio(); // 마우스 움직임으로도 오디오 활성화 시도
    const width = window.innerWidth;
    const ratio = e.clientX / width;
    requestAnimationFrame(() => render(ratio));
});
