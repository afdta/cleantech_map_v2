//add browser compat message: test for svg, array.filter and map

//To do: review handling of missing values in all modules: both implicit and explicit missings

//shared js-modules
import card from '../../../js-modules/card-api.js';
import nameshort from '../../../js-modules/nameshort.js';
import dir from '../../../js-modules/rackspace.js';
import table from '../../../js-modules/table.js';
//import dimensions from '../../../js-modules/dimensions.js';
import metro_select from '../../../js-modules/metro-select.js';
//import metro_map from '../../../js-modules/metro-maps.js';
import waypoint from '../../../js-modules/on-scroll2.js';

dir.local("./").add("data")
//dir.add("json17", "metro-monitor/data/2017/json")


function main(){

	var width = 960;
	var height = 500;
	var aspect = 9/16;
	var pi2 = Math.PI*2;

	var technodes = [
		{name:"Green materials", var:"V13", i:3},
		{name:"Efficiency", var:"V15", i:5},
		{name:"Transportation", var:"V21", i:11},
		{name:"Energy storage", var:"V22", i:12},
		{name:"Solar", var:"V17", i:7},
		{name:"Air", var:"V11", i:1},
		{name:"Water/wastewater", var:"V18", i:8},
		{name:"Bioenergy", var:"V12", i:2},
		{name:"Wind", var:"V10", i:0},
		{name:"Conventional fuel", var:"V14", i:4},
		{name:"Recycling", var:"V16", i:6},
		{name:"Nuclear", var:"V20", i:10},
		{name:"Hydro power", var:"V23", i:13},
		{name:"Geothermal", var:"V19", i:9}
	]

	var techlookup = {};
	for(var tl=0; tl<technodes.length; tl++){
		techlookup[technodes[tl].var] = technodes[tl].name;
	}

	var wrap = d3.select("#met-dash").style("width","100%").style("overflow","hidden");

	var svg_wrap = wrap.append("div").style("width","100%").style("height","100vh").style("position","relative");
	var svg = svg_wrap.append("svg");

	var cat_label = svg_wrap.append("p").style("position","absolute").style("left","2em").style("top","1em");
	var views = wrap.selectAll("div.views").data(technodes).enter().append("div").classed("views",true)

	var button_wrap = wrap.append("div").classed("button-wrap",true).style("visibility","hidden");
	
	//var title = wrap.append("p").style("text-align","center");

	d3.json(dir.url("data", "energy_innovation.json"), function(err, data){

		if(!!err){
			svg.style("visibility", "hidden");
			return null;
		}

		var forceSim = d3.forceSimulation().stop();

		/*ADAPTED FROM EXAMPLE BY M. BOSTOCK*/
		function findSubject() {
			return forceSim.find(d3.event.x, d3.event.y);
		}

		function dragStart() {
			if (!d3.event.active) forceSim.alphaTarget(0.4).restart();
			//forceSim.force("collision").strength(1);
			//forceSim.force("link").strength(3);
			d3.event.subject.fx = d3.event.subject.x;
			d3.event.subject.fy = d3.event.subject.y;
		}

		function drag() {
			d3.event.subject.fx = d3.event.x;
			d3.event.subject.fy = d3.event.y;
		}

		function dragEnd() {
			if (!d3.event.active) forceSim.alphaTarget(0);
			d3.event.subject.fx = null;
			d3.event.subject.fy = null;
			//console.log(d3.event.subject);
			//forceSim.force("collision").strength(0.5);
		}

		svg.call(d3.drag()
						.container(svg.node())
						.subject(findSubject)
						.on("start", dragStart)
						.on("drag", drag)
						.on("end", dragEnd));
		/*END BOSTOCK CREDIT*/





		//maximum across all patent categories
		var maxmax = d3.max(data.obs, function(d){
			return d3.max(technodes, function(t){
				return d[t.var];
			})
		});

		var scale = d3.scaleSqrt().domain([0,maxmax]).range([1,40]);

		var current_vn = "V13";

		//take a variable name code (vn), return a function to map node data to starting state
		function data_mapper(vn, nrays){
			var extent = d3.extent(data.obs, function(d){return d[vn]});

			if(arguments.length < 2){nrays = 10}
			var ray_len = 1;
			var ray_increment = ray_len/nrays;

			//actual data array mapper
			function dmap(d, i, a){
				var val = d[vn];
				var share = val/extent[1];

				var r = {center:[width/2, height/2]};
				r.name = d.V1;

				var ray = (i%nrays);

				r.data = d;
				r.val = val;
				r.share = share;
				r.rad = scale(val);
				r.planet = true;

				//initalize placement of nodes to avoid unstable start to
				//simulation that could cause instability
				//eliminate forces to see how this initial placement looks
				if(ray==0){
					ray_len = ray_len + r.rad;
					ray_increment = (r.rad*2)/nrays;
				}
				else{
					ray_len = ray_len + ray_increment;
				}

				var radians = 2*Math.PI*(ray/nrays) + Math.random()/3;
				r.x = r.center[0] + (ray_len+r.rad)*Math.cos(radians);
				r.y = r.center[1] + (ray_len+r.rad)*Math.sin(radians);

				return r;
			}
			return dmap;
		} //end data mapper closure


		function build(vn){
			if(arguments.length > 0){
				current_vn = vn;
			}
			else{
				vn = current_vn;
			}

			//set dimensions of layout
			var rect = svg_wrap.node().getBoundingClientRect();
			width = rect.right - rect.left;
			//height = width*aspect;
			height = rect.bottom - rect.top;

			if(width < 320){width = 320}
			if(height < 600){height = 600}
			//else if(height > 600){height = 600}

			svg.attr("width", width+"px").attr("height", height+"px");

			var center = {};
			center.name = techlookup[vn];
			center.x = width/2;
			center.y = height/2;
			center.rad = 15;
			center.planet = false; //it's the sun (center)
			center.share = 0;
			center.val = 0;

			var nodes = data.obs.slice(0).sort(function(a,b){
														return b[vn]-a[vn];
												})
												.map(data_mapper(vn, 20))
												;

			cat_label.text(techlookup[vn]);


			nodes.unshift(center);

			//build links to first node
			//to do -- only link top 50 or so?
			//skip the first element of nodes (it's the center node)
			var links = nodes.slice(1).map(function(d,i,a){
				return {source:0, target:i+1, strength:d.share}
			});

			forceSim.nodes(nodes)
							.force("center", d3.forceCenter(width/2,height/2))
							.force("link", d3.forceLink(links)
								.distance(function(link){
									return 55;
									//return 15*(2-link.strength);
								}).strength(function(link){
									return 1.5*link.strength + 0.05;
								}))
							.force("x", d3.forceX(width/2).strength(function(node){
									return !node.planet ? 0.75 : 0;
								}))
							.force("y", d3.forceY(height/2).strength(function(node){
									return !node.planet ? 0.75 : 0;
								}))
							.force("collision", d3.forceCollide(function(node){
									var buffer = 3;
									return node.rad + buffer;
								} ).strength(0.3) )
							.force("gravity", d3.forceManyBody().strength(-5))
							.alpha(0.8)
							.restart()
							;

							//tick function
							function tick(){
								try{
									bubbles.attr("cx", function(d){return d.x})
												 .attr("cy", function(d){return d.y})
												 ;
								}
								catch(e){
									console.log(e);
								}
							}

				forceSim.on("tick", tick);

				var bub_update = svg.selectAll("circle")
												 .data(nodes, function(d){
													 return d.name;
												 });

				bub_update.exit().remove();

				var nupdate = 0;
				var bubbles = bub_update.enter()
																.append("circle")
																.merge(bub_update)
																.attr("fill", function(d){return d.planet ? "#31a354" : "#84c899"})
																.attr("stroke", function(d){return d.planet ? "#eeeeee" : "#31a354"})
																.attr("stroke-width", "1px")
																//.attr("cx", function(d){return d.x})
																//.attr("cy", function(d){return d.y})
																;

																bubbles.transition()
																			 .duration(1000)
																				.attr("r", function(d){return d.rad+"px"})
																				.on("end", function(){
																					nupdate = nupdate + 1;
																					if(nupdate == nodes.length){
																						//forceSim.alpha(0.7)
																						//				.restart();
																						//console.log(nupdate);
																					}
																				})
																				;





		} //end build function


		build(current_vn);

		var resizeTimer;
		window.addEventListener("resize", function(){
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function(){build(current_vn)}, 500);
		});


		var buttons = button_wrap.selectAll("p").data(technodes)
			.enter()
			.append("p")
			.text(function(d,i){return d.name})
			;

		function syncbuttons(){
			buttons.classed("selected", function(d,i){
								return d.var == current_vn;
							});
		}

		syncbuttons();

		window.addEventListener("scroll", function(){
			var window_height = Math.max(document.documentElement.clientHeight, (window.innerHeight || 0));
			var box = wrap.node().getBoundingClientRect();

			if((box.top < 0 && box.bottom > 0)){
				svg_wrap.style("position","fixed").style("top","0px").style("left","0px");
			} 
			else{
				svg_wrap.style("position","relative");
			}
		});

		views.each(function(d,i){
			d3.select(this).append("p").text(d.name).classed("view-name",true).style("position","relative").style("z-index","100");
			waypoint(this)
			.activate(function(){
				if(d.var != current_vn){build(d.var)};
			})
			.scroll(function(box){
				if(d.var != current_vn && box.top > 0){build(d.var)};
			}).buffer(0.15);
		});

		var cycling = true;

		function total_update(variable){
			build(variable);
			syncbuttons();
		}

		buttons.on("mousedown", function(d,i){
			cycling = false;
			total_update(d.var);
		})

		//run as a sequence
		var ci = 0;
		var timer;
		function cycle(){
			clearTimeout(timer);
			if(cycling){
				var n = ++ci % technodes.length;
				var next = technodes[n].var;
				total_update(next);
				timer = setTimeout(cycle,2000);
			}
		}
		//timer = setTimeout(cycle,2000);

	}); //end d3.json callback

} //close main()

document.addEventListener("DOMContentLoaded", main);
