// set the dimensions and margins of the first bar chart
var margin = {top: 40, right: 40, bottom: 50, left: 160},
    width = 800 - margin.left - margin.right,
    height =300 - margin.top - margin.bottom;

// set the ranges for the first bar chart
var y = d3.scaleBand()
          .range([height, 0], .1)
          .padding(0.1);
var x = d3.scaleLinear()
          .range([0, width]);
          

// get the data
d3.csv("unhcr_persons_of_concern.csv", function(error, data) {
    if (error) throw error;

    data.forEach(function(d) {
  	    d.Origin = d.Origin
  	    // Rename some of the origin countries to shorter names (for readability)
  	    if(d.Origin == "Serbia and Kosovo (S/RES/1244 (1999))") {
  	    	d.Origin = "Serbia and Kosovo"
  	    }
  	    if(d.Origin == "Iran (Islamic Rep. of)") {
  	    	d.Origin = "Iran"
  	    }
	    d.Year = +d.Year
	    d["Refugees (incl. refugee-like situations)"] = +d["Refugees (incl. refugee-like situations)"]
    })

	var yearlyOriginRefugeeData = d3.nest()
	    .key(function(d) {return d.Year;})
	    .key(function(d) {return d.Origin;})
	    .rollup(function(v) {return d3.sum(v, function(d) {return d["Refugees (incl. refugee-like situations)"];})})
	    .entries(data)

	var hosts = ["Denmark","Germany","United Kingdom","Sweden","Netherlands"];

	// List of years in the data.
	var year_list = [];
	for (var xx of yearlyOriginRefugeeData) {
		year_list.push(xx.key);
	}

	// Add the selection dropbox and populate it with the list of years.
	var select = d3.select('body')
 				   .append('select')
 			       .attr('class','select')
 				   .on('change',onchange)

	var options = select
  				.selectAll('option')
				.data(year_list).enter()
				.append('option')
				.text(function (d) { return d; });

	// Method called whenever the selection in the dropdown changes.
	function onchange() {
		yearSelected = d3.select('select').property('value');
		console.log(yearSelected);

		// Remove existing chart components and add both the charts for the given year.
		d3.select("body").selectAll("svg").remove();
		makeChart1(yearSelected);
		makeChart2(yearSelected);
	}

	// Makes the first bar chart.
	function makeChart1(year) {
		for(var v of yearlyOriginRefugeeData) {
			if (v.key != year) {
				continue;
			}

			var countries = v.values

    	    y.domain(countries.map(function(d) { return d.key; }));
    	    x.domain([0, d3.max(countries, function(d) { return d.value; })]);

			// Add an svg object to the body of the page.
			var svg = d3.select("body").append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			    .append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			// Append the rectangles for the bar chart
			svg.selectAll(".bar")
 			   .data(countries)
 			   .enter().append("rect")
	    	   .attr("class", "bar")
	    	   .attr("fill", "steelblue")
  			   .attr("y", function(d) { return y(d.key) + 5; })
  			   .attr("height", 10)
  			   .attr("x", 0)
   			   .attr("width", function(d) { return x(d.value);});

			// Add the X Axis
		   	svg.append("g")
  			   .attr("transform", "translate(0," + height + ")")
  	 		   .call(d3.axisBottom(x));

  	 		// Add the label for the X Axis
  			svg.append("text")             
      		   .attr("transform", "translate(" + (width/2) + " ," + 
                           (height + margin.top) + ")")
      		   .style("text-anchor", "middle")
      		   .text("Total Number of Refugees");

  	 		// Add the Y Axis
		   	svg.append("g")
  	 		   .call(d3.axisLeft(y));

  	 		// Add the label for the Y Axis
		    svg.append("text")
		      .attr("transform", "rotate(-90)")
		      .attr("y", 0 - margin.left)
		      .attr("x",0 - (height / 2))
		      .attr("dy", "0.75em")
		      .style("text-anchor", "middle")
		      .text("Country of Origin"); 

		    // Add the label for the chart's heading
		    svg.append("text")
		        .attr("x", 0 - 30)             
		        .attr("y", 0 - (margin.top / 2))
		        .attr("text-anchor", "middle")  
		        .style("font-size", "16px") 
		        .style("text-decoration", "underline")  
		        .text("Cumulative data for origin countries");
  	    }
	}

	// Makes the second grouped bar chart.
	function makeChart2(year) {
		var yearlyData = data.filter(function(row) {
			return +row['Year'] == year;
		})

		var refinedData = yearlyData.filter(function(row) {
			return row['Country / territory of asylum/residence'] == "Denmark" ||
			       row['Country / territory of asylum/residence'] == "Sweden" ||
			       row['Country / territory of asylum/residence'] == "Netherlands" ||
			       row['Country / territory of asylum/residence'] == "United Kingdom" ||
			       row['Country / territory of asylum/residence'] == "Germany";
		})

		var groupedData = d3.nest()
			    .key(function(d) {return d.Origin;})
			    .key(function(d) {return d['Country / territory of asylum/residence'];})
			    .rollup(function(v) {return d3.sum(v, function(d) {return d["Refugees (incl. refugee-like situations)"];})})
	 		    .entries(refinedData)

	    // Segregate data as {origin: [<list of origin countries>], series: [{label: <host>, values: <comma separated refugee population values
	    // for corresponding origin country>}, {}, {}]
	    var data_seg = {}
	    data_seg['origin'] = []
	    groupedData.forEach(function(d) { data_seg['origin'].push(d.key);})

	    data_seg['series'] = []
	    for (var host of hosts) {
	    	var temp = {}
	    	temp['label'] = host
	    	temp['values'] = []
	    	for (var origin of data_seg['origin']) {
	    		var pop = 0
	    		for (var xx of groupedData) {
	    			if (xx.key != origin) {
	    				continue;
	    			}

	    			for (var val of xx.values) {
	    				if (val.key != host) {
	    					continue;
	    				}

	    				pop = val.value;
	    				break;
	    			}
	    			break;
	    		}
	    		temp['values'].push(pop);
	    	}
	    	data_seg['series'].push(temp);
	    }

		var chartWidth       = 800,
		    barHeight        = 10,
		    groupHeight      = barHeight * data_seg.series.length,
		    gapBetweenGroups = 10,
		    spaceForLabels   = 200,
		    spaceForLegend   = 180;

		// Zip the series data together (first values, second values, etc.)
		var allData = [];
		for (var i=0; i<data_seg.origin.length; i++) {
		  for (var j=0; j<data_seg.series.length; j++) {
		    allData.push(data_seg.series[j].values[i]);
		  }
		}

		// Color scale
		var color = d3.scaleOrdinal(d3.schemeCategory20);
		var chartHeight = barHeight * allData.length + gapBetweenGroups * data_seg.origin.length;

		var x = d3.scaleLinear()
		         .domain([0, d3.max(allData)])
		         .range([0, chartWidth ]);

		var y = d3.scaleBand()
                  .range([chartHeight + gapBetweenGroups, 0], .1)
                  .padding(0.1);

		var yAxis = d3.axisLeft(y).tickFormat("");

		var svg = d3.select("body").append("svg")
			        .attr("width", width + margin.left + margin.right)
			        .append("g")
			        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		svg.append("text") 
		   .attr("x", -80)
		   .style("font-size", "16px") 
		   .style("text-decoration", "underline")  
		   .html("<br/><br/>Refugee data for top 5 countries (#Shelter Provided)");

		// Specify the chart area and dimensions.
		var chart = d3.select("body").append("svg")
		              .attr("width", spaceForLabels + chartWidth + spaceForLegend)
		              .attr("height", chartHeight + 80);

		// Create bars.
		var bar = chart.selectAll("g")
		               .data(allData)
				       .enter().append("g")
				       .attr("transform", function(d, i) {
				               return "translate(" + spaceForLabels + "," + (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i/data_seg.series.length))) + ")";
				             })
				       .attr("width", function(d) { return x(d.value);})
				       .attr("x", 0);

		// Create rectangles in the bar chart.
		bar.append("rect")
		    .attr("fill", function(d,i) { return color(i % data_seg.series.length); })
		    .attr("class", "bar")
		    .attr("width", x)
		    .attr("height", barHeight - 1);

		// Labels.
		bar.append("text")
		    .attr("class", "label")
		    .attr("x", function(d) { return - 100; })
		    .attr("y", groupHeight / 2)
		    .attr("dy", ".35em")
		    .attr("font-size", "12px")
		    .text(function(d,i) {
		      if (i % data_seg.series.length === 0)
		        return data_seg.origin[Math.floor(i/data_seg.series.length)];
		      else
		        return ""});

		// Add the X Axis
		chart.append("g")
  			 .attr("transform", "translate(" + spaceForLabels + ", " + chartHeight + ")")
  	 		 .call(d3.axisBottom(x));

  	 	// Add the label for the X Axis.
  		chart.append("text")             
      		 .attr("transform", "translate(" + (chartWidth - 20) + " ," + 
                           (chartHeight + margin.top) + ")")
      		 .style("text-anchor", "middle")
      		 .text("Total Number of Refugees");

  	 	// Add the Y Axis
		chart.append("g")
  	 		 .call(yAxis)
  	 		 .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups/2 + ")");

  	 	// Add the text label for the Y Axis
		chart.append("text")
		     .attr("transform", "rotate(-90)")
		     .attr("y", 0 - chartHeight / 2)
		     .attr("x", 0 - 50)
		     .attr("dy", "0.35em")
		     .style("text-anchor", "middle")
		     .text("Country of Origin"); 

		// Add the Legend for the groups.
		var legendRectSize = 18,
		    legendSpacing  = 4;

		var legend = chart.selectAll('.legend')
		    .data(data_seg.series)
		    .enter()
		    .append('g')
		    .attr('transform', function (d, i) {
		        var height = legendRectSize + legendSpacing;
		        var offset = -gapBetweenGroups/2;
		        var horz = spaceForLabels + chartWidth - legendRectSize;
		        var vert = i * height - offset;
		        return 'translate(' + horz + ',' + vert + ')';
		    });

		legend.append('rect')
		    .attr('width', legendRectSize)
		    .attr('height', legendRectSize)
		    .style('fill', function (d, i) { return color(i); })
		    .style('stroke', function (d, i) { return color(i); });

		legend.append('text')
		    .attr('class', 'legend')
		    .attr('x', legendRectSize + legendSpacing)
		    .attr('y', legendRectSize - legendSpacing)
		    .text(function (d) { return d.label; });
	}
});