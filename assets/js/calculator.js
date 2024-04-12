/* GreenPWR LLC calculator application
Written December 2021
(C) 2021 GreenPWR LLC
*/



const PV_POWER_CAP = 1.5; // kW
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const PV_UEF = 0.92;	//UEF for electric immersion tank, average at 0.92

var gpd_PV = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

/* Called from Submit button
Order of functions:
1. load_zipdata
2. load_pvwatts
3. updatechart
(these call each other in order)
*/

//function for replacing text for energy backup type
var BUTxt = new Array()
BUTxt[0] = "Please Select Backup Energy"
BUTxt[1] = "N/A"
BUTxt[2] = "Electricity Cost &cent;/kWh"
BUTxt[3] = "Natural Gas Cost $/therm"
BUTxt[4] = "Propane Cost $/gal"

function getText(slction){
	txtSelected = slction.selectedIndex;
	document.getElementById('backupEnergyInput').innerHTML = BUTxt[txtSelected];
	if (txtSelected == 1)
	document.getElementById('buCost').value = 0;
}


//Zip code function
//https://greenpwr.com/assets/data/Zipcode_List.txt
async function load_zipdata() {
  await $.get("/assets/data/Zipcode_List.txt",
    function(data) {
      load_pvwatts(data.split("\n"));
  });
}

async function load_pvwatts(zip_data) {
  var zipcode = zip.value;
  var latitude;
  var longitude;
  var azimuth = 180;
  for (var i = 1; i < zip_data.length; i++) {
    var zip_line = zip_data[i].split(",");
    if (zip_line[0] == ''+zipcode) {
      latitude = new Number(zip_line[1]);
      longitude = new Number(zip_line[2]);
    }
	// setting tilt of panels to latitude for optimal annual performance
	var tilt = latitude;
  }

  await $.get("https://developer.nrel.gov/api/pvwatts/v8.json?api_key=WrwNOOUSHvNLeglj4vsCKHzvKRPn7N7nJS01SsZD&lat="+latitude+
  "&lon="+longitude+"&system_capacity=1&azimuth="+azimuth+"&tilt="+tilt+"&array_type=1&module_type=1&losses=10",
    function(data) {
      updatechart(data);
  });
}

function readdata() {
  load_zipdata();
  // this will then call the next functions in order
}

