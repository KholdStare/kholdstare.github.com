window.all_charts = [{
  canvasId: "benchmark-canvas-native",
  type: "bar",
  title: 'Integer Parsing Benchmark time in ns (lower is better)',
  labels: [
    "BM_mov",
    "BM_atoll",
    "BM_sstream",
    "BM_charconv",
    "BM_boost_spirit"
  ],
  datasets: [{
    label: "Benchmark",
    data: [
      0.22,
      19.73,
      86.23,
      16.65,
      11.80
    ],
  }]
},
{
  canvasId: "benchmark-canvas-naive",
  type: "bar",
  title: 'Integer Parsing Benchmark time in ns (lower is better)',
  highlightIndices: [5],
  labels: [
    "BM_mov",
    "BM_atoll",
    "BM_sstream",
    "BM_charconv",
    "BM_boost_spirit",
    "BM_naive"
  ],
  datasets: [{
    label: "Benchmark",
    data: [
      0.22,
      19.73,
      86.23,
      16.65,
      11.80,
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
      2.52,
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
      2.52,
      0.75,
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
    "BM_boost_spirit",
    "BM_naive",
    "BM_unrolled",
    "BM_trick",
    "BM_trick_simd"
  ],
  highlightIndices: [8],
  datasets: [{
    label: "Benchmark",
    data: [
      0.22,
      19.73,
      86.23,
      16.65,
      11.80,
      9.74,
      5.66,
      2.52,
      0.75,
    ],
  }]
}]
