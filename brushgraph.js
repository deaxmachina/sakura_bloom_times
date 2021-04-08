
//////////////////////////////////////////////////////////
/////////////////////// Constants ///////////////////////
////////////////////////////////////////////////////////

// width and height of the whole svg
const width = 1400;
const height = 740;

// dimenstions of the top and bottom graph
const widthTopGraph = width;
const heightTopGraph = 520;
const widthBottomGraph = width; 
const heightBottomGraph = height - heightTopGraph;
const marginTopGraph = {top: 10, right: 70, bottom: 60, left: 100};
const marginBottomGraph = {top: 20, right: 20, bottom: 100, left: 10};

// colours 
const colors = [ '#8a2846', '#b9375e', '#e05780', '#ff7aa2', '#ffc2d4']
//const colors = ['#3fc1c0', '#20bac5', '#00b2ca', '#04a6c2', '#0899ba']
const whiteColour = "#fdfbf9";
const paleBlueColour = "#CAF3F6"
const sakuraFill = "#ea9ab2";
const sakuraStroke = "#e27396";

// petal paths - these are from Shirley Wu
const petalPaths = [
  'M0 0 C50 50 50 100 0 100 C-50 100 -50 50 0 0',
  'M-35 0 C-25 25 25 25 35 0 C50 25 25 75 0 100 C-25 75 -50 25 -35 0',
  'M0,0 C50,40 50,70 20,100 L0,85 L-20,100 C-50,70 -50,40 0,0',
  'M0 0 C50 25 50 75 0 100 C-50 75 -50 25 0 0',
]

// data accessors
const xAccessor = d => d['AD']
const yAccessor = d => d['Full-flowering date (DOY)']
const polynomialDegree = 'trendline_degree4';
const startYear = 1400;


/// SVG and main Group element ///
const svg = d3.select("#chart-wrapper")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
const g = svg.append("g")


///////////////////////////////////////////////////////////
/////////////////// Data Load from here ///////////////////
///////////////////////////////////////////////////////////

