const MARGIN = { LEFT: 100, RIGHT: 100, TOP: 50, BOTTOM: 100 }
const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT
const HEIGHT = 500 - MARGIN.TOP - MARGIN.BOTTOM

const svg = d3.select("#chart-area").append("svg")
  .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
  .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)


let HighData = []
let LowData = []
let OpenData = []
let CloseData = []
let AjustedCloseData = []
let VolumeData = []

const g = svg.append("g")
  .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)

// time parsers/formatters
const parseDate = d3.timeParse("%Y-%m-%d")
const formatTime = d3.timeFormat("%Y-%m-%d")

$("#var-select").val()
$("#var-select").on("change", update)

/**
 * d3.bisect finds the position into which a given value can be inserted into a 
 * sorted array while maintaining sorted order. If the value already 
 * exists in the array, d3.bisect will find its position efficiently.
 * https://observablehq.com/@d3/d3-bisect
 */
const bisectDate = d3.bisector(d => d.date).left

// add the line for the first time
g.append("path")
	.attr("class", "line")
	.attr("fill", "none")
	.attr("stroke", "grey")
	.attr("stroke-width", "3px")

// axis labels
const xLabel = g.append("text")
	.attr("class", "x axisLabel")
	.attr("y", HEIGHT + 50)
	.attr("x", WIDTH / 2)
	.attr("font-size", "20px")
	.attr("text-anchor", "middle")
	.text("Years")
const yLabel = g.append("text")
	.attr("class", "y axisLabel")
	.attr("transform", "rotate(-90)")
	.attr("y", -80)
	.attr("x", -180)
	.attr("font-size", "20px")
	.attr("text-anchor", "middle")
	.text("Open")


// scales
const x = d3.scaleTime().range([0, WIDTH])
const y = d3.scaleLinear().range([HEIGHT, 0])

// axis generators
const xAxisCall = d3.axisBottom()
const yAxisCall = d3.axisLeft()
	.ticks(6)

// axis groups
const xAxis = g.append("g")
	.attr("class", "x axis")
	.attr("transform", `translate(0, ${HEIGHT})`)
const yAxis = g.append("g")
	.attr("class", "y axis")


// add jQuery UI slider
$("#date-slider").slider({
	range: true,
	max: parseDate("2022-11-22").getTime(),
	min: parseDate("1990-01-01").getTime(),
	step: 86400000, // one day
	values: [
		parseDate("1990-01-01").getTime(),
		parseDate("2022-11-22").getTime()
	],
	slide: (event, ui) => {
		$("#dateLabel1").text(formatTime(new Date(ui.values[0])))
		$("#dateLabel2").text(formatTime(new Date(ui.values[1])))
		update()
	}
})



d3.json("https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=AAPL&apikey=R6DXIM881UZRQGUU").then(data => {
	// prepare and clean data
	filteredData = []
	xValues = []
	yValues = []

	for (var key in data["Weekly Time Series"]){
		let test = parseDate(key)
		filteredData.push({date: test, y_val: Number(data['Weekly Time Series'][key]['1. open'])})
		HighData.push({date: test, y_val: Number(data['Weekly Time Series'][key]['2. high'])})
		LowData.push({date: test, y_val: Number(data['Weekly Time Series'][key]['3. low'])})
		VolumeData.push({date: test, y_val: Number(data['Weekly Time Series'][key]['5. volume'])})
		CloseData.push({date: test, y_val: Number(data['Weekly Time Series'][key]['4. close'])})
		OpenData.push({date: test, y_val: Number(data['Weekly Time Series'][key]['1. open'])})
		
	}

	console.log(filteredData)
	
	update()
	// run the visualization for the first time
	
})

function update() {
	const t = d3.transition().duration(1000)

	const yValue = $("#var-select").val()
	console.log(yValue)
	if (yValue == 'high') {
		console.log("dfskfdsjfhdsjfhdsf")
		filteredData = HighData
	}else if (yValue == 'volume') {
		console.log("ddfdfdfdfdf")
		filteredData = VolumeData
	} else if (yValue == 'open'){
		filteredData = OpenData
	}else if (yValue == 'close'){
		filteredData =  CloseData
	}else if(yValue == 'low'){
		filteredData = LowData
	}

	console.log(filteredData)


	const sliderValues = $("#date-slider").slider("values")
	console.log(sliderValues)
	const dataTimeFiltered = filteredData.filter(d => {
		return ((d.date >= sliderValues[0]) && (d.date <= sliderValues[1]))
	})

	// update scales
	x.domain(d3.extent(dataTimeFiltered, d => d.date))
	y.domain([
		d3.min(dataTimeFiltered, d => d.y_val) / 1.005, 
		d3.max(dataTimeFiltered, d => d.y_val) * 1.005
	])
	console.log(d3.min(dataTimeFiltered, d => d.y_val))
	console.log(d3.max(dataTimeFiltered, d => d.y_val))

	// update axes
	// const formatSi = d3.format(".2s")
	xAxisCall.scale(x)
	xAxis.transition(t).call(xAxisCall)
	yAxisCall.scale(y)
	yAxis.transition(t).call(yAxisCall)

	
	// clear old tooltips
	d3.select(".focus").remove()
	d3.select(".overlay").remove()

	RevArray = dataTimeFiltered.reverse()




	/******************************** Tooltip Code ********************************/

	const focus = g.append("g")
		.attr("class", "focus")
		.style("display", "none")

	focus.append("line")
		.attr("class", "x-hover-line hover-line")
		.attr("y1", 0)
		.attr("y2", HEIGHT)

	focus.append("line")
		.attr("class", "y-hover-line hover-line")
		.attr("x1", 0)
		.attr("x2", WIDTH)

	focus.append("circle")
		.attr("r", 7.5)

	focus.append("text")
		.attr("x", 15)
		.attr("dy", ".31em")

	g.append("rect")
		.attr("class", "overlay")
		.attr("width", WIDTH)
		.attr("height", HEIGHT)
		.on("mouseover", () => focus.style("display", null))
		.on("mouseout", () => focus.style("display", "none"))
		.on("mousemove", mousemove)

	function mousemove() {
		const x0 = x.invert(d3.mouse(this)[0])
		const i = bisectDate(RevArray, x0, 1)
		console.log(i)

		console.log(x0)
		const d0 = RevArray[i - 1]
		console.log(RevArray[49])
		let j = Number(i)
		const d1 = RevArray[i]
		console.log(d1)
		console.log(d0)
		const d = x0 - d0.date > d1.date - x0 ? d1 : d0
		console.log(d)
		focus.attr("transform", `translate(${x(d.date)}, ${y(d.y_val)})`)
		console.log(d[yValue])
		focus.select("text").text(d.y_val)
		focus.select(".x-hover-line").attr("y2", HEIGHT - y(d.y_val))
		focus.select(".y-hover-line").attr("x2", -x(d.date))
	}

	
	
	/******************************** Tooltip Code ********************************/
	
	// Path generator
	line = d3.line()
		.x(d => x(d.date))
		.y(d => y(d.y_val))

	// // Update our line path
	g.select(".line")
		.transition(t)
		.attr("d", line(dataTimeFiltered))

		// Update y-axis label
	const newText = (yValue === "high") ? "High" 
		: (yValue === "low") ? "Low" 
			: (yValue === "volume") ? "Volume"
				:(yValue === "open") ? "Open"
					:(yValue === "close") ? "Close"
						: " "

	yLabel.text(newText)


}

