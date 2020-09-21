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

	init: function () {
		this.root = {};
	},

	setRoot: function (root) {
		this.root = root;
	},

	getRoot: function () {
		return this.root;
	},

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

		// size of the diagram
		var viewerWidth = 800;
		var viewerHeight = 800;
		var padding = 0;
		//Draw a grid
		var numberOfTicks = 40;
		var sizeOfTicks = 20;

		var dragging = false,
			drawing = false,
			startPoint;
		var svg = d3.select("#" + this.sParentId).append("svg")
			.attr("height", viewerHeight)
			.attr("width", viewerWidth);



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
			.classed('y', true)
			.classed('grid', true)
			.call(yAxisGrid);

		svg.append("g")
			.classed('x', true)
			.classed('grid', true)
			.call(xAxisGrid);

		var points = [],
			g;
		// behaviors
		var dragger = d3.behavior.drag()
			.on('drag', handleDrag)
			.on('dragend', function (d) {
				dragging = false;
			});
		svg.on('mouseup', function () {
			if (dragging) return;
			drawing = true;
			startPoint = [round(d3.mouse(this)[0], sizeOfTicks), round(d3.mouse(this)[1], sizeOfTicks)];

			if (svg.select('g.drawPoly').empty()) g = svg.append('g').attr('class', 'drawPoly');
			if (d3.event.target.hasAttribute('is-handle')) {
				closePolygon();
				return;
			};

			points.push([startPoint[0], startPoint[1]]);
			g.select('polyline').remove();
			var polyline = g.append('polyline').attr('points', points)
				.style('fill', 'none')
				.attr('stroke', '#000');
			for (var i = 0; i < points.length; i++) {
				g.append('circle')
					.attr('cx', points[i][0])
					.attr('cy', points[i][1])
					.attr('r', 4)
					.attr('fill', 'yellow')
					.attr('stroke', '#000')
					.attr('is-handle', 'true')
					.style({
						cursor: 'pointer'
					});
			}
		});

		function round(num, pre) {
			return pre * Math.round(num / pre);
		}

		function closePolygon() {
			svg.select('g.drawPoly').remove();
			var g = svg.append('g');
			//g.append('polygon')
			g.append('polyline')
				.attr('points', points)
				.style('fill', getRandomColor());
			for (var i = 0; i < points.length; i++) {
				var circle = g.selectAll('circles')
					.data([points[i]])
					.enter()
					.append('circle')
					.attr('cx', points[i][0])
					.attr('cy', points[i][1])
					.attr('r', 4)
					.attr('fill', '#FDBC07')
					.attr('stroke', '#000')
					.attr('is-handle', 'true')
					.style({
						cursor: 'move'
					})
					.call(dragger);
			}
			points.splice(0);
			drawing = false;
		}
		svg.on('mousemove', function () {
			if (!drawing) return;
			var g = d3.select('g.drawPoly');
			g.select('line').remove();
			var line = g.append('line')
				.attr('x1', startPoint[0])
				.attr('y1', startPoint[1])
//				.attr('x2', d3.mouse(this)[0] + 2)
//				.attr('y2', d3.mouse(this)[1])
				.attr('x2', round(d3.mouse(this)[0], sizeOfTicks))
				.attr('y2', round(d3.mouse(this)[1], sizeOfTicks))
				.attr('stroke', '#53DBF3')
				.attr('stroke-width', 1);
		})

		function handleDrag() {
			if (drawing) return;
			var dragCircle = d3.select(this),
				newPoints = [],
				circle;
			dragging = true;
			var poly = d3.select(this.parentNode).select('polygon');
			var circles = d3.select(this.parentNode).selectAll('circle');
			dragCircle
				.attr('cx', d3.event.x)
				.attr('cy', d3.event.y);
			for (var i = 0; i < circles[0].length; i++) {
				circle = d3.select(circles[0][i]);
				newPoints.push([circle.attr('cx'), circle.attr('cy')]);
			}
			poly.attr('points', newPoints);
		}

		function getRandomColor() {
			var letters = '0123456789ABCDEF'.split('');
			var color = '#';
			for (var i = 0; i < 6; i++) {
				color += letters[Math.floor(Math.random() * 16)];
			}
			return color;
		}
	}
});