d3.csv("./data/sakura_bloom_data.csv", d3.autoType).then(d => {
  const data = d.filter(el => el.AD > 800); // all the data 
  let dataFiltered = data.filter(el => el.AD > startYear); // initial filtered data - brushed area and top graph

  /////////////////////////////////////
  //////////// Top Graph /////////////
  ///////////////////////////////////
  const scratterPlotGTopGraph = g.append("g").attr("class", 'scatterplot-g-top-graph')
  const xAxisContainer = g.append("g")
  const yAxisContainer = g.append("g")

  const yScaleTopGraph = d3.scaleLinear()
    .domain([d3.min(data, yAccessor)-0.1, d3.max(data, yAccessor)])
    .range([heightTopGraph - marginTopGraph.bottom, marginTopGraph.top])
    .nice()

  // Keep the y scale and axis outside the drawing function for the top graph 
  // this is beacuse we don't want the axis to change with the data but we want the 
  // extent to be determined by the whole data 
  const yAxisTopGraph = g => g
    .attr("transform", `translate(${marginTopGraph.left}, ${0})`)
    .call(d3.axisLeft(yScaleTopGraph).ticks(5).tickFormat(d => `${d}`))
    .call(g => g.selectAll(".tick").attr("color", paleBlueColour).attr("font-size", '11px'))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:nth-of-type(2n) text").clone()
      .attr("x", 3)
      .attr("text-anchor", "start")
      .text('end of March'))
    .call(g => g.select(".tick:nth-of-type(5n) text").clone()
      .attr("x", 3)
      .attr("text-anchor", "start")
      .text('end of April'))

  const yAxisLabelG = scratterPlotGTopGraph.append("g")
  constyAxisLabelText = yAxisLabelG
      .append("text")
      .attr("transform", `translate(50, 350)rotate(270)`)
      .attr("font-size", '16px')
      .attr("fill", paleBlueColour)
      .text("full flowering date as day of the year")

  // draw the graph in a function dependent on the filtered data as we will 
  // change the drawing later based on filtered data from the brush on the bottom graph
  // make sure the appended elements (g) happen outside the function
  const drawTopGraph = (dataFiltered) => {
    
    /// 1. Scales ///
    const xScaleTopGraph = d3.scaleLinear()
      .domain([d3.min(dataFiltered, xAccessor)-10, d3.max(dataFiltered, xAccessor)])
      .range([marginTopGraph.left, widthTopGraph - marginTopGraph.right])
  
    /// 2. Axes ///
    const xAxisTopGraph = g => g
      .attr("transform", `translate(${0}, ${heightTopGraph - marginTopGraph.bottom})`)
      .call(d3.axisBottom(xScaleTopGraph).ticks(5).tickFormat(d => `year ${d3.format("2")(d)}`).tickSizeOuter(0))
      .call(g => g.selectAll(".tick").attr("color", paleBlueColour).attr("font-size", '11px'))
      .call(g => g.select(".domain").attr("color", paleBlueColour))


    /// 3. Scatterplot ///
    // Containers for the scatterplot flowers
    const scratterPlotFlowerContainersTopGraph = scratterPlotGTopGraph
      .selectAll(".scatterplot-element-top-graph")
      .data(dataFiltered)
      .join("g")
      .classed('scatterplot-element-top-graph', true)
        .attr("transform", d => `translate(${xScaleTopGraph(xAccessor(d))}, ${yScaleTopGraph(yAccessor(d))})`)
    // Petals for each flower 
    const scatterPlotFlowersTopGraph = scratterPlotFlowerContainersTopGraph
      .selectAll(".petal-path-top-graph")
      .data(d3.range(5))
      .join("path")
        .classed("petal-path-top-graph", true)
        .attr("d", petalPaths[2])
        .attr("transform", (d, i) => `rotate(${i * (360 / 5)})scale(${0.18})`)
        .attr("fill", sakuraFill)
        .attr("fill-opacity", 0.45)
        .attr("stroke", sakuraStroke)
        .attr("stroke-opacity", 0.8)
        .attr("stroke-width", 3)

    /// 4. Line of best fit ///
    const lineTopGraph = d3.line(d => xScaleTopGraph(d['AD']), d => yScaleTopGraph(d[polynomialDegree]))
      .curve(d3.curveNatural);

    const lineGraphTop = g
      .selectAll(".path-top-graph")
      .data([dataFiltered])
      .join('path')
        .classed("path-top-graph", true)
        .attr("fill", "none")
        .attr("stroke", whiteColour)
        .attr("stroke-width", 4)
        .attr("stroke-opacity", 0.7)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", lineTopGraph)

    // call the axes 
    xAxisContainer.call(xAxisTopGraph)
    yAxisContainer.call(yAxisTopGraph)
  }
  // draw the initial view 
  drawTopGraph(dataFiltered)



  /////////////////////////////////////
  /////////// Bottom Graph ///////////
  ///////////////////////////////////

  /// Group element for the whole bottom graph /// 
  const scratterPlotGBottomGraph = g.append("g").attr("class", 'scatterplot-g-bottom-graph')

  /// 1. Background Rect ///
  scratterPlotGBottomGraph.append("rect")
    .attr("transform", `translate(${0}, ${heightTopGraph})`)
    .attr("width", widthBottomGraph)
    .attr("height", heightBottomGraph - marginBottomGraph.bottom)
    .attr("fill", whiteColour)
    .attr("opacity", 0.2)

  /// 2. Scales ///
    const xScaleBottomGraph = d3.scaleLinear()
    .domain([d3.min(data, xAccessor)-5, d3.max(data, xAccessor)])
    .range([marginBottomGraph.left, widthBottomGraph - marginBottomGraph.right])

  const yScaleBottomGraph = d3.scaleLinear()
    .domain([d3.min(data, yAccessor)-1, d3.max(data, yAccessor)])
    .range([heightTopGraph + heightBottomGraph - marginBottomGraph.bottom, heightTopGraph + marginBottomGraph.top])
    .nice()

  /// 3. Axes ///
  const xAxisBottomGraph = g => g
    .attr("transform", `translate(${0}, ${heightTopGraph + heightBottomGraph - marginBottomGraph.bottom})`)
    .call(d3.axisBottom(xScaleBottomGraph).ticks(10).tickFormat(d => `year ${d3.format("2")(d)}`).tickSizeOuter(0))
    .call(g => g.selectAll(".tick").attr("color", paleBlueColour).attr("font-size", '11px'))
    .call(g => g.select(".domain").attr("color", paleBlueColour))

  const yAxisBottomGraph = g => g
    .attr("transform", `translate(${marginBottomGraph.left}, ${0})`)
    .call(d3.axisLeft(yScaleBottomGraph).ticks(5).tickFormat(d => `${d} DOY`))
    .call(g => g.selectAll(".tick").attr("color", paleBlueColour))
    .call(g => g.select(".domain").remove())

  /// 4. Scatterplot ///
  // Containers for the scatterplot flowers
  const scratterPlotFlowerContainersBottomGraph = scratterPlotGBottomGraph
    .selectAll(".scatterplot-element-bottom-graph")
    .data(data)
    .join("g")
    .classed('scatterplot-element-bottom-graph', true)
      .attr("transform", d => `translate(${xScaleBottomGraph(xAccessor(d))}, ${yScaleBottomGraph(yAccessor(d))})`)
      .attr("fill", sakuraFill)
      .attr("fill-opacity", 0.45)

  // Petals for each scatterplot flower
  const scatterPlotFlowersBottomGraph = scratterPlotFlowerContainersBottomGraph
    .selectAll(".petal-path-bottom-graph")
    .data(d3.range(5))
    .join("path")
      .classed("petal-path-bottom-graph", true)
      .attr("d", petalPaths[2])
      .attr("transform", (d, i) => `rotate(${i * (360 / 5)})scale(${0.07})`)
      .attr("stroke", sakuraStroke)
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 2)

  /// 5. Line of best fit ///
  const lineBottom = d3.line(d => xScaleBottomGraph(d['AD']), d => yScaleBottomGraph(d[polynomialDegree]))
    .curve(d3.curveNatural);
  const lineGraphBottom = scratterPlotGBottomGraph.selectAll(".path-bottom-graph")
    .data([data])
    .join('path')
      .attr("class", "path-bottom-graph")
      .attr("fill", "none")
      .attr("stroke", whiteColour)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.8)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineBottom)

  // call the axes 
  scratterPlotGBottomGraph.append("g").call(xAxisBottomGraph)
  //scratterPlotGBottomGraph.append("g").call(yAxisBottomGraph)


  ///////////////////////////////////////
  /////////////// Brush  ///////////////
  //////////////////////////////////////

  const brushInstructions = scratterPlotGBottomGraph
  .append("text")
  .attr("y", heightTopGraph - 5)
  .attr("x", widthTopGraph - 200)
  .attr("font-size", '16px')
  .attr("fill", paleBlueColour)
  .attr("text-anchor", 'middle')
  .text("drag / expand or contract to change years selection")

  /// 1. Create the brush - whole width of the graph and from top to bottom of the bottom graph ///
  const brush = d3.brushX()
    .extent([
      [0, heightTopGraph], 
      [widthBottomGraph, heightTopGraph + heightBottomGraph - marginBottomGraph.bottom]
    ])
    .on("start brush end", brushed);
  /// 2. Call the brush - initial arrangement is between the years 1600 and 2021 /// 
  svg.append("g")
    .call(brush)
    .call(brush.move, [startYear, 2021].map(xScaleBottomGraph))

  /// 3. Define what happens when the brush is brushed /// 
  function brushed({selection}) {
    if (selection === null) {
      scratterPlotFlowerContainersBottomGraph.attr("fill", whiteColour);
    } else {
      // find the start and end of the brushed area 
      const [x0, x1] = selection.map(xScaleBottomGraph.invert) 
      // on the bottom graph, change the fill of the flowers inside the brushed area to be pink and else white
      scratterPlotFlowerContainersBottomGraph.attr('fill', d => (x0 < d.AD && d.AD <= x1) ? sakuraFill : whiteColour)
      // change the filtered data to the extent of the brush and call the function that draws the top graph based on data
      dataFiltered = data.filter(d => (x0 < d.AD && d.AD <= x1)); 
      drawTopGraph(dataFiltered)
    }
  }

})

