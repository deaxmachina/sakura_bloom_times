
//////////////////////////////////////////////////
/////////////////// Constants ////////////////////
//////////////////////////////////////////////////

const width = 1400;
const height = 680 //700;
const margin = {top: 100, right: 20, bottom: 40, left: 60};
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const gradientWidth = 800;
const gradientHeight = 700;
const colors = [ '#8a2846', '#b9375e', '#e05780', '#ff7aa2', '#ffc2d4']
//const colors = ['#3fc1c0', '#20bac5', '#00b2ca', '#04a6c2', '#0899ba']
const whiteColour = "#fdfbf9"
// only need the petal path for the sakura flower but leave the others in 
// these are from Shirley Wu
const petalPaths = [
  'M0 0 C50 50 50 100 0 100 C-50 100 -50 50 0 0',
  'M-35 0 C-25 25 25 25 35 0 C50 25 25 75 0 100 C-25 75 -50 25 -35 0',
  'M0,0 C50,40 50,70 20,100 L0,85 L-20,100 C-50,70 -50,40 0,0',
  'M0 0 C50 25 50 75 0 100 C-50 75 -50 25 0 0',
]
// data accessors
const xAccessor = d => d['AD']
const yAccessor = d => d['Full-flowering date (DOY)']


/// SVG and main Group element ///
const svg = d3.select("#chart-wrapper")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
const g = svg.append("g")

/// Background gradients ///
const defs = g.append("defs")
// Create the gradient 
createGradient = function(defs) {
  let gradient = defs.append("linearGradient")
		.attr("id", "colour-gradient")
		.attr("gradientUnits", "userSpaceOnUse") 
		.attr("x1", 0)
		.attr("x2", 1)
    .attr("y1", height - margin.bottom - 100)  
    .attr("y2", margin.top)
  	
  gradient
    .selectAll("stop") 
		.data(colors)                  
		.join("stop") 
		  .attr("offset", (d, i) => `${i/(colors.length-1) * 100}%`)   
		  .attr("stop-color", d => d)
}
createGradient(defs)

/*
g.append("rect")
  .attr("width", 600)
  .attr("height", 700)
  .style("fill", "url(#colour-gradient)")
g.selectAll("circle")
  .data([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  .join("circle")
  .attr("cy", (d, i) => i*70)
  .attr("cx", 300)
  .attr('r', 30)
  .style("fill", "url(#colour-gradient)")
*/


///////////////////////////////////////////////////////////
/////////////////// Data Load from here ///////////////////
///////////////////////////////////////////////////////////

d3.csv("./data/sakura_bloom_data.csv", d3.autoType).then(d => {
  const data = d.filter(el => el.AD > 1200); 
  console.log(data)
  const scratterPlotG = g.append("g").attr("class", 'scatterplot-g')

  /// 2. Scales ///
  const xScale = d3.scaleLinear()
    .domain([d3.min(data, xAccessor)-10, d3.max(data, xAccessor)])
    .range([margin.left, width - margin.right])
  const yScale = d3.scaleLinear()
    .domain([d3.min(data, yAccessor)-1, d3.max(data, yAccessor)])
    .range([height - margin.bottom, margin.top])
    .nice()

  /// 3. Axes ///
  const xAxis = g => g
    .attr("transform", `translate(${0}, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("2")).tickSizeOuter(0))
    .call(g => g.selectAll(".tick").attr("color", whiteColour))
    .call(g => g.select(".domain").attr("color", whiteColour))

  const yAxis = g => g
    .attr("transform", `translate(${margin.left}, ${0})`)
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d} days`))
    .call(g => g.selectAll(".tick").attr("color", whiteColour))
    .call(g => g.select(".domain").remove())
 

  /// 4. Scatterplot ///

  /* scatterplot background as a rect
  scratterPlotG.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "url(#colour-gradient)")
    .style("opacity", 0.8)
  */


  // Containers for the scatterplot flowers
  const scratterPlotFlowerContainers = scratterPlotG
    .selectAll(".scatterplot-element")
    .data(data)
    .join("g")
    .classed('scatterplot-element', true)
      .attr("transform", d => `translate(${xScale(xAccessor(d))}, ${yScale(yAccessor(d))})`)

  // if you were doing a scatterplot instead - make sure to comment out the translation in the groups 
  /*
  scratterPlotFlowerContainers.append("circle")
    .classed('scatterplot-circle', true)
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 10)
      .style("fill", "url(#colour-gradient)")
      .attr("opacity", 0.7)
  */
  
  const scatterPlotFlowers = scratterPlotFlowerContainers
    .selectAll(".petal-path")
    .data(d3.range(5))
    .join("path")
      .classed("petal-path", true)
      .attr("d", petalPaths[2])
      .attr("transform", (d, i) => `rotate(${i * (360 / 5)})scale(${0.18})`)
      .attr("fill", "#ea9ab2")
      .attr("fill-opacity", 0.45)
      .attr("stroke", "#e27396")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 3)


  // line of best fit 
  const line = d3.line(d => xScale(d['AD']), d => yScale(d['trendline_degree4']))
    .curve(d3.curveNatural);

  const lineGraph = scratterPlotG.selectAll(".path")
    .data([data])
    .join('path')
      .attr("class", "path")
      .attr("fill", "none")
      .attr("stroke", whiteColour)
      .attr("stroke-width", 4)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line)


  // call the axes 
  const gx = scratterPlotG.append("g").call(xAxis)
  const gy = scratterPlotG.append("g").call(yAxis)

  /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////


})


