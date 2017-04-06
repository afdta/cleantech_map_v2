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

			data.nodes[0].fx = width/2;
			data.nodes[0].fy = height/2;

			canvas.attr("width",width)
			.attr("height",height)

			var forceSim = d3.forceSimulation(data.nodes);

			forceSim.alphaDecay(1-Math.pow(0.001, 1 / 100));
			forceSim.force("center", d3.forceCenter(width/2,height/2));

			forceSim.nodes().forEach(function(d,i){
				d.x = width/2;
				d.y = height/2;
			});

			//links
			var links2center = d3.range(1, data.nodes.length).map(function(i){
				return {
					source: 0,
					target: i
				};
			});

			var sorted = data.nodes.slice(0).sort(function(a, b){
				if(a.index==0){
					return -1;
				} else if(b.index==0){
					return 1;
				}
				else{
					return b.val - a.val;
				}
			});

			var links = d3.range(1, data.nodes.length).map(function(i){
				return {
					source: sorted[i-1].index,
					target: sorted[i].index
				}
			});


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

			forceSim.force("collision", d3.forceCollide(function(node, index){
				var buffer = 5;
				return (node.rad) + buffer;
			} ).strength(0.5) );

			//forceSim.force("repel", d3.forceManyBody().strength(-30));
			//forceSim.force("attract", d3.forceManyBody().strength(2));


			/*CREDIT M. BOSTOCK*/
			function findSubject() {
			  return forceSim.find(d3.event.x, d3.event.y);
			}

			function dragStart() {
			  if (!d3.event.active) forceSim.alphaTarget(0.1).restart();
				forceSim.force("collision").strength(0.2);
				forceSim.force("centerLink").strength(0);
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
				forceSim.force("collision").strength(0.5);
				forceSim.force("centerLink").strength(0.25);
			}


			canvas.call(d3.drag()
			        .container(canvas.node())
			        .subject(findSubject)
			        .on("start", dragStart)
			        .on("drag", drag)
			        .on("end", dragEnd));

			/*END BOSTOCK CREDIT*/

			/*forceSim.force("x", d3.forceX(width/2).strength(function(node, index){
				return node.val*0.1;
			}));*/

			/*forceSim.force("y", d3.forceY(height/2).strength(function(node, index){
				return node.val*0.1;
			}));*/

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

			/*
			forceSim.force("one", function(alpha){
				var n = data.nodes.length;
				var i = -1;
				var k = alpha*0.1;
				var node;
				while(++i < n){
					node = data.nodes[i];
					if(i==10){
						console.log("before force 1 - x: " + node.x + " vx: " + node.vx);
						node.vx = node.vx*k;
					}
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


			forceSim.force("circle", function(alpha){

				var n = data.nodes.length;
				var i = -1;
				var k = alpha*0.1;
				var node;
				//console.log(alpha);

				while(++i < n){
			    node = data.nodes[i];

					var target = pointOnCircle(width/2, height/2, Math.min(width/3, height/3), node.x, node.y)

					//console.log(target);

					if(target != null){
						var vx = target[0]-node.x;
						var vy = target[1]-node.y;

						//node.x = target[0];
						//node.y = target[1];
						node.vx = node.vx + vx*k;
						node.vy = node.vy + vy*k;
					}

			  }

			})


			function tick(){

				try{
					context.clearRect(0, 0, width, height);

					context.beginPath();
					data.nodes.forEach(function(d,i){
						context.moveTo(d.x+d.rad, d.y);
						context.arc(d.x, d.y, d.rad, 0, pi2);
					});

					context.fillStyle = "#ee5555";
					context.fill();
					context.strokeStyle = "#dddddd";
					context.stroke();
				}
				catch(e){
					console.log(e);
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
			data.nodes = dat.obs.map(function(d,i,a){
				var r = {};
				r.x = 100;
				r.y = 0;
				r.data = d;
				r.val = Math.pow(Math.random(),2);
				r.rad = r.val*20;
				return r;
			});

			data.nodes.unshift({
				x: 0,
				y: 0,
				data: null,
				val: 1,
				rad: 1*20
			});


			useTheForce();

			var resizeTimer;
			window.addEventListener("resize", function(){
				clearTimeout(resizeTimer);
				resizeTimer = setTimeout(useTheForce, 500);
			});
		}
	});

}

document.addEventListener("DOMContentLoaded", main);
