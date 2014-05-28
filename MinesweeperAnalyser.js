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

var MinesweeperAnalyzer = (function() {
	'use strict';
	
	function MinesweeperAnalyzer(minesweeper) {
		/* The minesweeper to analysis */
		this.minesweeper = minesweeper;
		
		/* The private state */
		this.state = [];
		
		/* Positions of the potentials mines */
		this.mines = [];
		
		/* Potentials mine given by plain cells */
		this.plainCells = {};
		
		/* Number of misplaced mark */
		this.failCount = 0;
		
		/* Cells which are plain acording to the analysis */
		this.openPossibilities = [];
		
		/* Cells where are mines acording to the analysis */
		this.minesPossibilities = [];
	}
	
	MinesweeperAnalyzer.prototype.firstAnalysis = function() {
		var cell, j, emptyCell,
			value, markValue, borders, free,
			gridLength = this.minesweeper.w * this.minesweeper.h;
		
		this.mines = [];
		this.plainCells = {};
		this.failCount = 0;
		this.openPossibilities = [];
		this.minesPossibilities = [];
		this.state = this.minesweeper.state.slice();
		
		for (cell = 0; cell < gridLength; cell++) {
			// Fail check
			if (this.state[cell] === 2 && this.minesweeper.getValue(cell) >= 0) {
				this.failCount++;
			}
			// Search for possibilities
			else if (this.state[cell] === 1) {
				value = this.minesweeper.getValue(cell);
				markValue = this.getMarkValue(cell);
				borders = this.getBorderCase(cell);
				
				// Search empty cells around
				free = [];
				
				for (j = 0; j < borders.length; j++) {
					emptyCell = borders[j];
					
					if (this.isBlank(emptyCell)) {
						free.push(emptyCell);
					}
				}
				
				if (value !== markValue) {
					// The plain case doesn't have all its mines
					
					
					// Number of empty cells match the mine lack
					if (value - markValue === free.length) {
						for (j = 0; j < free.length; j++) {
							this.markMine(free[j], cell);
						}
					}
					else {
						// Mark the empty cells as possibilities
						
						this.plainCells[cell] = [value - markValue, []];
						
						for (j = 0; j < free.length; j++) {
							emptyCell = free[j];
							
							if (this.mines[emptyCell] === undefined) {
								this.mines[emptyCell] = [];
							}
							
							this.mines[emptyCell].push(cell);
							
							this.plainCells[cell][1].push(emptyCell);
						}
					}
				}
				else {
					// Mark the empty cells as plain cells
					for (j = 0; j < free.length; j++) {
						this.removeMineFrom(free[j], -1);
						
						this.openPossibilities.push(free[j]);
						
						this.state[free[j]] = 5;
					}
				}
			}
		}
	};
	
	MinesweeperAnalyzer.prototype.secondAnalysis = function() {
		var changed, plainCell, i;
		
		do {
			changed = false;
			
			for (plainCell in this.plainCells) {
				plainCell = parseInt(plainCell, 10);
				
				if (this.plainCells[plainCell][0] > 0 && this.plainCells[plainCell][0] === this.plainCells[plainCell][1].length) {
					var poses = this.plainCells[plainCell][1].slice();
					
					for (i = 0; i < poses.length; i++) {
						this.markMine(poses[i], plainCell);
					}
					
					this.plainCells[plainCell] = [0, []];
					
					changed = true;
				}
				else if (this.plainCells[plainCell][0] === 0 && this.minesweeper.getValue(plainCell) === this.getMarkValue(plainCell)) {
					var borders = this.getBorderCase(plainCell);
					
					for (i = 0; i < borders.length; i++) {
						
						if (this.isBlank(borders[i])) {
							
							this.removeMineFrom(borders[i], -1);
							
							this.openPossibilities.push(borders[i]);
							
							this.state[borders[i]] = 5;
							
							changed = true;
						}
					}
				}
			}
		} while (changed);
	};
	
	MinesweeperAnalyzer.prototype.remove = function(mineCell, initialCell) {
		var borders, cell, plainCell;
		
		if (this.mines[mineCell] === undefined) {
			return;
		}
		
		borders = this.getBorderCase(mineCell);
		
		for (cell = 0; cell < borders.length; cell++) {
			plainCell = borders[cell];
			
			if (plainCell !== initialCell && this.isPlain(plainCell)) {
				
				this.removeMineFrom(mineCell, initialCell);
				
				/*
				 TODO: Useless ?
				if (this.plainCells[plainCell] !== undefined && this.plainCells[plainCell][0] === 0) {
					this.removeAllMinesAround(plainCell);
				}
				*/
			}
		}
		
		delete this.mines[mineCell];
	};
	
	MinesweeperAnalyzer.prototype.removeMineFrom = function(mineCell, initialCell) {
		var i, cell;
		
		if (this.mines[mineCell] === undefined) {
			return;
		}
		
		for (i = 0; i < this.mines[mineCell].length; i++) {
			cell = this.mines[mineCell][i];
			
			if (cell !== initialCell) {
				if (this.plainCells[cell] !== undefined) {
					
					if (initialCell >= 0) {
						this.plainCells[cell][0]--;
					}
					
					var p = this.plainCells[cell][1].indexOf(mineCell);
					
					if (p >= 0) {
						this.plainCells[cell][1].splice(p, 1);
					}
				}
			}
		}
		
		delete this.mines[mineCell];
	};
	
	
	/*
	 TODO: Useless ?
	MinesweeperAnalyzer.prototype.removeAllMinesAround = function(plainCell) {
		var borders = this.getBorderCase(plainCell),
			i, j, cell;
		
		console.log('>>>', borders.length);
		
		for (i = 0; i < borders.length; i++) {
			cell = borders[i];
			
			if (this.plainCells[cell] !== undefined && this.plainCells[cell][0] > 0) {
				
				for (j = 0; j < this.plainCells[cell][1].length; j++) {
					
					this.removeMineFrom(this.plainCells[cell][1][j], cell);
				}
			}
		}
	};
	*/
	
	
	/*
	 * Return the 3-8 position around the (fx, fy) case
	 */
	MinesweeperAnalyzer.prototype.getBorderCase = function(fx, fy) {
		var i, j, x, y, cases = [];
		
		if (fy === undefined) {
			fy = Math.floor(fx / this.minesweeper.w);
			fx = fx % this.minesweeper.w;
		}
		
		for (i = -1; i < 2; i++) {
			for (j = -1; j < 2; j++) {
				x = fx + i;
				y = fy + j;
				
				if ((i !== 0 || j !== 0) && x >= 0 && x < this.minesweeper.w && y >= 0 && y < this.minesweeper.h) {
					cases.push(y * this.minesweeper.w + x);
				}
			}
		}
		
		return cases;
	};
	
	MinesweeperAnalyzer.prototype.isMarked = function(pos) {
		return this.state[pos] === 2 || this.state[pos] === 4;
	};
	
	MinesweeperAnalyzer.prototype.isPlain = function(pos) {
		return this.state[pos] === 1 || this.state[pos] === 5;
	};
	
	MinesweeperAnalyzer.prototype.isBlank = function(pos) {
		return this.state[pos] === undefined || this.state[pos] === 3;
	};
	
	MinesweeperAnalyzer.prototype.getMarkValue = function(pos) {
		var i, mark = 0, borders;
		
		borders = this.getBorderCase(pos);
		
		for (i = 0; i < borders.length; i++) {
			if (this.isMarked(borders[i])) {
				mark++;
			}
		}
		
		return mark;
	};
	
	MinesweeperAnalyzer.prototype.markMine = function(cell, plainCell) {
		this.state[cell] = 4;
		
		this.remove(cell, plainCell);
		
		this.minesPossibilities.push(cell);
	};
	
	
	return MinesweeperAnalyzer;
})();