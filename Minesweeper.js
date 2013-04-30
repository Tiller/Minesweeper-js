/*
		DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
					Version 2, December 2004 

 Copyright (C) 2004 Sam Hocevar <sam@hocevar.net> 

 Everyone is permitted to copy and distribute verbatim or modified 
 copies of this license document, and changing it is allowed as long 
 as the name is changed. 

			DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION 

  0. You just DO WHAT THE FUCK YOU WANT TO.
*/

var Minesweeper = (function() {
	'use strict';
	
	function Minesweeper(w, h, c) {
		/* Grid's width */
		this.w = w;
		
		/* Grid's height */
		this.h = h;
		
		/* Mine count */
		this.c = c;
		
		/* Marked mine count */
		this.markedMine = 0;
		
		/* Opened case count */
		this.openedCase = 0;
		
		/* First move date */
		this.startTime = null;
		
		/* Finish move date */
		this.endTime = null;
		
		/* DOM elements */
		this.cells = [];
		
		/* Mines positions */
		this.values = [];
		
		/* Cases's states, 1: opened, 2: mine marked, 3: '?' marked */
		this.state = [];
		
		/* Table dom element */
		this.dom = this.generateDom();
		
	}
	
	
	/*
	 * Generate the cells of the table
	 */
	Minesweeper.prototype.generateDom = function() {
		var dom = document.createElement('div'),
			tr, td,
			x, y,
			width = (100 / this.w).toFixed(2),
			height = (100 / this.h).toFixed(2),
			that = this,
			generated = false,
			eventApplier;
		
		dom.className = 'minesweeper';
		
		eventApplier = function(td, x, y) {
			td.addEventListener('click', function(e) {
				if (e.ctrlKey || e.altKey) {
					that.mark(y * that.w + x);
					
					return;
				}
				
				if (! generated) {
					generated = true;
					that.generateFrom(x, y);
				}
				
				that.open(y * that.w + x);
			}, false);
			
			td.addEventListener('contextmenu', function(e) {
				that.mark(y * that.w + x);
				
				e.preventDefault();
			}, false);
			
			td.addEventListener('mousedown', function(e) {
				e.preventDefault();
			}, false);
			
		};
		
		for (y = 0; y < this.h; y++) {
			tr = document.createElement('div');
			tr.className = 'row';
			tr.style.height = height + '%';
			
			for (x = 0, y; x < this.w; x++) {
				td = document.createElement('div');
				td.style.width = width + '%';
				td.title = y * this.w + x;
				
				eventApplier(td, x, y);
				
				this.cells[y * this.w + x] = td;
				
				tr.appendChild(td);
			}
			
			dom.appendChild(tr);
		}
		
		return dom;
	};
	
	/*
	 * Place the mines making the (fx, fy) safe
	 */
	Minesweeper.prototype.generateFrom = function(fx, fy) {
		var pos = [],
			index,
			i, l, c, p,
			forbidden = this.getBorderCase(fx, fy);
		
		console.log('Click on ', fx, fy, fy * this.w + fx);
		
		this.startTime = Date.now();
		
		// Generate an in-line grid
		
		forbidden.push(fy * this.w + fx);
		
		for (i = 0, l = this.w * this.h; i < l; i++) {
			if (forbidden.indexOf(i) < 0) {
				pos.push(i);
			}
		}
		
		// Randomize
		
		for (c = this.c, l = pos.length; c > 0; c--) {
			p = Math.floor(Math.random() * l--);
			index = pos.splice(p, 1)[0];
			
			this.values[index] = -1;
		}
		
		// Set the values
		
		for (i = 0, l = this.w * this.h; i < l; i++) {
			if (this.values[i] === undefined) {
				this.values[i] = this.calcValue(i);
			}
		}
		
		this.resized();
	};
	
	
	/*
	 * Set the font size depending on the table height
	 */
	Minesweeper.prototype.resized = function() {
		this.dom.style.fontSize = '1px';
		
		this.dom.style.fontSize = (this.dom.offsetHeight / (1.5 * this.h)) + 'px';
		this.dom.style.lineHeight = (this.dom.offsetHeight / this.h) + 'px';
	};
	
	
	/*
	 * Return the 3-8 position around the (fx, fy) case
	 */
	Minesweeper.prototype.getBorderCase = function(fx, fy) {
		var cases = [];
		
		if (fy === undefined) {
			fy = Math.floor(fx / this.w);
			fx = fx % this.w;
		}
		
		if (fx !== 0) {
			cases.push(fy * this.w + fx - 1);
			
			if (fy !== 0) {
				cases.push((fy - 1) * this.w + fx - 1);
			}
			if (fy !== this.h - 1) {
				cases.push((fy + 1) * this.w + fx - 1);
			}
		}
		
		if (fy !== 0) {
			cases.push((fy - 1) * this.w + fx);
		}
		if (fy !== this.h - 1) {
			cases.push((fy + 1) * this.w + fx);
		}
		
		if (fx !== this.w - 1) {
			cases.push(fy * this.w + fx + 1);
			
			if (fy !== 0) {
				cases.push((fy - 1) * this.w + fx + 1);
			}
			if (fy !== this.h - 1) {
				cases.push((fy + 1) * this.w + fx + 1);
			}
		}
		
		return cases;
	};
	
	/*
	 * Return the previously calculated mine count around the (fx, fy) case
	 */
	Minesweeper.prototype.getValue = function(fx, fy) {
		if (fy !== undefined) {
			fx += fy * this.w;
		}
		
		return this.values[fx];
	};
	
	/*
	 * Return the mine count around the (fx, fy) case
	 */
	Minesweeper.prototype.calcValue = function(fx, fy) {
		var sum = 0,
			i,
			borders = this.getBorderCase(fx, fy);
		
		for (i = 0; i < borders.length; i++) {
			if (this.values[borders[i]] < 0) {
				sum++;
			}
		}
		
		return sum;
	}
	
	/*
	 * Open the given case (left click)
	 */
	Minesweeper.prototype.open = function(pos) {
		var num, borders, that = this;
		
		if (this.state[pos] !== undefined) {
			return;
		}
		this.state[pos] = 1;
		
		if (this.values[pos] < 0) {
			this.cells[pos].innerHTML = 'X';
			this.cells[pos].className = 'openCase caseX';
			this.state[pos] = 2;
			this.markedMine++;
		}
		else {
			num = this.getValue(pos);
			
			this.cells[pos].innerHTML = num;
			this.cells[pos].className = 'openCase case' + num;
			this.cells[pos].addEventListener('dblclick', function() {
				if (that.getMarkedMineCount(pos) === num) {
					that.getBorderCase(pos).map(that.open, that);
				}
			}, false);
			
			if (num === 0) {
				borders = this.getBorderCase(pos);
				
				borders.map(this.open, this);
			}
			
			this.openedCase++;
			
			if (this.openedCase + this.c === this.w * this.h) {
				this.endTime = Date.now();
			}
		}
	};
	
	/*
	 * Mark the given case ; rotate between " " -> "X" -> "?" (right click)
	 */
	Minesweeper.prototype.mark = function(pos) {
		if (this.state[pos] === 1) {
			return;
		}
		switch (this.state[pos]) {
			case 1:
				return;
				
			case 2:
				this.state[pos] = 3;
				this.cells[pos].innerHTML = '?';
				this.cells[pos].className = 'markAsk';
				this.markedMine--;
				
				break;
				
			case 3:
				delete this.state[pos];
				this.cells[pos].innerHTML = '';
				this.cells[pos].className = '';
				
				break;
			
			default:
				this.state[pos] = 2;
				this.cells[pos].innerHTML = 'X';
				this.cells[pos].className = 'markMine';
				this.markedMine++;
				
		}
	};
	
	/*
	 * Return the game duration
	 */
	Minesweeper.prototype.getDuration = function() {
		if (this.startTime === null) {
			return 0;
		}
		
		if (this.endTime !== null) {
			return this.endTime - this.startTime;
		}
		
		return Date.now() - this.startTime;
	};
	
	/*
	 * Return the marked mine count around the given pos, or in the whole grid
	 */
	Minesweeper.prototype.getMarkedMineCount = function(pos) {
		var i, mark = 0, borders;
		
		if (pos === 'undefined') {
			return this.markedMine;
		}
		
		borders = this.getBorderCase(pos);
		
		for (i = 0; i < borders.length; i++) {
			if (this.state[borders[i]] === 2) {
				mark++;
			}
		}
		
		return mark;
	};
	
	/*
	 * Return the mine count
	 */
	Minesweeper.prototype.getMineCount = function() {
		return this.c;
	};
	
	
	
	return Minesweeper;
})();