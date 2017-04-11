
var root = 
{ 
	
	'es': { id: 689592,   name: "Filosof&iacute;a"},
	
}

var shadowX = 9;
var shadowY = 9;
var shadowBlur = 5;
var shadowColor = '#555'

function init()
{
    return new $jit.RGraph({
	
        injectInto: 'infovis',
		levelDistance: 26,    
		
        Navigation: {      
			enable: true,  
			panning: 'avoid nodes',  
			zooming: 100  
        },
		
        Node: {  
			overridable: true,
			type: 'outlined',
			height: 30,
			CanvasStyles: {  
			  shadowColor: shadowColor,  
			  shadowOffsetX: shadowX,
			  shadowOffsetY: shadowY,
			  shadowBlur: shadowBlur
			}
        },
        
        Edge: {
			overridable: true, 
			color: '#000',
			lineWidth: 1,
			CanvasStyles: {  
			  shadowColor: shadowColor,  
			  shadowOffsetX: shadowX,
			  shadowOffsetY: shadowY,
			  shadowBlur: shadowBlur
			}  			
        },
		  
		Label: {  
			overridable: true,
			size: 11,  
			color: '#fff',
			type: 'HTML',
			family: 'Trebuchet MS, Lucida Grande, sans-serif'
		}, 
		
		Events: {    
			enable: true,  
			type: 'Native', 
			onClick: function(node) {
				if(node) {
					rgraphic.onClick(node.id);
				}
			},
			onMouseEnter: function(node, eventInfo, e) {  
				if(node) {
					node.stuff = 'enter';  
					rgraphic.fx.plotNode(node, rgraphic.canvas);
				}
			},  
			onMouseLeave: function(node, eventInfo, e) {   
				if(node) {
					node.stuff = 'leave';  
					rgraphic.fx.plotNode(node, rgraphic.canvas);
				}  
			}
		},
		
		onBeforePlotNode: function(node) {
			if(node._depth == 0) {
				node.setLabelData('size', 16);
			}
		},
        
        onCreateLabel: function(domElement, node) {
			style = node.id == root[lang].id ? " style='font-size:16px;font-weight:bold'" : "";
			domElement.innerHTML = '<a' + style + ' href="http://' + lang + '.wikipedia.org/wiki/' + node.name + '" target="_blank">' + node.name + '</a>';
        },
		
        onPlaceLabel: function(domElement, node) {
            var style = domElement.style;			
            style.display = '';
            style.cursor = 'pointer';
		
			if($(domElement).hasClass('trunk')) {
				if(rgraphic.canvas.scaleOffsetX < .5) {
					$(domElement).css('display', 'none');
				}
				else 
				{					
					$(domElement).css('display', 'inline');
				}
			}

            var left = parseInt(style.left);
			var top  = parseInt(style.top);
            var w = domElement.offsetWidth;
			style.top = (top + 2) + 'px';
            style.left = (left - w / 2) + 'px';
						
			if((node.adjacencyCount() == 2) && (node._depth != 0) && (node.id != root[lang].id)) {
				$(domElement).addClass('trunk');
				$(domElement).removeClass('leaf');
			}
			else {
				$(domElement).removeClass('trunk');
				$(domElement).addClass('leaf');
			}
        }
    });
}

$jit.Graph.Node.prototype.adjacencyCount = function() {
	var count = 0;
	this.eachAdjacency(function() { count ++ });
	return count;
}

