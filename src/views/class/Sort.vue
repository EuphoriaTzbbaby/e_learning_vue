<template>
  <div class="app">
    <div class="panel">
      <h1>10 大排序可视化（Vue 3）</h1>
      <div class="small">选择算法 / 输入数组 / 控制执行（播放/暂停/单步） / 查看代码</div>

      <label>算法</label>
      <select v-model="algo">
        <option value="insertion">1. 直接插入排序 (Insertion)</option>
        <option value="binary-insertion">2. 折半插入排序 (Binary Insertion)</option>
        <option value="shell">3. 希尔排序 (Shell)</option>
        <option value="quick">4. 快速排序 (Quick)</option>
        <option value="bubble">5. 冒泡排序 (Bubble)</option>
        <option value="heap">6. 堆排序 (Heap)</option>
        <option value="selection">7. 选择排序 (Selection)</option>
        <option value="merge">8. 归并排序 (Merge)</option>
        <option value="counting">9. 计数排序 (Counting)</option>
        <option value="radix">10. 基数排序 (Radix)</option>
      </select>

      <label>数组（逗号或空格分隔）</label>
      <textarea v-model="inputText" rows="4" placeholder="例如：5 3 8 1 2"></textarea>
      <div class="controls">
        <button @click="randomize">随机生成</button>
        <button class="ghost" @click="fromRange">按范围生成</button>
        <input id="sizeRange" v-model.number="size" type="number" min="2" max="200" style="width:84px" />
        <input id="maxVal" v-model.number="maxVal" type="number" min="1" max="10000" style="width:90px" />
      </div>

      <label>速度 (ms / 步)</label>
      <input v-model.number="speed" type="range" min="10" max="1000" class="speed" />

      <div class="controls">
        <button @click="play">播放</button>
        <button class="ghost" @click="pause">暂停</button>
        <button class="ghost" @click="step">单步</button>
        <button class="ghost" @click="reset">重置</button>
        <button class="ghost" @click="toggleCode">查看算法代码</button>
      </div>

      <div style="margin-top:12px" class="info">
        <div class="stat">比较: <span>{{ comps }}</span></div>
        <div class="stat">交换/写入: <span>{{ swaps }}</span></div>
        <div class="stat">数组长度: <span>{{ arr.length }}</span></div>
      </div>

      <label style="margin-top:10px">原始 C++ 代码（点击算法查看）</label>
      <div v-show="showCode" class="codebox">{{ cppCodes[algo] || '未提供原始代码' }}</div>
    </div>

    <div class="panel vis">
      <div class="row">
        <h1 style="flex:1">视觉化</h1>
        <div class="small">当前操作: <span>{{ opDesc }}</span></div>
      </div>

      <div id="bars" class="bars">
        <div v-for="(v, i) in arr" :key="i" class="bar" :style="barStyle(v, i)">{{ v }}</div>
      </div>

      <div class="row" style="justify-content:space-between">
        <div class="small">条形高度与数值成正比。计数/基数排序需要非负整数。</div>
        <div class="small">颜色：比较/交换时会高亮。</div>
      </div>

      <label style="margin-top:6px">控制台（执行日志）</label>
      <div class="codebox" style="height:120px;white-space:pre-wrap">{{ logText }}</div>
    </div>

    <footer class="small">将此组件保存为 <code>SortingVisualizer.vue</code> 并放入 Vue 3 项目中即可使用。</footer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';

type Action = { type: string; i?: number; j?: number; value?: number; msg?: string };

const algo = ref('insertion');
const inputText = ref('');
const size = ref(30);
const maxVal = ref(100);
const speed = ref(120);
const showCode = ref(false);

const state = reactive({
  arr: [] as number[],
  gen: null as Generator<Action, void, unknown> | null,
  timer: 0 as any,
  playing: false,
});

const arr = computed(() => state.arr);

const comps = ref(0);
const swaps = ref(0);
const opDesc = ref('—');
const logText = ref('初始化完毕。可随机或手动输入数组。\n');

function parseInput(text: string) {
  if (!text) return [] as number[];
  return text.trim().split(/[,\s]+/).filter(Boolean).map(x => Number(x));
}

function log(msg: string) { logText.value = msg + '\n' + logText.value; }

function setCounts(c: number, s: number) { comps.value = c; swaps.value = s; }

