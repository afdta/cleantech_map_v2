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

var width = 960;
var height = 500;
var aspect = 9/16;
aspect = 0.4;
var pi2 = Math.PI*2;

var technodes = [
	{name:"Wind", var:"V10", i:0},
	{name:"Air", var:"V11", i:1},
	{name:"Bioenergy", var:"V12", i:2},
	{name:"Green materials", var:"V13", i:3},
	{name:"Conventional fuel", var:"V14", i:4},
	{name:"Efficiency", var:"V15", i:5},
	{name:"Recycling", var:"V16", i:6},
	{name:"Solar", var:"V17", i:7},
	{name:"Water/wastewater", var:"V18", i:8},
	{name:"Geothermal", var:"V19", i:9},
	{name:"Nuclear", var:"V20", i:10},
	{name:"Transportation", var:"V21", i:11},
	{name:"Energy storage", var:"V22", i:12},
	{name:"Hydro power", var:"V23", i:13}
]

function main(){

	var wrap = d3.select("#met-dash").style("width","100%");
	var title = wrap.append("p").style("text-align","center");


	var data = null;

	function useTheForce(_){
		if(data !== null){



			var canvas = wrap.append("canvas");
			var context = canvas.node().getContext("2d");

			var current_vn = arguments.length > 0 ? _ : null;

			function build(vn){

				//set dimensions of layout
				var rect = wrap.node().getBoundingClientRect();
				width = rect.right - rect.left;
				height = width*aspect;

				canvas.attr("width", width > 320 ? width : 320)
							.attr("height",height);

				if(arguments.length===0){
					vn = current_vn;
				}
				else{
					current_vn = vn;
				}

				//maximum across all patent categories
				var maxmax = d3.max(data.obs, function(d){
					return d3.max(technodes, function(t){
						return d[t.var];
					})
				});

				var extent = d3.extent(data.obs, function(d){return d[vn]});
				var scale = d3.scaleSqrt().domain([0,maxmax]).range([1,30]);

				var center = technodes.filter(function(d,i){
					return vn==d.var;
				});

				//if vn === null, center.length === 0
				if(center.length != 1 || vn===null){
					canvas.style("visibility","hidden");
					return null;
				}
				else{
					canvas.style("visibility","visible");
					title.text(center[0].name);
				}

				var nrays = 10;
				var ray_len = 5;
				var ray_increment = ray_len/nrays;
				var val_nodes = data.obs.slice(0).sort(function(a,b){return b[vn]-a[vn]});
						val_nodes.unshift(center[0]);

				var nodes = val_nodes.map(function(d,i,a){

															var val = d[vn];
															var share = val/extent[1];

															var r = {center:[width/2, height/2]};

															var ray = (i%25);

															if(i>0){
																r.data = d;
																r.val = val;
																r.share = share;
																r.rad = scale(val);

																//initalize placement of nodes to avoid unstable start to
																//simulation that could cause instability
																//eliminate forces to see how this initial placement looks
																if(ray==1){
																	ray_len = ray_len + r.rad;
																	ray_increment = (r.rad*2)/nrays;
																}
																else{
																	ray_len = ray_len + ray_increment;
																}

																var radians = 2*Math.PI*(ray/nrays) + Math.random();
																r.x = r.center[0] + (ray_len+r.rad)*Math.cos(radians);
																r.y = r.center[1] + (ray_len+r.rad)*Math.sin(radians);

																r.sun = false; //node is in orbit
															}
															else{
																r.x = r.center[0];
																r.y = r.center[1];
																r.rad = 5;
																r.sun = true; //node is the "sun"
															}

															//r.rad = 5;

															return r;
														});

					//build links to first node
					//to do -- only link top 50 or so?
					//skip the first element of nodes (it's the center node)
					var links = nodes.slice(1).map(function(d,i,a){
						return {source:0, target:i+1, strength:d.share}
					});

					var forceSim = d3.forceSimulation(nodes);

					forceSim.force("center", d3.forceCenter(width/2,height/2))
									.force("link", d3.forceLink(links)
										.distance(function(link){
											return 40;
											//return 15*(2-link.strength);
										}).strength(function(link){
											return 2*link.strength + 0.05;
										}))
									.force("x", d3.forceX(width/2).strength(function(node){
											return node.index==0 ? 1 : 0;
										}))
									.force("y", d3.forceY(height/2).strength(function(node){
											return node.index==0 ? 1 : 0;
										}))
									.force("collision", d3.forceCollide(function(node){
											var buffer = 3;
											return node.rad + buffer;
										} ).strength(0.3) )
									.force("gravity", d3.forceManyBody().strength(-5))
									;

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

					canvas.call(d3.drag()
					        .container(canvas.node())
					        .subject(findSubject)
					        .on("start", dragStart)
					        .on("drag", drag)
					        .on("end", dragEnd));

					/*END BOSTOCK CREDIT*/

					//tick function
					function tick(){
						try{
							context.clearRect(0, 0, width, height);
							context.beginPath();
							context.fillStyle = "#ee5555";
							context.strokeStyle = "#dddddd";

							nodes.forEach(function(d,i){
								context.moveTo(d.x+d.rad, d.y);
								context.arc(d.x, d.y, d.rad, 0, pi2);
							});

							context.fill();
							context.stroke();
						}
						catch(e){
							//console.log(e);
						}
						//context.restore();
					}

					forceSim.on("tick", tick);

			} //end build function

			if(current_vn !== null){
				build(current_vn);
			}

			var resizeTimer;
			window.addEventListener("resize", function(){
				clearTimeout(resizeTimer);
				resizeTimer = setTimeout(function(){build(current_vn)}, 500);
			});

			return build;

		} //close massive if-data-loaded block

		return null;

	} //close useTheForce()

	d3.json(dir.url("data", "energy_innovation.json"), function(err, dat){
		if(!!err){

		} else{
			data = dat;

			var update = useTheForce("V10");

			var ci = 0;
			function sequence(){
				var next = technodes[++ci].var;
				update(next);
				setTimeout(sequence,5000);
			}
			setTimeout(sequence,5000);

		}
	});

} //close main()

document.addEventListener("DOMContentLoaded", main);
