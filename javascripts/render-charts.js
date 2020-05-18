// defaults
const color = Chart.helpers.color;
const rectangleDefaults = Chart.defaults.global.elements.rectangle;
rectangleDefaults.backgroundColor = color('#2ba6cb').alpha(0.5).rgbString();
rectangleDefaults.borderColor = '#2ba6cb';
rectangleDefaults.borderWidth = 1;
Chart.defaults.global.defaultFontColor = '#d0d0d0';

window.onload = function() {
  const gridLinesDefaults = {
    color: '#363636'
  }
  const scalesDefaults = {
    xAxes: [{
      gridLines: gridLinesDefaults
    }],
    yAxes: [{
      gridLines: gridLinesDefaults,
      scaleLabel: {
        display: true,
        labelString: 'ns',
      },
      ticks: {
        min: 0,
      }
    }]
  }

  // define `window.all_charts` with an array of charts to render with some defaults
  window.all_charts.forEach(function(chart) {
    // canonicalize the chart data
    chart.datasets.forEach(set => set.datalabels = {
      align: 'end',
      anchor: 'end'
    });
    chart = Object.assign({ highlightIndices: [] }, chart);
    
    const colorize = function(opaque, ctx) {
      const shouldHighlight = chart.highlightIndices.includes(ctx.dataIndex)
      const c = shouldHighlight ? 'rgb(35, 216, 158)' : '#2ba6cb';
      return opaque ? c : color(c).alpha(0.5).rgbString();
    };

    const legend_options = { position: 'top', display: false };
    if (chart.datasets.length > 1) {
      legend_options.display = true;
    }

    const ctx = document.getElementById(chart.canvasId).getContext('2d');
    new Chart(ctx, {
      type: chart.type,
      data: chart,
      options: {
        responsive: true,
        legend: legend_options,
        title: {
          display: true,
          text: chart.title
        },
        scales: scalesDefaults,
        elements: {
          rectangle: {
            backgroundColor: colorize.bind(null, false),
            borderColor: colorize.bind(null, true)
          }
        }
      }
    });
  });
};