function barStyle(v: number, _i?: number) {
  const maxV = Math.max(...(state.arr.length ? state.arr.map(x => Math.abs(x)) : [1]), 1);
  const h = Math.max(4, Math.round((Math.abs(v) / maxV) * 100));
  return { height: h + '%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
}

function applyAction(action: Action) {
  const a = state.arr;
  if (!action) return;
  if (action.type === 'compare') {
    comps.value++;
    opDesc.value = `比较 ${action.i} 与 ${action.j}`;
  } else if (action.type === 'swap') {
    swaps.value++;
    if (action.i !== undefined && action.j !== undefined) {
      const tmp = a[action.i];
      a[action.i] = a[action.j];
      a[action.j] = tmp;
      opDesc.value = `交换 ${action.i} 与 ${action.j}`;
    }
  } else if (action.type === 'overwrite') {
    swaps.value++;
    if (action.i !== undefined && action.value !== undefined) {
      a[action.i] = action.value;
      opDesc.value = `写入 a[${action.i}] = ${action.value}`;
    }
  } else if (action.type === 'pivot') {
    opDesc.value = `枢轴: a[${action.i}]`;
  } else if (action.type === 'log') {
    if (action.msg) log(action.msg);
  } else if (action.type === 'finish') {
    opDesc.value = '已完成';
  }
}

// --- generators --- (kept from original, adapted)
function* insertionSort(orig: number[]) : Generator<Action, void, unknown> {
  const a = orig;
  for (let i = 1; i < a.length; i++) {
    let key = a[i];
    let j = i - 1;
    while (j >= 0) {
      yield { type: 'compare', i: j, j: i };
      if (a[j] > key) { yield { type: 'overwrite', i: j + 1, value: a[j] }; j--; } else break;
    }
    yield { type: 'overwrite', i: j + 1, value: key };
  }
  yield { type: 'finish' };
}

function* binaryInsertionSort(orig: number[]) : Generator<Action, void, unknown> {
  const a = orig;
  for (let i = 1; i < a.length; i++) {
    let key = a[i]; let l = 0, r = i - 1;
    while (l <= r) { let m = Math.floor((l + r) / 2); yield { type: 'compare', i: m, j: i }; if (a[m] >= key) r = m - 1; else l = m + 1; }
    for (let j = i - 1; j >= l; j--) yield { type: 'overwrite', i: j + 1, value: a[j] };
    yield { type: 'overwrite', i: l, value: key };
  }
  yield { type: 'finish' };
}

function* shellSort(orig: number[]) : Generator<Action, void, unknown> {
  const a = orig; let n = a.length;
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)){
    for (let i = gap; i < n; i++){ let temp = a[i]; let j = i - gap; while (j >= 0){ yield { type: 'compare', i: j, j: i }; if (a[j] > temp){ yield { type: 'overwrite', i: j + gap, value: a[j] }; j -= gap; } else break; } yield { type: 'overwrite', i: j + gap, value: temp }; }
  }
  yield { type: 'finish' };
}

function* bubbleSort(orig: number[]) : Generator<Action, void, unknown> {
  const a = orig; let n = a.length;
  for (let i = 0; i < n - 1; i++){ let swapped = false; for (let j = 0; j < n - 1 - i; j++){ yield { type: 'compare', i: j, j: j + 1 }; if (a[j] > a[j + 1]){ yield { type: 'swap', i: j, j: j + 1 }; swapped = true; } } if (!swapped) break; }
  yield { type: 'finish' };
}

function* selectionSort(orig: number[]) : Generator<Action, void, unknown> {
  const a = orig; let n = a.length;
  for (let i = 0; i < n - 1; i++){ let mn = i; for (let j = i + 1; j < n; j++){ yield { type: 'compare', i: mn, j }; if (a[j] < a[mn]) mn = j; } if (mn !== i) yield { type: 'swap', i, j: mn }; }
  yield { type: 'finish' };
}

function* mergeSortGen(orig: number[]) : Generator<Action, void, unknown> {
  const a = orig; const aux = a.slice();
  function* merge(l: number, m: number, r: number): Generator<Action, void, unknown> { let i = l, j = m + 1, k = l; while (i <= m && j <= r){ yield { type: 'compare', i, j }; if (a[i] <= a[j]) aux[k++] = a[i++]; else aux[k++] = a[j++]; } while (i <= m) aux[k++] = a[i++]; while (j <= r) aux[k++] = a[j++]; for (let t = l; t <= r; t++){ yield { type: 'overwrite', i: t, value: aux[t] }; a[t] = aux[t]; } }
  function* ms(l: number, r: number): Generator<Action, void, unknown> { if (l >= r) return; const mid = Math.floor((l + r) / 2); yield* ms(l, mid); yield* ms(mid + 1, r); yield* merge(l, mid, r); }
  yield* ms(0, a.length - 1); yield { type: 'finish' };
}

