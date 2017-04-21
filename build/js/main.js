//add browser compat message: test for svg, array.filter and map

//To do: review handling of missing values in all modules: both implicit and explicit missings

//shared js-modules
import card from '../../../js-modules/card-api.js';
import nameshort from '../../../js-modules/nameshort.js';
import dir from '../../../js-modules/rackspace.js';
import met_map from '../../../js-modules/met-map.js';
import format from '../../../js-modules/formats.js';

import catbar from './catbar.js';

//dir.local("./").add("data")
dir.add("data", "cleantech-patenting/data")

function main(){

	var width = 960;
	var height = 500;
	var aspect = 9/16;
	var pi2 = Math.PI*2;

	//listing of the tech categories in the map menu -- map is labeled with the indicator names in the data, however
	var technodes = [
		{name:"Total cleantech patents", var:"V5"},
		{name:"Cleantech patents per capita", var:"V9"},
		{name:"Advanced green materials", var:"V15"},
		{name:"Air", var:"V13"},
		{name:"Conventional fuel", var:"V16"},
		{name:"Bioenergy", var:"V14"},
		{name:"Energy efficiency", var:"V17"},
		{name:"Energy storage", var:"V24"},
		{name:"Geothermal", var:"V21"},
		{name:"Hydro/marine power", var:"V25"},
		{name:"Nuclear", var:"V22"},
		{name:"Recycling", var:"V18"},
		{name:"Solar", var:"V19"},
		{name:"Transportation", var:"V23"},
		{name:"Water/wastewater", var:"V20"},	
		{name:"Wind", var:"V12"}
	]

	var techlookup = {};
	for(var tl=0; tl<technodes.length; tl++){
		techlookup[technodes[tl].var] = technodes[tl].name;
	}

	var wrap = d3.select("#met-map").style("width","100%").style("overflow","hidden");

	catbar(dir.url("data","energy_innovation_cat.json"));

	d3.json(dir.url("data", "energy_innovation.json"), function(err, data){

		if(!!err){
			svg.style("visibility", "hidden");
			return null;
		}

		//build a variable lookup
		var varlookup = {};
		for(var vl=0; vl<data.vars.length; vl++){
			//replace inconsistent spacing and use of commas with standard use
			varlookup[data.vars[vl].var] = data.vars[vl].name.replace(/[\s,]*2011-2016/, ", 2011–2016");
		}

		var maxmax = d3.max(data.obs, function(d){
			return d3.max(technodes.slice(2), function(t){
				return d[t.var];
			})
		});

		//build a metmap

		var map_titlebox = wrap.append("div").style("padding","0em 1em").style("border-bottom","1px solid #aaaaaa").style("margin","1em 1em 5px 1em");
		var map_title = map_titlebox.append("p").style("text-align","center").style("font-weight","bold").style("margin","1em 0em 5px 0em");
		var mapwrap = wrap.append("div").style("padding","0em 1em")
										.append("div")
										.style("margin","0em auto")
										.style("max-width","1600px")
										.style("min-width","400px")
										.classed("c-fix",true);

		var button_wrap = mapwrap.append("div").classed("button-wrap",true);
		button_wrap.append("div").append("p")
								 .text("Make a selection")
								 .style("text-align","center")
								 .style("font-style","italic")
								 ;

		var map_main = mapwrap.append("div").classed("map-wrap", true);

		var map = met_map(map_main.node());

		map.responsive().states().colors("#cef2d3","#31b244");

		map.store(data.obs, "all_data");
		map.data(data.obs, "V2");

		var current_indicator = technodes[0].var;

		var text_accessor = function(d){
			var row = d.obs;

			var tot = varlookup.V5 + ": <strong>" + format.num0(row.V5) + "</strong>";
			var pc = varlookup.V9 + ": <strong>" + format.num0(row.V9) + "</strong>";

			
			
			var selected = current_indicator in {V5:1, V9:1} ? null : varlookup[current_indicator] + ": <strong>" + format.num0(row[current_indicator]) + "</strong>";

			if(selected !== null){
				var text = [tot, pc, selected];
			}
			else{
				var text = [tot, pc];
			}

			var top_owners = [];
			if(!!row.V26){top_owners.push(row.V26)}
			if(!!row.V27){top_owners.push(row.V27)}
			if(!!row.V28){top_owners.push(row.V28)}

			if(top_owners.length > 0){
				var final_text = text.concat("<br /><strong>Top cleantech patent owners</strong>", top_owners)
			}
			else{
				var final_text = text;
			}

			return final_text;
		}

		map.format("num0")
			.textAccessor(text_accessor)
			.bubble(current_indicator, current_indicator, 30, 1);

		var buttons = button_wrap.append("div").classed("buttons",true).selectAll("p.cleancat").data(technodes)
			.enter()
			.append("p")
			.classed("cleancat",true)
			.html(function(d,i){return d.name})
			.style("margin-top",function(d){return d.name == "Advanced green materials" ? "1.5em" : null})
			;

		function syncbuttons(){
			buttons.classed("selected", function(d,i){return d.var == current_indicator});
			var txt = varlookup[current_indicator];			
			map_title.text(txt);
		}


		syncbuttons();

		buttons.on("mousedown", function(d, i){
			if(d.var == "V5"){
				map.maxval(null).bubble(d.var,d.var,30);
			}
			else if(d.var == "V9"){
				map.maxval(null).bubble(d.var,d.var,25);
			}
			else{
				map.maxval(maxmax).bubble(d.var,d.var,35);
			}
			current_indicator = d.var;
			syncbuttons();
		});

	}); //end d3.json callback

} //close main()

document.addEventListener("DOMContentLoaded", main);
