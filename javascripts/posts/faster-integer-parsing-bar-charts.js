window.all_charts = [{
  canvasId: "benchmark-canvas-native",
  type: "bar",
  title: 'Integer Parsing Benchmark time in ns (lower is better)',
  labels: [
    "BM_mov",
    "BM_atoll",
    "BM_sstream",
    "BM_charconv"
  ],
  datasets: [{
    label: "Benchmark",
    data: [
      0.22,
      19.73,
      86.23,
      16.65
    ],
  }]
},
{
  canvasId: "benchmark-canvas-naive",
  type: "bar",
  title: 'Integer Parsing Benchmark time in ns (lower is better)',
  highlightIndices: [4],
  labels: [
    "BM_mov",
    "BM_atoll",
    "BM_sstream",
    "BM_charconv",
    "BM_naive"
  ],
  datasets: [{
    label: "Benchmark",
    data: [
      0.22,
      19.73,
      86.23,
      16.65,
      9.74
    ],
  }]
},
{
  canvasId: "benchmark-canvas-brute-force",
  type: "bar",
  title: 'Integer Parsing Benchmark time in ns (lower is better)',
  labels: [
    "BM_mov",
    "BM_naive",
    "BM_unrolled"
  ],
  highlightIndices: [2],
  datasets: [{
    label: "Benchmark",
    data: [
      0.22,
      9.74,
      5.66
    ],
  }]
},
{
  canvasId: "benchmark-canvas-trick",
  type: "bar",
  title: 'Integer Parsing Benchmark time in ns (lower is better)',
  labels: [
    "BM_mov",
    "BM_naive",
    "BM_unrolled",
    "BM_trick",
  ],
  highlightIndices: [3],
  datasets: [{
    label: "Benchmark",
    data: [
      0.22,
      9.74,
      5.66,
      3.22,
    ],
  }]
},
{
  canvasId: "benchmark-canvas-trick-simd",
  type: "bar",
  title: 'Integer Parsing Benchmark time in ns (lower is better)',
  labels: [
    "BM_mov",
    "BM_naive",
    "BM_unrolled",
    "BM_trick",
    "BM_trick_simd"
  ],
  highlightIndices: [4],
  datasets: [{
    label: "Benchmark",
    data: [
      0.22,
      9.74,
      5.66,
      3.22,
      1.14,
    ],
  }]
},
{
  canvasId: "benchmark-canvas-all",
  type: "bar",
  title: 'Integer Parsing Benchmark time in ns (lower is better)',
  labels: [
    "BM_mov",
    "BM_atoll",
    "BM_sstream",
    "BM_charconv",
    "BM_naive",
    "BM_unrolled",
    "BM_trick",
    "BM_trick_simd"
  ],
  highlightIndices: [7],
  datasets: [{
    label: "Benchmark",
    data: [
      0.22,
      19.73,
      86.23,
      16.65,
      9.74,
      5.66,
      3.22,
      1.14,
    ],
  }]
}]
