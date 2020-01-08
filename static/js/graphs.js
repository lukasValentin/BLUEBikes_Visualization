//this is the script where the interactive graphs for the assignment are generated including the leaflet map
//adopted from an example provided by http://adilmoujahid.com//posts/2016/08/interactive-data-visualization-geospatial-d3-dc-leaflet-python/
//for the BLUEBikes dataset

tripsDataURL = "https://raw.githubusercontent.com/lukasValentin/BLUEBikes_Visualization/master/sampleData/BLUEBikes.json";

//query JSON data using Ajax/HTTP GET
var jsonTripsData = $.ajax({
	data: {get_param: 'value'},
	url: tripsDataURL,
	dataType: "json",
	success: function (data) {
		
		// filter json by date range between start and end date
		var startDate = document.getElementById("startDate").value;
		// construct a timestamp from the user defined dates - always start and end at midnight
		var startTime = new Date(startDate.concat('T00:00:00Z'));
		var endDate = document.getElementById("endDate").value;
		var endTime = new Date(endDate.concat('T23:59:59Z'))
		
		// filter json data between start and end time
		var resultData = data.filter(function (a) {
			var times = a.starttime || {};
			// extract all date strings
			hitTimes = Object.keys(times);
			// convert strings to Date objects
			hitDates = Object.values(times);
			hitTimeMatchExists = hitDates.some(function(dateStr) {
				var date = new Date(dateStr);
				return date >= startTime && date <= endTime
			});
			return hitTimeMatchExists;
		});
		if (resultData != null) {
			// call makeGraphs
			console.log(resultData);
			makeGraphs(resultData);
		} else {
			alert("Didn't found any date for the time you specified")
		}
		
	}
});

//define graphs
var makeGraphs = function(recordsJson) {

	// clean data
	var records = recordsJson;
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
	var ageSegmentDim = ndx.dimension(function(d) { return d["age_segment"]; });	// age segments
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
	var averageTripDuration = dc.numberDisplay("#average_duration");
	var timeChart = dc.barChart("#time-chart");
	var genderChart = dc.rowChart("#gender-chart");
	var ageSegmentChart = dc.rowChart("#agesegment-chart");
	var userTypeChart = dc.barChart("#usertype-chart");

	// get overall number of trips in selected time frame
	numberBlUEBikeTrips
	.formatNumber(d3.format("d"))
	.valueAccessor(function(d){return d; })
	.group(all);
	
	// get average trip duration in selected time frame
	averageTripDuration
	.formatNumber(d3.format("d"))
	.valueAccessor(function(d){
		// caculate the mean value
		var total = 0.;
		for (var i = 0; i < d.length; i++) {
	        total += d[i];
	    }
	    return total / d.length;
	})

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
	.ordering(function(d) { return -d.value })
	.colors(['#6baed6'])
	.elasticX(true)
	.labelOffsetY(10)
	.xAxis().ticks(4);

	// define usertype chart settings
	userTypeChart
	.width(300)
	.height(310)
	.dimension(userTypeDim)
	.group(userTypeDim)
	.ordering(function(d) { return -d.value })
	.colors(['#6baed6'])
	.elasticX(true)
	.xAxis().ticks(4);


	// leaflet map
	var map = L.map('leafletmap');

	var drawMap = function(){

		// set leaflet settings and center view to area of Boston, MA
		map.setView([42.36, -71.09], 5);
		
		// define basemaps (OSM and CartoDB Dark)
		osmLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
		var OSM = L.tileLayer(
				'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; ' + osmLink + ' Contributors',
					maxZoom: 15,
				});
		OSM.addTo(map);
		
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
		
		// add a scale bar
		L.control.scale().addTo(map);
		
		// add layer control
		var baseMaps = {
				"OSM" : OSM,
				"CartoDB Dark" : CartoDB_DarkMatter
		};
		var overlayMaps = {
				"Trips Heatmap" : heat
		};
		layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);


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

