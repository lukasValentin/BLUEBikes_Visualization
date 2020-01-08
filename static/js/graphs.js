//this is the script where the interactive graphs for the assignment are generated including the leaflet map
//adopted from an example provided by http://adilmoujahid.com//posts/2016/08/interactive-data-visualization-geospatial-d3-dc-leaflet-python/
//for the BLUEBikes dataset

// select an example dataset first

var selection = document.getElementById("selection").value;

var tripsDataURL = "";
if (selection === "Example Weekday (1st Oct 2019)") {
	tripsDataURL = "https://raw.githubusercontent.com/lukasValentin/BLUEBikes_Visualization/master/sampleData/BLUEBikes_weekday.json";
} else if (selection === "Example Weekend (13th Oct 2019)") {
	tripsDataURL = "https://raw.githubusercontent.com/lukasValentin/BLUEBikes_Visualization/master/sampleData/BLUEBikes_weekend.json";
}

//query JSON data using Ajax/HTTP GET
var jsonTripsData = $.ajax({
	data: {get_param: 'value'},
	url: tripsDataURL,
	dataType: "json",
	success: function (data) {
		makeGraphs(data);	
	}
});

//define graphs
var makeGraphs = function(records) {

	// clean data
	var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");

	// clean the timestamps to allow for temporal aggregation
	records.forEach(function(d) {
		d["starttime"] = dateFormat.parse(d["starttime"]);
		d["starttime"].setMinutes(0);
		d["starttime"].setSeconds(0);
		d["longitude"] = +d["start station longitude"];
		d["latitude"] = +d["start station latitude"];
	});

	// create a Crossfilter instance to allow for the interactivity of the dashboard
	var ndx = crossfilter(records);

	// define Dimensions of the data
	var dateDim = ndx.dimension(function(d) { return d["starttime"]; });		// temporal information
	var genderDim = ndx.dimension(function(d) { return d["gender"]; });		// gender information
	var ageSegmentDim = ndx.dimension(function(d) { return d["age_segments"]; });	// age segments
	var userTypeDim = ndx.dimension(function(d) { return d["usertype"]; });		// usertype information
	var allDim = ndx.dimension(function(d) {return d;});				// put all dimensions together


	// group extracted data by defined dimensions
	var numRecordsByDate = dateDim.group();
	var genderGroup = genderDim.group();
	var ageSegmentGroup = ageSegmentDim.group();
	var userTypeGroup = userTypeDim.group();
	var all = ndx.groupAll();


	// define values (to be used in charts) to limit temporal extent
	var minDate = dateDim.bottom(1)[0]["starttime"];
	var maxDate = dateDim.top(1)[0]["starttime"];


	// create charts using d3 library
	// use bar and row charts
	var numberBlUEBikeTrips = dc.numberDisplay("#number-trips");
	// var averageTripDuration = dc.numberDisplay("#average_duration");
	var timeChart = dc.barChart("#time-chart");
	var genderChart = dc.rowChart("#gender-chart");
	var ageSegmentChart = dc.rowChart("#agesegment-chart");
	var userTypeChart = dc.rowChart("#usertype-chart");

	// get overall number of trips in selected time frame
	numberBlUEBikeTrips
	.formatNumber(d3.format("d"))
	.valueAccessor(function(d){return d; })
	.group(all);
	

	// define settings for time chart
	timeChart
	.width(650)
	.height(140)
	.margins({top: 10, right: 50, bottom: 20, left: 20})
	.dimension(dateDim)
	.group(numRecordsByDate)
	.transitionDuration(500)
	.x(d3.time.scale().domain([minDate, maxDate]))
	.elasticY(true)
	.yAxis().ticks(4);

	// define settings for gender chart
	genderChart
	.width(300)
	.height(100)
	.dimension(genderDim)
	.group(genderGroup)
	.ordering(function(d) { return -d.value })
	.colors(['#6baed6'])
	.elasticX(true)
	.xAxis().ticks(4);

	// define age segment chart settings
	ageSegmentChart
	.width(300)
	.height(150)
    .dimension(ageSegmentDim)
    .group(ageSegmentGroup)
    .colors(['#6baed6'])
    .elasticX(true)
    .labelOffsetY(10)
    .xAxis().ticks(4);

	userTypeChart
	.width(300)
	.height(310)
    .dimension(userTypeDim)
    .group(userTypeGroup)
    .ordering(function(d) { return -d.value })
    .colors(['#6baed6'])
    .elasticX(true)
    .xAxis().ticks(4);

	// leaflet map
	var map = L.map('leafletmap');

	var drawMap = function(){

		// set leaflet settings and center view to area of Boston, MA
		map.setView([42.36, -71.09], 5);
		
		// define basemap CartoDB Dark
		
		var CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
			subdomains: 'abcd',
			maxZoom: 19
		});
		CartoDB_DarkMatter.addTo(map);

		// bike trips heat map
		var geoData = [];
		_.each(allDim.top(Infinity), function (d) {
			geoData.push([d["latitude"], d["longitude"], 1]);
		});
		var heat = L.heatLayer(geoData,{
			radius: 10,
			blur: 20, 
			maxZoom: 1,
		}).addTo(map);

	};

	// Draw Map
	drawMap();

	// Update the leaflet map if any dc chart get filtered
	dcCharts = [timeChart, genderChart, ageSegmentChart, userTypeChart];

	_.each(dcCharts, function (dcChart) {
		dcChart.on("filtered", function (chart, filter) {
			map.eachLayer(function (layer) {
				map.removeLayer(layer)
			}); 
			drawMap();
		});
	});

	dc.renderAll();

};

