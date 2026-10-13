const RULES = {
  freq:   [20, 20000, 'Frequency must be a number from 20 to 20,000'],
  amp:    [0, 1,      'Amplitude must be a number from 0 to 1'],
  samples:[2, 16,     'Number of samples must be a whole number from 2 to 16'],
  bits:   [2, 8,      'Bits per sample must be a whole number from 2 to 8'],
};
const $ = id => document.getElementById(id);

function validate(){
  const errs = [];
  check('freq',    false);
  check('amp',     false);
  check('samples', true);
  check('bits',    true);
  return errs;

  function check(id, whole){
    const [min, max, msg] = RULES[id];
    const raw = $(id).value, v = Number(raw);
    const ok = raw !== '' && !isNaN(v) && v >= min && v <= max && (!whole || Number.isInteger(v));
    $(id).classList.toggle('invalid', !ok);
    if (!ok) errs.push(msg);
  }
}

function showWarnings(list){
  const box = $('warnings');
  if (!list.length){ box.classList.remove('show'); return; }
  $('warningList').innerHTML = list.map(e => `<li>${e}</li>`).join('');
  box.classList.add('show');
}

// Verified against "Check Your Work First":
// freq 1000, amp 1, 4 samples, 2 bits -> 2/10, 3/11, 2/10, 0/00
function quantize(a, bits){
  return Math.round((a + 1) / 2 * (2 ** bits - 1));
}

function convert(){
  const errors = validate();
  showWarnings(errors);
  ['factsCard','vizCard','tableCard'].forEach(id => $(id).hidden = true);
  if (errors.length) return;

  const freq = Number($('freq').value);
  const amp  = Number($('amp').value);
  const n    = Number($('samples').value);
  const bits = Number($('bits').value);

  const periodMs   = 1000 / freq;          // period in ms
  const wavelength = 34300 / freq;         // wavelength in cm (343 m/s)

  $('fAmp').textContent    = amp.toFixed(2);
  $('fFreq').textContent   = freq + ' Hz';
  $('fPeriod').textContent = periodMs.toFixed(2) + ' ms';
  $('fWave').textContent   = wavelength.toFixed(1) + ' cm';

  let rows = '', fullBinary = '';
  for (let i = 1; i <= n; i++){            // sample numbers start at 1
    const tMs = (i - 1) * periodMs / n;    // time in ms
    const a   = amp * Math.sin(2 * Math.PI * freq * (tMs / 1000));
    const level = quantize(a, bits);
    const bin   = level.toString(2).padStart(bits, '0');
    fullBinary += bin;
    rows += `<tr><td>${i}</td><td>${tMs.toFixed(2)}</td><td>${a.toFixed(2)}</td>
                 <td>${level}</td><td class="bin">${bin}</td></tr>`;
  }
  $('tbody').innerHTML = rows;
  $('binaryOut').textContent = fullBinary;
  $('totalBits').textContent = `Total bits: ${fullBinary.length} (${n} samples × ${bits} bits)`;

  ['factsCard','vizCard','tableCard'].forEach(id => $(id).hidden = false);
  drawWave(amp, n);
}

function drawWave(amp, n){
  const c = $('wave'), ctx = c.getContext('2d');
  const W = c.width, H = c.height, mid = H / 2, pad = 16;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();
  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x++){
    const y = mid - amp * (mid - pad) * Math.sin(2 * Math.PI * x / W);
    x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#4ade80';
  for (let i = 0; i < n; i++){
    const x = (i / n) * W;
    const y = mid - amp * (mid - pad) * Math.sin(2 * Math.PI * i / n);
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, mid); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  }
}

$('playBtn').addEventListener('click', () => {
  const freq = Number($('freq').value);
  if (isNaN(freq) || freq < 20 || freq > 20000) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1);
});

$('convertBtn').addEventListener('click', convert);