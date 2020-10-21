jQuery.sap.require("sap/ui/thirdparty/d3");
jQuery.sap.declare("sap.cc.PolylineDrawer");
sap.ui.core.Control.extend("sap.cc.PolylineDrawer", {

	constructor: function (oController) {
		// Call Super constructor
		sap.ui.core.Control.call(this);

		// Store View controller instance
		this.oController = oController;

	},

	create: function () {
		/*
		 * Called from renderer
		 */
		var oLayout = new sap.m.VBox({
			alignItems: sap.m.FlexAlignItems.Center,
			justifyContent: sap.m.FlexJustifyContent.Center
		});
		var oFlexBox = new sap.m.FlexBox({
			alignItems: sap.m.FlexAlignItems.Center
		});

		this.sParentId = oFlexBox.getIdForLabel();
		oLayout.addItem(oFlexBox);
		return oLayout;
	},

	init: function () {},

	renderer: function (oRm, oControl) {
		var layout = oControl.create();

		oRm.write("<div");
		oRm.writeControlData(layout);
		oRm.addClass("PolylineDrawer");
		oRm.writeClasses();
		oRm.write(">");
		oRm.renderControl(layout);
		oRm.addClass("verticalAlignment");
		oRm.write("</div>");
	},

	onAfterRendering: function () {
		var root = this.root;
		var oController = this.oController;
		var aPathPoints = [];

		// size of the diagram
		var viewerWidth = 1200;
		var viewerHeight = 1200;

		//Draw a grid
		var numberOfTicks = 120;
		var sizeOfTicks = 10;

		var dragging = false,
			drawing = false,
			startPoint,
			startPointPrev;

		var svg = d3.select("#" + this.sParentId).append("svg")
			.attr("height", viewerHeight)
			.attr("width", viewerWidth);

		//Background image
		var myimage = svg.append("image")
			.attr("xlink:href", "./images/MapGarden.png")
			.attr("width", viewerWidth)
			.attr("height", viewerHeight)

		myimage.attr("x", 0);
		myimage.attr("y", -300);

		// create scale functions
		var xScale = d3.scale.linear()
			.domain([0, viewerHeight])
			.range([0, viewerWidth]);

		var yScale = d3.scale.linear()
			.domain([0, viewerWidth])
			.range([viewerHeight, 0]);

		//define X axis
		var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.ticks(numberOfTicks)
			.tickSize(-viewerHeight, 0, 0);

		//Define Y axis
		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.ticks(numberOfTicks)
			.tickSize(-viewerWidth, 0, 0);

		var yAxisGrid = yAxis.ticks(numberOfTicks)
			.tickSize(viewerWidth, 0)
			.tickFormat("")
			.orient("right");

		var xAxisGrid = xAxis.ticks(numberOfTicks)
			.tickSize(-viewerHeight, 0)
			.tickFormat("")
			.orient("top");

		svg.append("g")
			.classed("y", true)
			.classed("grid", true)
			.call(yAxisGrid);

		svg.append("g")
			.classed("x", true)
			.classed("grid", true)
			.call(xAxisGrid);

		var points = [],
			g;
		// behaviors
		var dragger = d3.behavior.drag()
			.on("drag", handleDrag)
			.on("dragend", function (d) {
				dragging = false;
			});
		svg.on("mouseup", function () {
			if (dragging) return;
			//Remove previous drawing when starting a new one
			if (!drawing) {
				svg.select("g.drawPoly").remove();
				startPoint = [];
				startPointPrev = [];
			}
			drawing = true;
			startPointPrev = startPoint;
			startPoint = [round(d3.mouse(this)[0], sizeOfTicks), round(d3.mouse(this)[1], sizeOfTicks)];

			if ((startPointPrev.length !== 0) && (startPoint.length !== 0)) {
				if ((startPointPrev[0] !== startPoint[0]) &&
					(startPointPrev[1] !== startPoint[1])) {
					startPoint = startPointPrev;
					startPointPrev = [];
					sap.m.MessageToast.show("Wrong position");
					return;
				}
			}

			if (svg.select("g.drawPoly").empty()) g = svg.append("g").attr("class", "drawPoly");

			points.push([startPoint[0], startPoint[1]]);
			g.select("polyline").remove();
			//svg.select("g.drawPoly").remove();
			var polyline = g.append("polyline").attr("points", points)
				.style("fill", "none")
				.attr("stroke", "#ff9900")
				.attr("stroke-width", "5");
			for (var i = 0; i < points.length; i++) {
				g.append("circle")
					.attr("cx", points[i][0])
					.attr("cy", points[i][1])
					.attr("r", 4)
					.attr("fill", "yellow")
					.attr("stroke", "#000")
					.attr("is-handle", "true")
					.style({
						cursor: "pointer"
					});
			}

			if (d3.event.target.hasAttribute("is-handle")) {
				closePolygon();
				return;
			}
		});

		function round(num, pre) {
			return pre * Math.round(num / pre);
		}

		function closePolygon() {
			// svg.select("g.drawPoly").remove();
			// var g = svg.append("g");
			// g.append("polygon")
			// 	.attr("points", points)
			// 	.style("fill", getRandomColor());
			// for (var i = 0; i < points.length; i++) {
			// 	var circle = g.selectAll("circles")
			// 		.data([points[i]])
			// 		.enter()
			// 		.append("circle")
			// 		.attr("cx", points[i][0])
			// 		.attr("cy", points[i][1])
			// 		.attr("r", 4)
			// 		.attr("fill", "#FDBC07")
			// 		.attr("stroke", "#000")
			// 		.attr("is-handle", "true")
			// 		.style({
			// 			cursor: "move"
			// 		})
			// 		.call(dragger);
			// }

			//Save points globally
			aPathPoints = [...points];
			points.splice(0);
			drawing = false;
		}
		svg.on("mousemove", function () {
			if (!drawing) return;
			var g = d3.select("g.drawPoly");
			g.select("line").remove();
			var line = g.append("line")
				.attr("x1", startPoint[0])
				.attr("y1", startPoint[1])
				//				.attr("x2", d3.mouse(this)[0] + 2)
				//				.attr("y2", d3.mouse(this)[1])
				.attr("x2", round(d3.mouse(this)[0], sizeOfTicks))
				.attr("y2", round(d3.mouse(this)[1], sizeOfTicks))
				.attr("stroke", "#53DBF3")
				.attr("stroke-width", 1);
		});

		function handleDrag() {
			if (drawing) return;
			var dragCircle = d3.select(this),
				newPoints = [],
				circle;
			dragging = true;
			var poly = d3.select(this.parentNode).select("polygon");
			var circles = d3.select(this.parentNode).selectAll("circle");
			dragCircle
				.attr("cx", d3.event.x)
				.attr("cy", d3.event.y);
			for (var i = 0; i < circles[0].length; i++) {
				circle = d3.select(circles[0][i]);
				newPoints.push([circle.attr("cx"), circle.attr("cy")]);
			}
			poly.attr("points", newPoints);
		}

		function getRandomColor() {
			var letters = "0123456789ABCDEF".split("");
			var color = "#";
			for (var i = 0; i < 6; i++) {
				color += letters[Math.floor(Math.random() * 16)];
			}
			return color;
		}

		function checkDirection(sDirectionNow, sDirectionNew) {
			if ((!sDirectionNow) || (!sDirectionNew)) {
				return;
			}

			//Check direction
			switch (sDirectionNew) {
			case "N":
				switch (sDirectionNow) {
				case "N":
					//No turn needed
					break;
				case "E":
					return "Turn 90° left";
					break;
				case "S":
					return "Turn 180° right";
					break;
				case "W":
					return "Turn 90° right";
					break;
				default:
					//Raise error
				}
				break;

			case "E":
				switch (sDirectionNow) {
				case "N":
					return "Turn 90° right";
					break;
				case "E":
					//No turn needed
					break;
				case "S":
					return "Turn 90° left";
					break;
				case "W":
					return "Turn 180° right";
					break;
				default:
					//Raise error
				}
				break;

			case "S":
				switch (sDirectionNow) {
				case "N":
					return "Turn 180° right";
					break;
				case "E":
					return "Turn 90° right";
					break;
				case "S":
					//No turn needed
					break;
				case "W":
					return "Turn 90° left";
					break;
				default:
					//Raise error
				}
				break;

			case "W":

				switch (sDirectionNow) {
				case "N":
					return "Turn 90° left";
					break;
				case "E":
					return "Turn 180° right";
					break;
				case "S":
					return "Turn 90° right";
					break;
				case "W":
					//No turn needed
					break;
				default:
					//Raise error
				}
				break;
			default:
				//Raise error
			}
		}

		function calcRoute() {
			var aPointNext;
			var aPointNow;
			var xNow;
			var xNext;
			var yNow;
			var yNext;
			var sMove = "";
			var sMoveDirection = "";
			var iSteps = 0;
			var iNext = 0;
			var sDirection = "";
			var sDirectionNew = "";

			for (var i = 0; i < aPathPoints.length; i++) {
				//Set actual point
				aPointNow = aPathPoints[i];

				//Calc index for next point
				iNext = i + 1;
				if (iNext === aPathPoints.length) {
					//Done
					sMove = sMove + "Target reached";
					continue;
				}

				//Set next point
				aPointNext = aPathPoints[iNext];

				//Set Points 
				xNow = aPointNow[0];
				yNow = aPointNow[1];
				xNext = aPointNext[0];
				yNext = aPointNext[1];
				
				//Skip if no movement
				if ((xNow === xNext) && (yNow === yNext)) {
					//No Movement
					continue;
				}
				
				//Check movement
				if ((xNow < xNext) && (yNow === yNext)) {
					//Set new direction
					sDirectionNew = "E";
					
					//Check direction
					sMoveDirection = checkDirection(sDirection, sDirectionNew);
					if (sMoveDirection){
						sMove = sMove + sMoveDirection;
					}

					//Set actual direction
					sDirection = sDirectionNew;
					sDirectionNew = "";

					//Forward
					iSteps = (xNext - xNow) / sizeOfTicks;
					sMove = sMove + "Forward:" + iSteps;
				}
				if ((xNow > xNext) && (yNow === yNext)) {
					//Set new direction
					sDirectionNew = "W";
					
					//Check direction
					sMoveDirection = checkDirection(sDirection, sDirectionNew);
					if (sMoveDirection){
						sMove = sMove + sMoveDirection;
					}

					//Set actual direction
					sDirection = sDirectionNew;
					sDirectionNew = "";

					//Forward
					iSteps = (xNow - xNext) / sizeOfTicks;
					sMove = sMove + "Forward:" + iSteps;

				}
				if ((xNow === xNext) && (yNow < yNext)) {
					//Set new direction
					sDirectionNew = "S";
					
					//Check direction
					sMoveDirection = checkDirection(sDirection, sDirectionNew);
					if (sMoveDirection){
						sMove = sMove + sMoveDirection;
					}

					//Set actual direction
					sDirection = sDirectionNew;
					sDirectionNew = "";

					//Forward
					iSteps = (yNext - yNow) / sizeOfTicks;
					sMove = sMove + "Forward:" + iSteps;

				}
				if ((xNow === xNext) && (yNow > yNext)) {
					//Set new direction
					sDirectionNew = "N";
					
					//Check direction
					sMoveDirection = checkDirection(sDirection, sDirectionNew);
					if (sMoveDirection){
						sMove = sMove + sMoveDirection;
					}

					//Set actual direction
					sDirection = sDirectionNew;
					sDirectionNew = "";

					//Forward
					iSteps = (yNow - yNext) / sizeOfTicks;
					sMove = sMove + "Forward:" + iSteps;
				}
			}
			return sMove;
		}
		//Set function public
		this.calcRoute = calcRoute;
	}

});