const text = "두려움은 희망 없이 있을 수 없고 희망은 두려움 없이 있을 수 없다";

function decomposeHangul(str) {
    const result = [];
    const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
    const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ls', 'lt', 'lp', 'rh', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const code = char.charCodeAt(0);

        if (code >= 0xAC00 && code <= 0xD7A3) {
            const offset = code - 0xAC00;
            const choIdx = Math.floor(offset / 28 / 21);
            const jungIdx = Math.floor((offset / 28) % 21);
            const jongIdx = offset % 28;

            result.push({ t: CHO[choIdx], type: 'c' });
            result.push({ t: JUNG[jungIdx], type: 'v' });
            if (jongIdx > 0) result.push({ t: JONG[jongIdx], type: 'c' });
        } else if (char === ' ') {
            result.push({ t: ' ', type: 's' });
        } else {
            result.push({ t: char, type: 'c' });
        }
    }
    return result;
}

const charsData = [...decomposeHangul(text), ...decomposeHangul(text)];

const stage = document.querySelector('.stage');
// [수정] 반지름을 화면의 46%까지 최대한 넓혀서 글자 사이 공간 확보
const radius = Math.min(window.innerWidth, window.innerHeight) * 0.46;

// DOM 생성
charsData.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'char-wrapper';

    const inner = document.createElement('span');
    inner.className = `char-inner ${item.type}`;
    inner.textContent = item.t;

    wrapper.appendChild(inner);
    stage.appendChild(wrapper);
    item.el = wrapper;
});

function render(ratio) {
    // 1. 공간 계수 (Space Factor)
    // 겹침 방지를 위해 계수 차이를 더 벌림
    const cSpace = 6.0 - (ratio * 5.5);
    const vSpace = 0.5 + (ratio * 5.5);
    const sSpace = 0.6; // 공백도 살짝 넓힘

    let totalFactor = 0;
    charsData.forEach(item => {
        if (item.type === 'c') totalFactor += cSpace;
        else if (item.type === 'v') totalFactor += vSpace;
        else totalFactor += sSpace;
    });

    // 배치 로직
    let currentAngle = -Math.PI / 2;

    charsData.forEach(item => {
        let myFactor = 1;
        if (item.type === 'c') myFactor = cSpace;
        else if (item.type === 'v') myFactor = vSpace;
        else myFactor = sSpace;

        const myAngle = (myFactor / totalFactor) * (Math.PI * 2);

        // [중요] 글자 위치 배치
        const placeAngle = currentAngle + (myAngle / 2);
        const x = radius * Math.cos(placeAngle);
        const y = radius * Math.sin(placeAngle);
        const rotate = placeAngle + Math.PI / 2;

        item.el.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}rad)`;

        currentAngle += myAngle;
    });

    // 2. 스타일 업데이트
    const root = document.documentElement;

    // 자음: 폰트가 작아졌으므로 Scale Max를 2.0 -> 2.3으로 키워 임팩트 보전
    root.style.setProperty('--c-weight', 900 - (ratio * 800));
    root.style.setProperty('--c-scale', 2.3 - (ratio * 1.6));

    // 모음: 동일하게 Scale 조정
    root.style.setProperty('--v-weight', 100 + (ratio * 800));
    root.style.setProperty('--v-scale', 0.7 + (ratio * 1.6));
}

render(0.5);

document.addEventListener('mousemove', (e) => {
    const width = window.innerWidth;
    const ratio = e.clientX / width;
    requestAnimationFrame(() => render(ratio));
});