function updatechart(data) {
	
  var bu_source_str = bu_source.value;
  var bu_title = bu_source_str;
  
  if (bu_source_str == "")
    bu_source_str = "Backup";
  if (bu_source_str == "Electric")
  {
	  bu_title = "Electricity";
  }
  if (bu_source_str == "Off-Grid")
	  bu_title = "Backup";
  
  var pv_daily = pv_power(data);
  
  var daily_QL = ((new Number(gpd.value))*3.79*4.19*(60-18))/(3600*PV_UEF); 	//adds UEF losses from immersion tank
  var electricity_daily = [];

  for (var i = 0; i < pv_daily.length; i++) {
    var e = Math.round(100*(daily_QL - pv_daily[i]))/100;	//round to 2 places
    if (bu_source.value == "Off-Grid") {
      e = 0;
    } else if (pv_daily[i] > daily_QL*0.8) {
      pv_daily[i] = Math.round(100*daily_QL*0.8)/100;
      e = Math.round(100*daily_QL*0.2)/100;
    }
    electricity_daily.push(e);
  }
  
  var pv_total = 0;
  for (var i = 0; i < pv_daily.length; i++)
    pv_total += pv_daily[i]*MONTH_DAYS[i];
  var electricity_total = 0;
  for (var i = 0; i < electricity_daily.length; i++)
    electricity_total += electricity_daily[i]*MONTH_DAYS[i];
  var energy_total = pv_total+electricity_total;
  
	var updateValues1 = [Math.round(pv_total/energy_total*100), Math.round(electricity_total/energy_total*100)];
	myChart1.data.datasets[0].data = updateValues1;

	var updateValues2 = [Math.round(electricity_total/energy_total*100), Math.round(pv_total/energy_total*100)];
	myChart2.data.datasets[0].data = updateValues2;


  myChart2.options.plugins.title.text = "Energy from " + bu_title;

	var updateValues3 = pv_daily;
	var updateValues4 = electricity_daily;
	myChart3.data.datasets[0].data = updateValues3;
	myChart3.data.datasets[1].data = updateValues4;

	myChart1.update();
	myChart2.update();
	myChart3.update();

  if (bu_source_str == "Off-Grid")
    diag.src = 'images/System_Off_Grid.png';
  else if (bu_source_str == "Electric")
    diag.src = 'images/System_Elec_Backup.png';
  else if (bu_source_str == "Natural Gas")
    diag.src = 'images/System_Fossil_Backup.png';
  else if (bu_source_str == "Propane")
    diag.src = 'images/System_Fossil_Backup.png';
  
  //calculate break-even, tank size estimations, energy cost  
  //calculate cost for energy consumed and saved, off-grid calcs are for gallons per day
  if(bu_source_str == "Electric")
  {
	  energy_cost = buCost.value*electricity_total/(100);	//Assuming UEF = 0.92, already built into PV calcs  
	  energy_savings = buCost.value*pv_total/(100);
  }
  
  else if(bu_source_str == "Natural Gas")
  {
	  energy_cost = buCost.value/29.3*electricity_total/0.6;	//Assuming UEF = 0.6
	  energy_savings = buCost.value/29.3*pv_total/(0.6/PV_UEF);	//for 2 tanks, assume additional losses from PV heat coming in are equal to PV_UEF
																//energy losses are mostly from combustion and flue
  }
  
  else if(bu_source_str == "Propane")
  {
	  energy_cost = buCost.value/27.99*electricity_total/0.61;	//Assuming UEF = 0.61
	  energy_savings = buCost.value/27.99*pv_total/(0.61/PV_UEF);
  }
	
//average gallons per day calc for each month
	for (var i = 0; i < pv_daily.length; i++) {
    gpd_PV[i] = 3600*pv_daily[i]/(4.19*(60-18)*3.79);	//round to 2 places
	}
	var gpd_PV_min = Math.min.apply(null,gpd_PV);
	var gpd_PV_max = Math.max.apply(null,gpd_PV);
	
	//calculate average gallons of water created by PV per day
	var gpd_PV_avg = 0;
	for (i = 0; i < 12; i++) {
    gpd_PV_avg += gpd_PV[i];	
	}
	gpd_PV_avg = gpd_PV_avg/12;
  
  //tank size calculations based on minimum values
    var tank_size = 0;
	if(bu_source_str == "Off-Grid")
	{
		tank_size = 2.5*gpd.value;
	}
	else if((bu_source_str == "Natural Gas")||((bu_source_str == "Propane")))
	{
		tank_size = Math.round(1.25*gpd_PV_max);
	}
	//these are for electric backup cases only
	else if(usageProfile.value == "Morning")
	{
		tank_size = Math.max(Math.round(1.5*gpd_PV_max),gpd.value);
	}
    else if(usageProfile.value == "Evening")
	{
		tank_size = Math.max(Math.round(1.1*gpd_PV_max),gpd.value);
	}
    else if(usageProfile.value == "Morning+Evening")
	{
		tank_size = Math.max(Math.round(1.25*gpd_PV_max),gpd.value);
	}
     else if(usageProfile.value == "Constant")
	{
		tank_size = Math.max(Math.round(1.1*gpd_PV_max),gpd.value);
	}
  
 
  if(bu_source_str == "Off-Grid")
  {
	  if(gpd_PV_avg<gpd.value)
	  {
	out_num.innerHTML = "Average output per day: " + Math.round(gpd_PV_avg) +
  " gallons<br><b>Does not meet required water volume.  Adjust water usage and PV array size.</b>";
	  }
	  else
	  {
	out_num.innerHTML = "Average output per day: " + Math.round(gpd_PV_avg) +
  " gallons<br>Recommended tank size: " + tank_size + " gallons";
	  }
  }
  else
  {
	out_num.innerHTML = "Annual energy savings: $" + energy_savings.toFixed(2) +
  "<br>Annual energy cost: $" + energy_cost.toFixed(2) +
  "<br>Recommended minimum tank size: " + tank_size + " gallons";
  }
  
 //update chart percentages in html
	chart1Percentage.innerHTML = updateValues1[0] + "%";
	chart2Percentage.innerHTML = updateValues2[0] + "%"; 
	
//scroll to the results tag
document.getElementById("results").scrollIntoView();
}

/* Data processing */
function hourly_pv(time, month, tlt, azim, l_in) {
  // time from -12 to 12
  var lat = l_in*Math.PI/180.0;
  var hour = time*Math.PI/12.0;
  var dec = (23.5*Math.PI/180.0)*Math.sin((month-3)*Math.PI/6.0);
  var elev = Math.acos(Math.sin(dec)*Math.sin(lat)+Math.cos(dec)*Math.cos(lat)*Math.cos(hour));
  var sunpos = Math.acos((Math.sin(dec)*Math.cos(lat)-Math.sin(lat)*Math.cos(dec)*Math.cos(hour))/Math.sin(elev));
  if (hour > 0)
    sunpos = 2*Math.PI-sunpos;
  var power = Math.sin(tlt*Math.PI/180.0)*Math.cos(azim*Math.PI/180.0)*Math.sin(elev)*Math.cos(sunpos)
    +Math.sin(tlt*Math.PI/180.0)*Math.sin(azim*Math.PI/180.0)*Math.sin(elev)*Math.sin(sunpos)
    +Math.cos(tlt*Math.PI/180.0)*Math.cos(elev);
  power *= Math.cos(elev);
  if (power < 0 || elev > Math.PI/2.0)
    power = 0;
  return power;
}
function hourly_pv_integral(month, tlt, azim, l_in) {
  var sum = 0;
  var x = -12;
  var dx = 0.01;
  while (x <= 12) {
    x += dx;
    var add = hourly_pv(x, month, tlt, azim, l_in)*dx;
    if (!isNaN(add))
      sum += add;
  }
  return sum;
}

