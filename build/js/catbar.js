//build the category bar chart

export default function catbar(url){
	
	var wrap = d3.select("#cat-bar").style("width","100%").style("min-height","100px").append("div").style("padding","1em").append("div");
	var svg = wrap.append("svg").attr("width","100%").style("overflow","visible");

	var g_share = svg.append("g");
	var g_change = svg.append("g");
	var g_accel = svg.append("g");

	var title = svg.append("text").text("Which cleantech categories...").attr("x","50%").attr("y",20)
	.style("font-weight","bold")
	.style("font-style","italic")
	.attr("text-anchor","middle");

	var prompt_share = g_share.append("text").classed("prompt",true).text("Account for the most patents?");
	var prompt_change = g_change.append("text").classed("prompt",true).text("Have had the fastest growth in patenting?");
	var prompt_accel = g_accel.append("text").classed("prompt",true).text("Have seen an acceleration in patenting?");

	g_share.append("rect").classed("underline",true);
	g_change.append("rect").classed("underline",true);
	g_accel.append("rect").classed("underline",true);

	//plot dimensions (of each sub-plot)
	var height = 450;
	var width = 300;
	var xpad = 50;
	var ypad = 30;

	var totwidth = 900;

	var title_height = 140;

	function setSize(){
		var box = wrap.node().getBoundingClientRect();
		var boxwidth = totwidth = box.right - box.left;
		var landscape = boxwidth >= 1000;
		if(landscape){
			width = (boxwidth - (2*xpad))/3;
			if(width < 300){width = 300}
			var translates = [[0,0], [width+xpad,0], [2*(width+xpad),0]];
			var svgh = height + ypad;
		}
		else{
			width = boxwidth - xpad;
			if(width < 300){width = 300}
			else if(width > 540){width = 540}
			var center = (boxwidth - width)/2;
			if(center < 0){center = 0;}
			var translates = [[center,0], [center,height+ypad], [center,height*2 + ypad*2]];
			var svgh = (height*3) + (ypad*3);
		}

		svg.attr("height", svgh+"px");

		return {translates:translates, landscape:landscape}
	}

	d3.json(url, function(err, data){
		if(!!err){
			return null
		}

		//hold sorted data -- don't change original data array
		var sData = data.slice(0).sort(function(a,b){return b.share - a.share});

		var share_scale = d3.scaleLinear().domain([0, d3.max(data, function(d){return d.share})]);
		
		var change_max = d3.max(data, function(d){return d3.max([d.a_01_10, d.b_11_16, d.c_diff])});
		var change_min = d3.min(data, function(d){return d3.min([d.a_01_10, d.b_11_16, d.c_diff])});
		var abs_change_max = d3.max([Math.abs(change_max), Math.abs(change_min)])
		var change_scale = d3.scaleLinear().domain([0-abs_change_max, abs_change_max]);

		//initialize orientation
		var orientation = setSize();

		//height of each row computed based on plot height and title box height
		var row_height = (height - title_height) / sData.length;
		var bar_height = Math.round(row_height/2)
		var text_width = 190;

		var current_sort = {var: "share", descending:true}

		function draw(){
			orientation = setSize();
			text_width = orientation.landscape ? 190 : 150;
			//to do -- update depending on whether labels present
			
			//scales are set up to deliver bar value position
			share_scale.range([0, width - text_width - 5]);

			var change_width = !orientation.landscape ? (width-text_width-10)/2 : (width-10)/2;
			change_scale.range([0, change_width]);

			sData = data.slice(0).sort(function(a,b){
				var aval = a[current_sort.var];
				var bval = b[current_sort.var];

				return current_sort.descending ? bval-aval : aval-bval;
			});
			
			drawShare();
			drawChange(change_width);
			drawAccel(change_width);

			//position text prompts
			var prompts = svg.selectAll("text.prompt");

			prompts.attr("x", function(d,i){
					if(i==-1){
						var x = text_width - 10;
					}
					else if(i==-2){
						var x = text_width + 10;
					}
					else{
						var x = width/2;
					}
					return x;
				})
				.attr("y", 52)
				.attr("text-anchor", "middle")
				.style("font-style","italic")
				;

			svg.selectAll("rect.underline").attr("height","1px").attr("width",width).attr("x",0).attr("y",60).attr("fill","#aaaaaa")

			var sortbuttons = svg.selectAll("text.sortable").style("cursor","pointer");
			sortbuttons.on("mousedown", function(d){
				if(d.var==current_sort.var){
					current_sort.descending = !current_sort.descending;
				}
				else{
					current_sort.var = d.var;
					current_sort.descending = true;
				}
				draw();
			});
			sortbuttons.style("font-weight", function(d){
				return d.var == current_sort.var ? "bold" : "normal";
			});
		}

		function drawShare(){
			var t = orientation.translates[0];
			g_share.transition().attr("transform", "translate("+t[0]+","+t[1]+")");

			var rows_update = g_share.selectAll("g").data(sData, function(d){return d.category});
			var rows_enter = rows_update.enter().append("g");
				rows_enter.append("path");
				rows_enter.append("text").classed("cat-name",true).attr("dy","11").attr("text-anchor","end");
				rows_enter.append("text").classed("val-label",true).attr("dy","11").attr("text-anchor","start");
				rows_enter.append("rect");

			var rows = rows_enter.merge(rows_update);

			rows.select("path")
				.attr("d","M"+text_width+",5 l"+((orientation.landscape ? totwidth : width)-text_width)+",0")
				.attr("stroke","#dddddd")
				.style("shape-rendering","crispEdges")
				//.style("visibility", orientation.landscape ? "visible" : "hidden")
				;

			rows.select("rect").attr("x", function(d){return text_width + 5})
							   .attr("y","0")
							   .attr("height",bar_height)
							   .attr("width",function(d){return share_scale(d.share)})
							   .attr("fill", "#31b244");

			rows.select("text").attr("x", text_width).text(function(d){return d.category});

			rows.transition().duration(1000).attr("transform", function(d,i){return "translate(0," + (title_height + (i*row_height)) + ")"});

			//variable labels
			var lab = g_share.selectAll("text.var-label").data([{lab:"Share of cleantech patents, 2011–16", var:"share"}]);
			lab.enter().append("text").classed("var-label",true)
			.merge(lab).attr("x",width/2).attr("y",118)
			.text(function(d){return d.lab})
			.attr("text-anchor","middle")
			.classed("sortable","true")
			.style("font-style","italic")
			;

			//axes
			var g_axis_u = g_share.selectAll("g.x-axis").data([0]);
			var g_axis = g_axis_u.enter().append("g").classed("x-axis",true).merge(g_axis_u);
				g_axis.attr("transform","translate(" + text_width + "," + height + ")")

			var axis = d3.axisBottom(share_scale).tickValues([0,5,10,15]).tickFormat(function(v){return v+"%"});

			g_axis.call(axis);
		}


		function drawChange(w){
			var t = orientation.translates[1];
			g_change.transition().attr("transform", "translate("+t[0]+","+t[1]+")");

			var ch1 = sData.map(function(d){return {ch: d.a_01_10, cat:d.category} });
			var ch2 = sData.map(function(d){return {ch: d.b_11_16, cat:d.category} });

			ch1.title = "2001–10";
			ch2.title = "2011–16";

			var zero = change_scale(0);

			var mains_update = g_change.selectAll("g.main").data([ch1, ch2]);
			var mains_enter = mains_update.enter().append("g").classed("main",true);
				mains_enter.append("g").classed("anno",true)
									   .append("path")
									   .attr("stroke","#aaaaaa")
									   .style("shape-rendering","crispEdges")
									   ;

			var tw = !orientation.landscape ? text_width : 0;
			var mains = mains_enter.merge(mains_update).attr("transform", function(d,i){
				return "translate(" + (tw + (i*w)) + ",0)" ;
			});

			var rows_update = mains.selectAll("g.row").data(function(d){return d}, function(d){return d.cat});
			var rows_enter = rows_update.enter().append("g").classed("row",true);
				//rows_enter.append("path");
				//rows_enter.append("text").classed("cat-name",true).attr("dy","11").attr("text-anchor","end");
				rows_enter.append("text").classed("val-label",true).attr("dy","11").attr("text-anchor","start");
				rows_enter.append("rect");

			var rows = rows_enter.merge(rows_update);

			//rows.select("path").attr("d","M0,5 l"+(width/2)+",0").attr("stroke","#dddddd").style("shape-rendering","crispEdges");
			var vline = mains.select("g.anno").select("path").attr("d", "M"+zero+","+(title_height-5)+"l0,"+row_height*14);

			rows.select("rect").attr("x", function(d){return d.ch >= 0 ? zero : change_scale(d.ch)})
							   .attr("y","0")
							   .attr("height",bar_height)
							   .attr("width",function(d){return d.ch >= 0 ? change_scale(d.ch) - zero : zero - change_scale(d.ch)})
							   .attr("fill", function(d){return d.ch >= 0 ? "#31b244" : "#ff495c"});

			rows.transition().duration(1000).attr("transform", function(d,i){return "translate(0," + (title_height + (i*row_height)) + ")"});

			var catlab = g_change.selectAll("text.cat-name").data(sData, function(d){return d.category});
			catlab.enter().append("text").classed("cat-name",true).merge(catlab)
				.attr("text-anchor","end")
					.attr("x", text_width).attr("dy","11")
					.text(function(d,i){return d.category})
					.style("visibility", orientation.landscape ? "hidden" : "visible")
					.transition().duration(1000)
					.attr("y",function(d,i){
						return title_height + (i*row_height);
					})
					;

			var catline = g_change.selectAll("path.cat-line").data(sData);
			catline.enter().append("path").classed("cat-line",true).merge(catline)
				.attr("d", function(d,i){
					return "M"+text_width+","+ (title_height + (i*row_height) + 5) + "l"+(width-text_width)+",0";
				})
				.attr("stroke","#dddddd")
				.style("shape-rendering","crispEdges")
				.style("visibility", !orientation.landscape ? "visible" : "hidden")
				.lower()
				;

			vline.raise();

			//variable labels
			var lab = g_change.selectAll("text.var-label")
				.data([{lab:"2001–10", var:"a_01_10"},
					   {lab:"2011–16", var:"b_11_16"},
					   {lab:"Annual average percent change", var:"b_11_16"}]);
			lab.enter().append("text").classed("var-label",true)
			.merge(lab).attr("x",function(d,i){
				if(i==0){
					var x = tw + change_scale(0);
				}
				else if(i==1){
					var x = tw + w + change_scale(0);
				}
				else{
					var x = tw + w;
				}
				return x;
			})
			.attr("y",function(d,i){
				return i<2 ? 118 : 93;
			}).text(function(d){return d.lab})
			.classed("sortable", function(d){return d.var!==null})
			.attr("text-anchor","middle")
			.style("font-style","italic")
			;

			//axes
			var g_axis_u = mains.selectAll("g.x-axis").data([0]);
			var g_axis = g_axis_u.enter().append("g").classed("x-axis",true).merge(g_axis_u);
				g_axis.attr("transform","translate(0," + height + ")")

			var axis = d3.axisBottom(change_scale).tickValues([-0.1, 0, 0.1]).tickFormat(d3.format("+.0%"));

			g_axis.each(function(){d3.select(this).call(axis)});			

		}


		function drawAccel(w){
			var t = orientation.translates[2];
			g_accel.transition().attr("transform", "translate("+t[0]+","+t[1]+")");

			var ch1 = sData.map(function(d){return {ch: d.c_diff, cat:d.category} });

			var zero = change_scale(0);

			var mains_update = g_accel.selectAll("g.main").data([ch1]);
			var mains_enter = mains_update.enter().append("g").classed("main",true);
				mains_enter.append("g").classed("anno",true)
									   .append("path")
									   .attr("stroke","#aaaaaa")
									   .style("shape-rendering","crispEdges")
									   ;
			
			var tw = !orientation.landscape ? text_width : 0;
			var mains = mains_enter.merge(mains_update).attr("transform","translate("+((w/2)+tw)+",0)");

			var rows_update = mains.selectAll("g.row").data(function(d){return d}, function(d){return d.cat});
			var rows_enter = rows_update.enter().append("g").classed("row",true);
				//rows_enter.append("path");
				//rows_enter.append("text").classed("cat-name",true).attr("dy","11").attr("text-anchor","end");
				rows_enter.append("text").classed("val-label",true).attr("dy","11").attr("text-anchor","start");
				rows_enter.append("rect");

			var rows = rows_enter.merge(rows_update);

			//rows.select("path").attr("d","M0,5 l"+(width/2)+",0").attr("stroke","#dddddd").style("shape-rendering","crispEdges");
			var vline = mains.select("g.anno").select("path").attr("d", "M"+zero+","+(title_height-5)+"l0,"+row_height*14);

			rows.select("rect").attr("x", function(d){return d.ch >= 0 ? zero : change_scale(d.ch)})
							   .attr("y","0")
							   .attr("height",bar_height)
							   .attr("width",function(d){return d.ch >= 0 ? change_scale(d.ch) - zero : zero - change_scale(d.ch)})
							   .attr("fill", function(d){return d.ch >= 0 ? "#31b244" : "#ff495c"});

			//rows.select("text").attr("x", text_width).text(function(d){return d.category});

			rows.transition().duration(1000).attr("transform", function(d,i){return "translate(0," + (title_height + (i*row_height)) + ")"});


			var catlab = g_accel.selectAll("text.cat-name").data(sData, function(d){return d.category});
			catlab.enter().append("text").classed("cat-name",true).merge(catlab)
				.attr("text-anchor","end").attr("x", text_width).attr("dy","11")
					.text(function(d,i){return d.category})
					.style("visibility", orientation.landscape ? "hidden" : "visible")
					.transition().duration(1000)
					.attr("y",function(d,i){
						return title_height + (i*row_height);
					})
					;

			var catline = g_accel.selectAll("path.cat-line").data(sData);
			catline.enter().append("path").classed("cat-line",true).merge(catline)
				.attr("d", function(d,i){
					return "M"+text_width+","+ (title_height + (i*row_height) + 5) + "l"+(width-text_width)+",0";
				})
				.attr("stroke","#dddddd")
				.style("shape-rendering","crispEdges")
				.style("visibility", !orientation.landscape ? "visible" : "hidden")
				.lower()
				;

			vline.raise();

			//variable labels
			var lab = g_accel.selectAll("text.var-label")
			.data([{lab:"Percentage point difference b/n growth", var:"c_diff"}, 
				   {lab:"during 2001–10 and 2011–16", var:"c_diff"}]);
			lab.enter().append("text").classed("var-label",true)
			.merge(lab).attr("x",(w/2)+tw+change_scale(0))
			.attr("y",function(d,i){
				return i==1 ? 118 : 93;
			}).text(function(d){return d.lab})
			.classed("sortable", function(d){return d.var!==null})
			.attr("text-anchor","middle")
			.style("font-style","italic")
			;

			//axes
			var g_axis_u = mains.selectAll("g.x-axis").data([0]);
			var g_axis = g_axis_u.enter().append("g").classed("x-axis",true).merge(g_axis_u);
				g_axis.attr("transform","translate(0," + height + ")")

			var axis = d3.axisBottom(change_scale).tickValues([-0.1, 0, 0.1]).tickFormat(d3.format("+.0%"));

			g_axis.each(function(){d3.select(this).call(axis)});	

		}

		draw();

		var resizeTimer;
		window.addEventListener("resize",function(){
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function(){
				draw();
			}, 250);
		})

	});
}