$jit.RGraph.Plot.NodeTypes.implement({  
    outlined: {  
		render: function(node, canvas) {
			var ctx = canvas.getCtx();  		
			var pos = node.getPos().toComplex();
			
			if(node.stuff == 'enter') {
				ctx.fillStyle = '#232';
				ctx.shadowColor = 'rgba(255,0,0,0)';
				node.stuff = null;
			}
			else if (node.stuff == 'leave') {
				ctx.fillStyle = '#0b0';
				ctx.shadowColor = 'rgba(0,0,0,0)';
				node.stuff = null;
			}
			else {			
				ctx.fillStyle = '#0b0';
				$('#' + node.id).removeClass('hover')
			}
			
			ctx.strokeStyle = '#000';
			ctx.lineWidth   = 3;
			
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, node.id == root[lang].id ? 5 : 3, 0, Math.PI * 2, false);
			ctx.closePath();
			ctx.stroke();
			ctx.fill();
		},
		contains: function(node, pos) {
			var npos = node.pos.getc(true), 
            dim = node.getData('dim') + 5;
			var contained = this.nodeHelper.circle.contains(npos, pos, dim);
			return contained;
		}
	}  
});

$jit.RGraph.prototype.print = function() {
	var ctx = this.canvas.getCtx();
	 
	var origLabels = this.fx.labels;
	this.fx.labels = new $jit.RGraph.Label['Native'](this) 
	this.plot();
	var url = ctx.canvas.toDataURL();
	this.fx.labels = origLabels;
	this.plot();
	
	return url;
};
/**/
$jit.RGraph.prototype.onClick = function(id, opt) {
    if (this.root != id && !this.busy) {
      this.busy = true;
      this.root = id;
      var that = this;
      this.controller.onBeforeCompute(this.graph.getNode(id));
      var obj = this.getNodeAndParentAngle(id);

      // second constraint
      this.tagChildren(obj.parent, id);
      this.parent = obj.parent;
      this.compute('end');

      // first constraint
      this.graph.eachNode(function(elem){
		var pos = elem.getPos('end');
		pos.theta = plotter(pos);
      });

      var mode = this.config.interpolation;
      opt = $jit.util.merge( {
        onComplete: $jit.util.empty
      }, opt || {});

      this.fx.animate($jit.util.merge( {
        hideLabels: true,
        modes: [
          mode
        ]
      }, opt, {
        onComplete: function(){
          that.busy = false;
          opt.onComplete();
        }
      }));
    }
};

$jit.RGraph.Plot.prototype.plot = function(opt, animating) {
    var viz = this.viz, 
        aGraph = viz.graph, 
        canvas = viz.canvas, 
        id = viz.root, 
        that = this, 
        ctx = canvas.getCtx(), 
        min = Math.min,
        opt = opt || this.viz.controller;
    
    opt.clearCanvas && canvas.clear();
      
    var root = aGraph.getNode(id);
    if(!root) return;
	
	var width = canvas.getSize().width;
	var height = canvas.getSize().height;
	
	ctx.save();
	ctx.fillStyle = '#686868';
	ctx.rect(-(width/2),-(height/2),width,height);
	ctx.fill();
	ctx.restore();
    
    var T = !!root.visited;
    aGraph.eachNode(function(node) {
        var nodeAlpha = node.getData('alpha');
		node.eachAdjacency(function(adj) {
			var nodeTo = adj.nodeTo;
			if(!!nodeTo.visited === T && node.drawn && nodeTo.drawn) {
				!animating && opt.onBeforePlotLine(adj);
				that.plotLine(adj, canvas, animating);
				!animating && opt.onAfterPlotLine(adj);
			}
		});
		if(node.drawn) {
			!animating && opt.onBeforePlotNode(node);
			that.plotNode(node, canvas, animating);
			!animating && opt.onAfterPlotNode(node);
		}
		node.visited = !T;
    });
    aGraph.eachNode(function(node) {
        var nodeAlpha = node.getData('alpha');
        if(!that.labelsHidden && opt.withLabels) {
			if(node.drawn && nodeAlpha >= 0.95) {
				that.labels.plotLabel(canvas, node, opt);
			} else {
				that.labels.hideLabel(node, false);
			}
        }
        node.visited = !T;
    });
};

$jit.RGraph.prototype.createLevelDistanceFunc = function() {
    var ld = this.config.levelDistance;
    return function(elem) {
		return (elem._depth + 2) * ld;
    };
};