function* quickSortGen(orig: number[]) : Generator<Action, void, unknown> {
  const a = orig;
  function* qs(l: number, r: number): Generator<Action, void, unknown> { if (l >= r) return; let i = l, j = r; const pivot = a[l]; yield { type: 'pivot', i: l }; while (i < j){ while (i < j){ yield { type: 'compare', i: j, j: l }; if (a[j] >= pivot) { j--; } else break; } if (i < j){ yield { type: 'overwrite', i, value: a[j] }; a[i] = a[j]; i++; } while (i < j){ yield { type: 'compare', i, j: l }; if (a[i] < pivot) { i++; } else break; } if (i < j){ yield { type: 'overwrite', i: j, value: a[i] }; a[j] = a[i]; j--; } } yield { type: 'overwrite', i, value: pivot }; a[i] = pivot; yield* qs(l, i - 1); yield* qs(i + 1, r); }
  yield* qs(0, a.length - 1); yield { type: 'finish' };
}

function* heapSortGen(orig: number[]) : Generator<Action, void, unknown> {
  const a = orig; const heap: number[] = [];
  for (let i = 0; i < a.length; i++){ heap.push(a[i]); let idx = heap.length - 1; while (idx > 0){ const p = Math.floor((idx - 1) / 2); yield { type: 'compare', i: p, j: idx }; if (heap[p] > heap[idx]){ let t = heap[p]; heap[p] = heap[idx]; heap[idx] = t; idx = p; } else break; } }
  for (let k = 0; k < a.length; k++){ const smallest = heap[0]; yield { type: 'overwrite', i: k, value: smallest }; heap[0] = heap.pop() as number; let i = 0; while (2 * i + 1 < heap.length){ let son = 2 * i + 1; if (son + 1 < heap.length){ yield { type: 'compare', i: son, j: son + 1 }; if (heap[son] > heap[son + 1]) son++; } yield { type: 'compare', i, j: son }; if (heap[son] < heap[i]){ let t = heap[son]; heap[son] = heap[i]; heap[i] = t; i = son; } else break; } }
  yield { type: 'finish' };
}

function* countingSortGen(orig: number[]) : Generator<Action, void, unknown> {
  const a = orig; if (a.some(x => x < 0)) { yield { type: 'log', msg: '计数排序要求非负整数。' }; yield { type: 'finish' }; return; } const maxV = Math.max(...a); const cnt = new Array(maxV + 1).fill(0); for (let i = 0; i < a.length; i++){ cnt[a[i]]++; yield { type: 'log', msg: `计数: val=${a[i]}` }; } for (let v = 0, idx = 0; v < cnt.length; v++){ while (cnt[v]-- > 0){ yield { type: 'overwrite', i: idx++, value: v }; } } yield { type: 'finish' };
}

function* radixSortGen(orig: number[]) : Generator<Action, void, unknown> {
  const a = orig; if (a.some(x => x < 0)) { yield { type: 'log', msg: '基数排序要求非负整数。' }; yield { type: 'finish' }; return; } const maxV = Math.max(...a); let exp = 1; const aux = new Array(a.length); while (exp <= maxV){ const cnt = new Array(10).fill(0); for (let i = 0; i < a.length; i++){ cnt[Math.floor((a[i] / exp) % 10)]++; } for (let i = 1; i < 10; i++) cnt[i] += cnt[i - 1]; for (let i = a.length - 1; i >= 0; i--){ const d = Math.floor((a[i] / exp) % 10); aux[--cnt[d]] = a[i]; } for (let i = 0; i < a.length; i++){ yield { type: 'overwrite', i, value: aux[i] }; } exp *= 10; } yield { type: 'finish' };
}

function getGenerator(name: string, arr: number[]) { const copy = arr.slice(); switch (name){ case 'insertion': return insertionSort(copy); case 'binary-insertion': return binaryInsertionSort(copy); case 'shell': return shellSort(copy); case 'bubble': return bubbleSort(copy); case 'selection': return selectionSort(copy); case 'merge': return mergeSortGen(copy); case 'quick': return quickSortGen(copy); case 'heap': return heapSortGen(copy); case 'counting': return countingSortGen(copy); case 'radix': return radixSortGen(copy); default: return insertionSort(copy); } }

