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
	this.mines = [];
	
	/* Cases's states, 1: opened, 2: mine marked, 3: '?' marked */
	this.state = [];
	
	/* Table dom element */
	this.dom = this.generateDom();
	
}


/*
 * Generate the cells of the table
 */
Minesweeper.prototype.generateDom = function() {
	var dom = document.createElement('table');
	dom.className = 'minesweeper';
	
	var tbody = document.createElement('tbody');
	var tr, td, div;
	var that = this;
	var generated = false;
	
	for (var x, y = 0; y < this.h; y++) {
		tr = document.createElement('tr');
		
		for (x = 0, y; x < this.w; x++) {
			td = document.createElement('td');
			div = document.createElement('div');
			
			(function(td, x, y) {
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
				
			})(td, x, y);
			
			this.cells[y * this.w + x] = td;
			
			td.appendChild(div);
			tr.appendChild(td);
		}
		
		tbody.appendChild(tr);
	}
	
	dom.appendChild(tbody);
	
	return dom;
}

/*
 * Place the mines making the (fx, fy) safe
 */
Minesweeper.prototype.generateFrom = function(fx, fy) {
	var pos = [];
	var index;
	
	this.startTime = Date.now();
	
	var forbidden = this.getBorderCase(fx, fy);
	forbidden.push(fy * this.w + fx);
	
	for (var i = 0, l = this.w * this.h; i < l; i++) {
		if (forbidden.indexOf(i) < 0) {
			pos.push(i);
		}
	}
	
	for (var c = this.c, l = pos.length, p; c > 0; c--) {
		p = Math.floor(Math.random() * l--);
		index = pos.splice(p, 1)[0];
		
		console.log(index);
		
		this.mines[index] = true;
	}
	
	this.dom.style.fontSize = (this.dom.offsetHeight / (1.5 * this.h)) + 'px';
};

/*
 * Return the 3-8 position around the (fx, fy) case
 */
Minesweeper.prototype.getBorderCase = function(fx, fy) {
	var cases = [];
	
	if (typeof fy == 'undefined') {
		fy = Math.floor(fx / this.w);
		fx = fx % this.w;
	}
	
	if (fx != 0) {
		cases.push(fy * this.w + fx - 1);
		
		if (fy != 0) {
			cases.push((fy - 1) * this.w + fx - 1);
		}
		if (fy != this.h - 1) {
			cases.push((fy + 1) * this.w + fx - 1);
		}
	}
	
	if (fy != 0) {
		cases.push((fy - 1) * this.w + fx);
	}
	if (fy != this.h - 1) {
		cases.push((fy + 1) * this.w + fx);
	}
	
	if (fx != this.w - 1) {
		cases.push(fy * this.w + fx + 1);
		
		if (fy != 0) {
			cases.push((fy - 1) * this.w + fx + 1);
		}
		if (fy != this.h - 1) {
			cases.push((fy + 1) * this.w + fx + 1);
		}
	}
	
	return cases;
};

/*
 * Return the mine count around the (fx, fy) case
 */
Minesweeper.prototype.getNumber = function(fx, fy) {
	var sum = 0;
	var borders = this.getBorderCase(fx, fy);
	
	for (var i = 0; i < borders.length; i++) {
		if (this.mines[borders[i]]) {
			sum++;
		}
	}
	
	return sum;
};

/*
 * Open the given case (left click)
 */
Minesweeper.prototype.open = function(pos) {
	if (typeof this.state[pos] != 'undefined') {
		return;
	}
	this.state[pos] = 1;
	
	if (this.mines[pos]) {
		this.cells[pos].firstChild.innerHTML = 'X';
		this.cells[pos].className = 'openCase caseX';
		this.markedMine++;
	}
	else {
		var num = this.getNumber(pos);
		var that = this;
		
		this.cells[pos].firstChild.innerHTML = num;
		this.cells[pos].className = 'openCase case' + num;
		this.cells[pos].addEventListener('dblclick', function() {
			var borders = that.getBorderCase(pos);
			var mark = 0;
			
			for (var i = 0; i < borders.length; i++) {
				if (that.state[borders[i]] == 2) {
					mark++;
				}
			}
			
			if (mark == num) {
				borders.map(that.open, that);
			}
		}, false);
		
		if (num === 0) {
			var borders = this.getBorderCase(pos);
			
			borders.map(this.open, this);
		}
		
		this.openedCase++;
		
		if (this.openedCase + this.c == this.w * this.h) {
			this.endTime = Date.now();
		}
	}
};

/*
 * Mark the given case ; rotate between " " -> "X" -> "?" (right click)
 */
Minesweeper.prototype.mark = function(pos) {
	if (this.state[pos] == 1) {
		return;
	}
	switch (this.state[pos]) {
		case 1:
			return;
			
		case 2:
			this.state[pos] = 3;
			this.cells[pos].firstChild.innerHTML = '?';
			this.cells[pos].className = 'markAsk';
			this.markedMine--;
			
			break;
			
		case 3:
			delete this.state[pos];
			this.cells[pos].firstChild.innerHTML = '';
			this.cells[pos].className = '';
			
			break;
		
		default:
			this.state[pos] = 2;
			this.cells[pos].firstChild.innerHTML = 'X';
			this.cells[pos].className = 'markMine';
			this.markedMine++;
			
	}
};

/*
 * Return the game duration
 */
Minesweeper.prototype.getDuration = function() {
	if (this.startTime == null) {
		return 0;
	}
	
	if (this.endTime != null) {
		return this.endTime - this.startTime;
	}
	
	return Date.now() - this.startTime;
};

/*
 * Return the marked mine count
 */
Minesweeper.prototype.getMarkedMineCount = function() {
	return this.markedMine;
};

/*
 * Return the mine count
 */
Minesweeper.prototype.getMineCount = function() {
	return this.c;
};



// Temp
var mine = new Minesweeper(30, 16, 99);

document.body.appendChild(mine.dom);

var infos = document.getElementById('infos');

setInterval(function() {
	infos.innerHTML = (mine.getDuration() / 1000).toFixed(2) + ' s - ' + (mine.getMineCount() - mine.getMarkedMineCount());
}, 100);