function pv_power(data) {
  var monthly = data["outputs"]["ac_monthly"];
  var tilt = data["inputs"]["tilt"];
  var azimuth = data["inputs"]["azimuth"];
  var lat = data["inputs"]["lat"];
  for (var i = 0; i < monthly.length; i++)
    monthly[i] = (monthly[i]*arrayWp.value/1000.0); // kWh*W/1000W = [kWh]
  var hourly = [];
  for (var i = 0; i < monthly.length; i++) {
    hourly.push([]);
    var int = hourly_pv_integral(i+1, tilt, azimuth, lat);
    for (var h = -12; h < 12; h++) {
      var power = hourly_pv(h, i+1, tilt, azimuth, lat);
      var nanTries = 0;
      while (isNaN(power) && nanTries <= 5) {
        power = hourly_pv(h+0.01, i+1, tilt, azimuth, new Number((new Number(lat)).toFixed(5-nanTries)));
        nanTries++;
      }
      hourly[i].push(power/int*monthly[i]/MONTH_DAYS[i]);
    }
  }
  var daily = [];
  var cap = Math.min(PV_POWER_CAP, new Number(heater.value));
  for (var i = 0; i < monthly.length; i++) {
    for (var h = -12; h < 12; h++) {
      if (hourly[i][h+12] > cap)
        monthly[i] -= (hourly[i][h+12] - cap)*MONTH_DAYS[i];
    }
    daily.push(Math.round(100*monthly[i]/MONTH_DAYS[i])/100);	//round to 2 places
  }
  return daily;
}

/* Initialization */
var zip = document.getElementById('zip');
var bu_source = document.getElementById('BU_Source');
var gpd = document.getElementById('GPD');
var heater = document.getElementById('Heater');
var usageProfile = document.getElementById('usageProfile');
var arrayWp = document.getElementById('arrayWp');
var buCost = document.getElementById('buCost');
var form = document.getElementById("energyForm");
var diag = document.getElementById('diagram');
var out_num = document.getElementById('output_numbers');
var chart1Percentage = document.getElementById('Chart1_Percentage');
var chart2Percentage = document.getElementById('Chart2_Percentage');

function handleForm(event) {
	event.preventDefault(); // prevents page refresh on form submission
}

form.addEventListener('submit', handleForm);

/* Chart 1 */
const data1 = {
  labels: [],
  datasets: [{
    data: [0, 100],
    backgroundColor: [
      '#5EA970',
      '#C1DDC8',
    ],
  }]
};

const config1 = {
	type: 'doughnut',
	data: data1,
	options: {
		plugins: {
			tooltip: { enabled: false },
			title: {
				display: true,
				text: 'Energy from PV'
			},

		},
		responsive: false,
		cutout: '60%',
		maintainAspectRatio: false,
	}
};

Chart.defaults.font.family = "'Open Sans', 'Arial', 'Helvetica', sans-serif";
var myChart1 = new Chart(document.getElementById('myChart1'), config1);

/* Chart2 */
const data2 = {
  labels: [],
  datasets: [{
   	data: [0, 100],
    backgroundColor: [
      '#474D55',
      '#BCC1C8',
    ],
    hoverOffset: 4
  }]
};

const config2 = {
	type: 'doughnut',
	data: data2,
	//plugins: [ChartDataLabels],
	options: {
		plugins: {
			tooltip: { enabled: false },
			title: {
				display: true,
				text: 'Energy from Backup'
			},			
		},
		responsive: false,
	  	cutout: '60%',
	  	maintainAspectRatio: false,
	}
};

var myChart2 = new Chart(document.getElementById('myChart2'), config2);


/* Chart3, monthly energy output */
const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const data3 = {
  labels: labels,
  datasets: [
    {
      label: 'PV Energy',
      data: [0,0,0,0,0,0,0,0,0,0,0,0],
      backgroundColor: "#5EA970",
    },
    {
      label: 'Backup Energy',
      data: [0,0,0,0,0,0,0,0,0,0,0,0],
      backgroundColor: "#474D55",
    },
  ]
};

const config3 = {
  type: 'bar',
  data: data3,
  options: {
	plugins: {
		tooltip: { enabled: true },
		title: {
		display: true,
		text: 'Energy Demand'
			}
	},
    responsive: true,
	aspectRatio: 2,
    maintainAspectRatio: true,
	scales: {
	    xAxis: { 
		stacked: true 
		},
	    yAxis: { 
		stacked: true, 
		ticks: {
				beginAtZero: true
		},		
		title:{
					display: true,
					text: 'Energy per Day (kWh)',
					color: "#474d55"
        }
		}
	}
  }
};
var myChart3 = new Chart(document.getElementById('myChart3'), config3);