function randomize(){ const n = size.value || 30; const mx = maxVal.value || 100; const arr = Array.from({ length: n }, () => Math.floor(Math.random() * mx)); inputText.value = arr.join(' '); prepare(); }
function fromRange(){ const n = size.value || 30; const arr = Array.from({ length: n }, (_, i) => i + 1); inputText.value = arr.join(' '); prepare(); }
function toggleCode(){ showCode.value = !showCode.value; }
function prepare(skipLog = false){ pause(); const arr = parseInput(inputText.value); if (arr.length === 0){ log('数组为空，先随机生成一个'); randomize(); return; } state.arr = arr.slice(); state.gen = getGenerator(algo.value, state.arr); comps.value = 0; swaps.value = 0; setCounts(0, 0); opDesc.value = '—'; if (!skipLog) log('已准备: 算法=' + algo.value + ' 长度=' + state.arr.length); }
function play(){ if (!state.gen) prepare(); if (state.playing) return; state.playing = true; run(); }
function pause(){ state.playing = false; if (state.timer){ clearTimeout(state.timer); state.timer = 0; } }
function run(){ if (!state.playing || !state.gen) return; const step = state.gen.next(); if (step.done){ state.playing = false; return; } applyAction(step.value as Action); state.timer = setTimeout(run, speed.value); }
function step(){ if (!state.gen) prepare(); if (!state.gen) return; const s = state.gen.next(); if (s.done){ applyAction({ type: 'finish' }); } else applyAction(s.value as Action); }
function reset(){ prepare(true); }

const cppCodes: Record<string, string> = {
  'insertion': `// 1.直接插入排序\nvoid InsertSort(vector<int> &nums) {\n    int n = nums.size() - 1;\n    for(int i = 2; i <= n; i += 1) {\n        if(nums[i] < nums[i - 1]) {\n            nums[0] = nums[i];\n            int j = i - 1;\n            while(nums[j] > nums[0]) {\n                nums[j + 1] = nums[j];\n                j -= 1;\n            }\n            nums[j + 1] = nums[0];\n        }\n    }\n};`,
  'binary-insertion': `// 2.折半插入排序\n...`,
  'shell': `// 3.希尔排序\n...`,
  'quick': `// 4.快速排序\n...`,
  'bubble': `// 5.冒泡排序\n...`,
  'heap': `// 6.堆排序\n...`,
  'selection': `// 7.选择排序\n...`,
  'merge': `// 8.归并排序\n...`,
  'counting': `// 9.计数排序\n...`,
  'radix': `// 10.基数排序\n...`
};

onMounted(()=>{ const arr = Array.from({ length: size.value }, () => Math.floor(Math.random() * maxVal.value)); inputText.value = arr.join(' '); prepare(true); });
</script>

<style scoped>
:root{--bg:#0f1724;--card:#0b1220;--muted:#94a3b8;--accent:#7c3aed;--glass:rgba(255,255,255,0.03)}
html,body{height:100%;margin:0}
.app{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:360px 1fr;gap:18px;padding:18px;background:linear-gradient(180deg,#071028 0%, #071a2a 60%);color:#e6eef6;font-family:Inter,system-ui,Arial}
.panel{background:var(--card);border-radius:12px;padding:16px;box-shadow:0 6px 30px rgba(2,6,23,0.6)}
h1{margin:0 0 8px;font-size:20px}
label{display:block;color:var(--muted);font-size:13px;margin-top:10px}
select,input,textarea{width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:var(--glass);color:inherit}
.controls{display:flex;gap:8px;margin-top:10px}
button{background:linear-gradient(90deg,var(--accent),#4c1d95);border:0;color:white;padding:8px 10px;border-radius:8px;cursor:pointer}
button.ghost{background:transparent;border:1px solid rgba(255,255,255,0.06)}
.vis{background:linear-gradient(180deg,#071a2a, #042034);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:12px}
.bars{height:380px;background:transparent;border-radius:8px;display:flex;align-items:flex-end;gap:4px;padding:8px}
.bar{flex:1;border-radius:6px;background:linear-gradient(180deg,#60a5fa22,#3b82f622);display:flex;align-items:flex-end;justify-content:center;color:var(--muted);font-size:12px}
.info{display:flex;gap:12px;color:var(--muted);font-size:13px}
.row{display:flex;gap:8px;align-items:center}
.codebox{height:360px;overflow:auto;background:#020617;border-radius:8px;padding:12px;border:1px solid rgba(255,255,255,0.03);font-family:monospace;font-size:12px}
.small{font-size:12px;color:var(--muted)}
footer{grid-column:1/-1;margin-top:12px;color:var(--muted);text-align:center}
.stat{background:rgba(255,255,255,0.02);padding:8px;border-radius:8px}
.speed{width:100%}
@media (max-width:980px){.app{grid-template-columns:1fr}.panel{padding:12px}}
</style>
