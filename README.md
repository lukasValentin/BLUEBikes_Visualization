# BLUEBikes_Visualization
Dashboard based Visualization of Boston BLUEBikes Trips Data using D3 and Leaflet JS libraries

The dashboard was strongly inspired by [Adil Moujahid work](https://github.com/adilmoujahid/kaggle-talkingdata-visualization) and re-uses parts of the repository in adopted way for plotting and mapping the data. The way the data is parsed and processed, however, was developed independently from his work as well as the possibility to switch between two **sample datasets**.

## Overview
Using this dashboard, it is possible to visualize and analyze trip data provided by [BLUEBikes](https://www.bluebikes.com/) in space and time. In addition to a heat map that shows where a particularly large number of trips took place, information about the users (age, gender, temporal distribution of trips over the day, and average trip duration) is displayed using diagrams. [Leaflet](https://leafletjs.com/) and [D3](https://d3js.org/) are used for this. The trip data is made [publicly available](https://www.bluebikes.com/system-data) by BLUEBikes for (scientific) analysis via Amazon Web Services.

Two sample datasets are available by default:

- one dataset covering a typical weekday
- one dataset covering a typical weekend day

## How it works
To use the example shown here, all you need to do is clone the repository and then open the [html](https://github.com/lukasValentin/BLUEBikes_Visualization/blob/master/BLUEBikesDashboard.html) in root with a common web browser. The data for the example is provided as JSON via [Github](https://raw.githubusercontent.com/lukasValentin/BLUEBikes_Visualization/master/sampleData/BLUEBikes.json) and read in accordingly. The data was downloaded from BLUEBikes for October 2019 and pre-processed using [this Python](https://github.com/lukasValentin/BLUEBikes_Visualization/blob/master/sampleData/prepare_bluebikes_tripsdata.py) script. Incomplete entries were removed and only the relevant data (age, gender, user type, start time, geographic positions and trip duration) were kept and stored as JSON. Then only **one day** is exported by the script to JSON since larger amounts of data cause the browser to fail loading the page. Therefore, the two sample datasets only cover one day each.

However, it is also **`possible to call up the dashboard with other data`**. To do this, simply alter the download link to customize BLUEBikes (about another month) in the [Python script](https://github.com/lukasValentin/BLUEBikes_Visualization/blob/master/sampleData/prepare_bluebikes_tripsdata.py) and host the JSON document on any server so that it is accessible via the Internet. Then adjust the URL in the [Javascript](https://github.com/lukasValentin/BLUEBikes_Visualization/blob/master/static/js/graphs.js) and the `**div-togle**`element in the [HTML file](https://github.com/lukasValentin/BLUEBikes_Visualization/blob/master/BLUEBikesDashboard.html).

Concurrently, there is still an **issue** with the leaflet map container that cannot be updated automatically right now. Therefore, each day has its own leaflet container.

