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
var pi2 = Math.PI*2;


function main(){

	var wrap = d3.select("#met-dash").style("width","100%");
	var canvas = wrap.append("canvas");

	var context = canvas.node().getContext("2d");

	var data = null;

	function useTheForce(){
		if(data !== null){

			var rect = wrap.node().getBoundingClientRect();
			width = rect.right - rect.left;
			if(width < 320){
				width = 320;
			}
			height = width*aspect;

			canvas.attr("width",width)
			.attr("height",height)

			var forceSim = d3.forceSimulation(data.nodes);

			console.log(JSON.stringify(data.nodes));

			forceSim.alphaDecay(1-Math.pow(0.001, 1 / 100));
			forceSim.force("center", d3.forceCenter(width/2,height/2));

			forceSim.force("link", d3.forceLink(data.links)
				.distance(20)
				.strength(function(link){
					return 1;
					//if(link.strength > 1){console.log(link.strength)}
					return link.strength*5 + 1;
				})
			);

			console.log(data.links)

			//links
			//data.nodes[0].fx = width/2;
			//data.nodes[0].fy = height/2;
			//var links2center = d3.range(1, data.nodes.length).map(function(i){
			//	return {
			//		source: 0,
			//		target: i
			//	};
			//});

			//var sorted = data.nodes.slice(0).sort(function(a, b){
			//	if(a.index==0 || b.hasOwnProperty("name")){
			//		return -1;
			//	} else if(b.index==0 || a.hasOwnProperty("name")){
			// 	return 1;
			//	}
			//	else{
			//		return b.val - a.val;
			//	}
			//});

			/*
			var links = d3.range(1, data.nodes.length).map(function(i){
				return {
					source: sorted[i-1].index,
					target: sorted[i].index
				}
			});
			*/


			/*forceSim.force("link", d3.forceLink(links)
				.distance(5)
				.strength(0.5)
			);*/

			/*forceSim.force("centerLink", d3.forceLink(links2center)
				.distance(30)
				.strength(function(link){
					return 0.25;
					//return Math.pow(link.target.val/1,1.25);
				} )
			);*/

			forceSim.force("collision", d3.forceCollide(function(node){
				var buffer = 5;
				var rad = node.hasOwnProperty("val") ? node.val*20 : 10;
				return rad + buffer;
			} ).strength(0.5) );

			forceSim.force("repel", d3.forceManyBody().strength(-30));

			/*CREDIT M. BOSTOCK*/
			function findSubject() {
			  return forceSim.find(d3.event.x, d3.event.y);
			}

			function dragStart() {
			  if (!d3.event.active) forceSim.alphaTarget(0.1).restart();
				//forceSim.force("collision").strength(0.2);
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
				//forceSim.force("collision").strength(0.5);
			}


			canvas.call(d3.drag()
			        .container(canvas.node())
			        .subject(findSubject)
			        .on("start", dragStart)
			        .on("drag", drag)
			        .on("end", dragEnd));

			/*END BOSTOCK CREDIT*/

			/*
			forceSim.force("bounds", function(alpha){
				var n = data.nodes.length;
				var i = -1;
				var k = alpha*0.1;
				var node;
				//console.log(alpha);

				while(++i < n){
			    node = data.nodes[i];

					var nextX = node.x + node.vx;
					var nextY = node.y + node.vy;

					if(node.x < node.rad + 5){
						node.x = node.rad + 5;
					}
					else if(node.x > width - node.rad - 5){
						node.x = width - node.rad - 5;
					}

					if(node.y < node.rad+5){
						node.y = node.rad+5;
					}
					else if(node.y > height - node.rad - 5){
						node.y = height - node.rad - 5;
					}

			    //node.vx -= node.x * k;
			    //node.vy -= node.y * k;
			  }
			});
			*/

			function pointOnCircle(cx, cy, r, px, py){
				var vy = py - cy;
				var vx = px - cx;
				var len = Math.sqrt(vx*vx + vy*vy);

				if(len==0){
					var target = null;
				}
				else{
					var tx = (r*(vx/len)) + cx;
		      var ty = (r*(vy/len)) + cy;
					var target = [tx, ty];
				}
				return target;
			}


			/*forceSim.force("circle", function(alpha){

				var n = data.nodes.length;
				var i = -1;
				var k = alpha*0.1;
				var node;
				//console.log(alpha);

				while(++i < n){
			    node = data.nodes[i];

					var target = pointOnCircle(width/2, height/2, Math.min(width/3, height/3), node.x, node.y)

					//console.log(target);

					//only use if a tech node
					if(target != null && node.hasOwnProperty("name")){
						var vx = target[0]-node.x;
						var vy = target[1]-node.y;

						//enforce strictly
						//node.x = target[0];
						//node.y = target[1];

						//alter velocity
						node.vx = node.vx + vx*k;
						node.vy = node.vy + vy*k;
					}

			  }

			})*/

var ticked = false;
			function tick(){
				if(!ticked){
					ticked = true;
				}

				try{
					context.clearRect(0, 0, width, height);

					context.beginPath();

					context.fillStyle = "#ee5555";
					context.strokeStyle = "#dddddd";

					//metro nodes
					var mn = data.nodes.filter(function(d){return !d.hasOwnProperty("name")});
					var tn = data.nodes.filter(function(d){return d.hasOwnProperty("name")});

					mn.forEach(function(d,i){
						context.moveTo(d.x+(d.val*20), d.y);
						context.arc(d.x, d.y, d.val*20, 0, pi2);
					});

					context.fill();
					context.stroke();

					//tech nodes
					tn.forEach(function(d,i){
						var rad = 2;
						context.moveTo(d.x+rad, d.y);
						context.arc(d.x, d.y, rad, 0, pi2);
						d.fx = width/2;
						d.fy = height/2;
					});


					context.fillStyle = "#666666";
					context.fill();


					context.stroke();


				}
				catch(e){
					//console.log(e);
				}

				//context.restore();

			}

			forceSim.on("tick", tick);

		}
	}

	d3.json(dir.url("data", "energy_innovation.json"), function(err, dat){
		if(!!err){

		} else{
			data = dat;
			var nodes = dat.obs.map(function(d,i,a){
				var r = {};
				console.log(width);
				r.x = width/2;
				r.y = height/2;
				r.data = d;
				r.val = d.V10/172;
				r.rad = 5;
				return r;
			});

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

			technodes = technodes.slice(0,1);

			//build links to technodes
			var links = [];
			var i = -1;
			var node;
			while(++i < nodes.length){
				node = nodes[i];
				technodes.forEach(function(d,j){
					var strength = node.data["V3"]==0 ? 0 : node.data[d.var]/node.data["V3"];

					if(!(strength>0 && strength <= 1)){
						console.log(strength);
					}

					links.push({
						source:i+technodes.length,
						target:d.i,
						strength: node.val
					})
				})
			}

			data.nodes = technodes.concat(nodes);

			data.links = links;


			useTheForce();

			var resizeTimer;
			window.addEventListener("resize", function(){
				clearTimeout(resizeTimer);
				//resizeTimer = setTimeout(useTheForce, 500);
			});
		}
	});

}

document.addEventListener("DOMContentLoaded", main);
