const ctx = document.getElementById('HouseholdEnergy');
var heRedraw = 0;
var shRedraw = 0;
var labels = [
  'Water Heating',
  'A/C',
  'Lighting',
  'All Others',
  'Space Heating'
];
Chart.defaults.font.family = "'Open Sans', 'Arial', 'Helvetica', sans-serif";
const HouseholdEnergyChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: labels,
        datasets: [{
            label: 'Home Energy Usage',
            data: [17, 8, 5, 24,46],
            backgroundColor: [
                '#F8C221',
                '#5EA970',
                '#5EA970',
                '#5EA970',
                '#5EA970'
            ],

		  datalabels: {
			labels: {
			  name: {
				align: 'top',
				font: {size: 14},
				formatter: function(value, ctx) {
				  return ctx.chart.data.labels[ctx.dataIndex];
				}
			  },
			  value: {
				align: 'bottom',
				//borderColor: 'white',
				//borderWidth: 2,
				//borderRadius: 4,
				formatter: function(value, ctx) {
				  return value + '%';
				},
				padding: 4
			  }
			}
		  }

        }]	
    },
	plugins: [ChartDataLabels],
    options: {
		plugins: {
			tooltip: { enabled: false },
			datalabels: {
				color: '#474d55',
				labels: {
					name: {
						font: {
							weight: 'bold'
						}
					}
				}
			},
			legend: {
				display:false
			},
			tooltips: false
		},
		animation: {
			duration: 2500,
		},
	  	responsive: true,
	  	cutout: '45%',
	  	maintainAspectRatio: true,
		aspectRatio: 1,
		maintainAspectRatio: true,
    },
});

const ctx2 = document.getElementById('SunHopperAlgo');
var labels2 = [
'02:00','04:00','06:00', '08:00', '10:00', '12:00','14:00', '16:00', '18:00', '20:00', '22:00'
];
Chart.defaults.font.family = "'Open Sans', 'Arial', 'Helvetica', sans-serif";
const SunHopperAlgo = new Chart(ctx2, {
    type: 'line',
    data: {
        labels: labels2,
        datasets: [{
            label: 'Sunny Day Output',
            data: [
				0,0,30,250,460,560,480,300,30,0,0
			],
			backgroundColor: '#9BD0F550',
			borderColor: '#36A2EB',
			fill: true,
			pointRadius: 0,
			tension: 0.4
		},{
			label: 'Cloudy Day Output',
            data: [
				0,0,0,20,30,100,400,200,10,0,0
			],
			fill: true,
			pointRadius: 0,
			tension: 0.4,
			borderColor: '#FF6384',
      backgroundColor: '#FFB1C150',
        }]	
    },
	//plugins: [ChartDataLabels],
    options: {
		plugins: {
			tooltip: { enabled: false },
			legend: {
				display:true
			},
			tooltips: false
		},
		scales: {
			x: {
				title: {
				display: true,
				text: 'Time',
				font:{ 
					weight:900
				}
				}
			},
			y: {
				title: {
				display: true,
				text: 'Power (W)',
				font:{ 
					weight:900
				}
						}
			}
		},
		animation: {
			duration: 2500,
		},
	  	responsive: true,
	  	maintainAspectRatio: true,
		aspectRatio: 1,
		maintainAspectRatio: true,
    },

});

// define an observer instance
var observerHE = new IntersectionObserver(HEIntersection, {
  root: null,   // default is the viewport
  threshold: 0.1 // percentage of target's visible area. Triggers "HEIntersection"
});
// define an observer instance
var observerSH = new IntersectionObserver(SHIntersection, {
  root: null,   // default is the viewport
  threshold: 0.1 // percentage of target's visible area. Triggers "SHIntersection"
});

// callback is called on intersection change
function HEIntersection(entries){
	if((heRedraw < 2))
	{
		HouseholdEnergyChart.reset();
		HouseholdEnergyChart.update();
		heRedraw += 1;
	}

};
// callback is called on intersection change
function SHIntersection(entries){
	if((shRedraw < 2))
	{
		SunHopperAlgo.reset();
		SunHopperAlgo.update();
		shRedraw += 1;
	}

};
// Use the observer to observe an element
observerHE.observe( document.getElementById('HouseholdEnergy') );
observerSH.observe( document.getElementById('SunHopperAlgo') );