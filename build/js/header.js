//args
//container: div to make the header wrap
//parent (optional): specify the element that wraps the header
	//useful if you want to fix the header to the bottom of the parent element when it (the bottom) is in view
	//enables multiple headers on a single page
	//makes parent element relative positioned

export default function header(){
	var O = {};

	//track the header: 0-default, 1-fixed, 2-absolute
	O.position = 0;
	O.pos_change_callback = null;

	var height = 91;
	var height_fixed = 46
	var parent = null;
	var container = null;

	var background_color = "#eeeeee";
	var background_color_fixed = "#dddddd";

	var num_args = arguments.length;

	O.height = function(h0, h1){
		if(arguments.length > 0){
			height = h0+1;
			height_fixed = !!h1 ? h1+1 : height;
			return O;
		}
		else{
			return height;
		}
	}

	O.parent = function(p){
		if(arguments.length > 0){
			parent = p;
			d3.select(parent).style("position","relative");
			return O;
		}
		else{
			return parent;
		}

	}

	O.build = function(container_element, callback){
		var self = this;

		var wrap = null;
		var inner = null;
		var content = null;

		if(arguments.length > 0){
			container = self.wrap = container_element;

			wrap = d3.select(container).style("height", height+"px")
										  .style("width","100%")
										  .style("margin-bottom","2em")
										  .classed("fixed-menu",true);

			inner =  wrap.append("div").style("height", height+"px")
										   .style("min-width","320px")
										   .style("background-color",background_color)
										   .style("z-index","100")
										   .classed("c-fix",true);

			content = inner.append("div").classed("content-box full-bleed",true).style("padding","0em 1em");

			self.content = content;

			if(arguments.length > 1){
				callback.call(self, content);
			}
		}

		//attach view method
		O.view = function(callback){
			if(arguments.length > 0){
				this.pos_change_callback = callback;
			}
		}

		//scroll event handler
		function pos(){

			var window_height = Math.max(document.documentElement.clientHeight, (window.innerHeight || 0));

			var past_bottom = (!!parent && parent.getBoundingClientRect().bottom < window_height-height_fixed) ? true : false;

			try{
				var rect = container.getBoundingClientRect();
				if(rect.bottom < 0 && !past_bottom){
					if(self.position !== 1){
						inner.interrupt()
							 .style("position","fixed")
							 .style("bottom", (-height_fixed+"px"))
							 .style("height", height_fixed+"px")
							 .style("background-color",background_color_fixed)
							 .style("top","auto")
							 .style("left","0px")
							 .style("width","100%")
							 .transition()
							 .duration(400)
							 .style("bottom","-1px")
							 //.on("end", function(d,i){
							 	//force repaint. sometime transition results in a 1px gap
							 //	inner.style("bottom","-1px").style("display","block");
							 //})
							 ;
						self.position = 1;
						if(!!self.pos_change_callback){
							self.pos_change_callback(1);
						}
					}
				}
				else if(rect.bottom < 0 && past_bottom){
					if(self.position !== 2){
						inner.interrupt()
							 .transition()
							 .duration(0)
							 .style("position","absolute")
							 .style("bottom","auto")
							 .style("height",height+"px")
							 .style("background-color",background_color)
							 .style("top","calc(100% + 2em)")
							 .style("left","0px")
							 .style("width","100%")
							 ;
						self.position = 2;
						if(!!self.pos_change_callback){
							self.pos_change_callback(2);
						}
					}
				}
				else{
					inner.interrupt().transition().duration(0)
							 .style("position","relative")
							 .style("width","auto")
							 .style("height",height+"px")
							 .style("background-color",background_color)
							 .style("top","auto")
							 .style("bottom","auto")
							 ;
					self.position = 0;
					if(!!self.pos_change_callback){
						self.pos_change_callback(0);
					}
				}
			}
			catch(e){
				if(!!inner){
					inner.style("position","relative").style("width","auto");
				}
			}
		}

		window.addEventListener("scroll", pos);
		window.addEventListener("resize", pos);

		//set up in next tick
		setTimeout(function(){pos();}, 0);

		//insurance
		setTimeout(function(){pos();}, 3000);
			
		return O;
	}

	return O;
}
