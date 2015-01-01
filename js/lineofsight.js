(function () {

	function hasLOSthroughEdge(edge) {
		if (edge.terrain.blocksLOS) {
			return false;
		}

		for (var ci in edge.cells) {
			var cell = edge.cells[ci];
			
			if (cell) {
				if (cell.terrain.blocksLOS)
					return false;

				//TODO: if a non ignored figure is here return false;
			}
		}

		return true;
	}

	//TODO: Parameter with array of figures/doors to ignore
	function hasLOSLine(map, sourceCenterX, sourceCenterY, sourceCornerX, sourceCornerY,
                        targetCenterX, targetCenterY, targetCornerX, targetCornerY){
		
		console.log("Checking LOS line sc=(" + sourceCornerX +", " + sourceCornerY + ") tc=(" + targetCornerX +", " + targetCornerY + ")");

		var minX = Math.min(sourceCornerX, targetCornerX);
		var maxX = Math.max(sourceCornerX, targetCornerX);
		var minY = Math.min(sourceCornerY, targetCornerY);
		var maxY = Math.max(sourceCornerY, targetCornerY);

		var EPSILON = 0.001;

		var isHorizontalLine = false;
		var isVerticalLine = false;
		var isPoint = false;

		if (Math.abs(sourceCornerY - targetCornerY) < EPSILON) { //should be 0, but let's be safe
			isHorizontalLine = true;
		}

		if (Math.abs(sourceCornerX - targetCornerX) < EPSILON) { //should be 0, but let's be safe
			if (isHorizontalLine) {
				isHorizontalLine = false;
				isPoint = true;
			} else {
				isVerticalLine = true;
			}
		}

		function cornerLOS(x, y) {
			//This function checks if there are two static LOS blocks on both sides of the LOS line.

			//jeżeli sourceY i targetY są większe od Y to nie bierz pod uwagę niczego oprócz Up
			/*
			var upBlock = map.getCell(x, y).getEdge(DIR_LEFT).terrain.blocksLOS; //TODO: Doors?
			var downBlock = map.getCell(x, y-1).getEdge(DIR_LEFT).terrain.blocksLOS;
			var leftBlock = map.getCell(x-1, y).getEdge(DIR_BOTTOM).terrain.blocksLOS;
			var rightBlock = map.getCell(x, y).getEdge(DIR_BOTTOM).terrain.blocksLOS;

			var hardBlockedASide = (x1 < x ? upBlock : downBlock) || (y1 < y ? leftBlock : rightBlock);
			var hardBlockedBSide = (x1 < x ? downBlock : upBlock) || (y1 < y ? rightBlock : leftBlock);


			//if x y jest celem to wtedt to:
			//JAK TO KURDE ZROBIĆ?????


			if (sourceCenterY > y && targetCenterY > y) {
				hardBlockedASide = upBlock;
				hardBlockedBSide = downBlock || rightBlock || leftBlock;
			}

			if (sourceCenterY < y && targetCenterY < y) {
				hardBlockedASide = downBlock;
				hardBlockedBSide = upBlock || rightBlock || leftBlock;
			}

			if (sourceCenterX > x && targetCenterX > x) {
				hardBlockedASide = rightBlock;
				hardBlockedBSide = downBlock || upBlock || leftBlock;
			}

			if (sourceCenterX < x && targetCenterX < x) {
				hardBlockedASide = leftBlock;
				hardBlockedBSide = upBlock || rightBlock || downBlock;
			}

			
			return !(hardBlockedASide && hardBlockedBSide);*/

			/////
			/////    (0,1)|(1,1)
			/////    -----+-----
			/////    (0,0)|(1,0)

			//console.log("Corner (" + x +", " + y + ")");
		

			var upBlock = map.getCell(x, y).getEdge(DIR_LEFT).terrain.blocksLOS; //TODO: Doors?
			var downBlock = map.getCell(x, y-1).getEdge(DIR_LEFT).terrain.blocksLOS;
			var leftBlock = map.getCell(x-1, y).getEdge(DIR_BOTTOM).terrain.blocksLOS;
			var rightBlock = map.getCell(x, y).getEdge(DIR_BOTTOM).terrain.blocksLOS;

			var blockedInfo = [upBlock, rightBlock, downBlock, leftBlock];

			var allRelPositions = [{x:1, y:1}, {x:1, y:0}, {x:0, y:0}, {x:0, y:1}];
			var availablePositions = [false, false, false, false];
			var reachedArcPositions = [false, false, false, false];

			$.each(allRelPositions, function (i, pos) {
				var sourceCorner = x == sourceCornerX && y == sourceCornerY;

				if ((pos.x > 0.5 && sourceCenterX > x ||
                     pos.x < 0.5 && sourceCenterX < x ||
                     (isVerticalLine && !sourceCorner)) &&
					(pos.y > 0.5 && sourceCenterY > y ||
                     pos.y < 0.5 && sourceCenterY < y ||
                     (isHorizontalLine && !sourceCorner))) {
					availablePositions[i] = true;
				}
			});

			//console.log("Corner (" + x +", " + y + ") - availablePositions =", availablePositions);
			//console.log("Corner (" + x +", " + y + ") - blockedInfo =", blockedInfo);

			$.each(availablePositions, function (posi, available) {
				if (available) {
					for (var cwstep = 0; cwstep < 4; cwstep++) {
						var currentCWPos = (posi + cwstep) % 4;
						//console.log("Corner (" + x +", " + y + ") - cw reached ", currentCWPos, posi, cwstep);
						reachedArcPositions[currentCWPos] = true;
						if (blockedInfo[(currentCWPos + 1) % 4]) {
							break;
						}
					}

					for (var ccwstep = 0; ccwstep < 4; ccwstep++) {
						var currentCCWPos = (4 + posi - ccwstep) % 4;
						//console.log("Corner (" + x +", " + y + ") - ccw reached ", currentCCWPos);
						reachedArcPositions[currentCCWPos] = true;
						if (blockedInfo[currentCCWPos]) {
							break;
						}
					}
				}
			});

			//console.log("Corner (" + x +", " + y + ") - reachedArcPositions =", reachedArcPositions);

			var retValue = false;
			$.each(reachedArcPositions, function (posi, reached) {
				if (reached) {
					var pos = allRelPositions[posi];

					if (x == targetCornerX && y == targetCornerY) {
						//if this is the last corner we have to reach the figure position
						if ((pos.x > 0.5 && targetCenterX > x ||
                             pos.x < 0.5 && targetCenterX < x) &&
							(pos.y > 0.5 && targetCenterY > y ||
                             pos.y < 0.5 && targetCenterY < y)) {
							//console.log("Corner (" + x +", " + y + ") - target found at =", [x, y], pos);
							retValue = true;
							return false;
						}

					} else {
						if ((pos.x > 0.5 && targetCornerX > x ||
                             pos.x < 0.5 && targetCornerX < x ||
                             isVerticalLine) &&
							(pos.y > 0.5 && targetCornerY > y ||
                             pos.y < 0.5 && targetCornerY < y ||
                             isHorizontalLine)) {
							retValue = true;
							return false;
						}
					}
				}
			});

			//console.log("Corner (" + x +", " + y + ") - ", retValue ? "LOS" : "FAIL");

			return retValue;
		}


		//y = (y0 - y1)/(x0 - x1)*x + (y1x0 - y0x1)/(x0 - x1);

		var x0 = sourceCornerX;
		var y0 = sourceCornerY;

		var x1 = targetCornerX;
		var y1 = targetCornerY;

		function verticalLinesLOS() {
			for (var x = minX; x <= maxX; x++) {
				var y = ((y0 - y1) * x + y1 * x0 - y0 * x1)/(x0 - x1);

				if (Math.abs(Math.round(y) - y) < EPSILON) {
					//True corner case
					if (!cornerLOS(x, Math.round(y))) {
						return false;
					}
				} else {
					//else find vertical edge corresponding to x, y
					console.log("vertical edge", x, y);
					if (!hasLOSthroughEdge(map.getCell(x, Math.floor(y)).getEdge(DIR_LEFT))) {
						console.log("vertical edge", x, y, "FAIL");
						return false;
					}
				}
			}
			return true;
		}
		
		function horizontalLinesLOS() {
			for (var y = minY; y <= maxY; y++) {
				var x = ((x0 - x1) * y - y1 * x0 + y0 * x1)/(y0 - y1);

				if (Math.abs(Math.round(x) - x) < EPSILON) {
					//corner case
					if (!cornerLOS(Math.round(x), y)) {
						return false;
					}
				} else {
					//check with edge
					console.log("horizontal edge", x, y);
					if (!hasLOSthroughEdge(map.getCell(Math.floor(x), y).getEdge(DIR_BOTTOM))) {
						console.log("horizontal edge", x, y, "FAIL");
						return false;
					}
				}
			}
			return true;
		}

		var result = true;
		if (isPoint) {
			result = cornerLOS(sourceCornerX, sourceCornerY);
		} else {
			result = (isHorizontalLine || horizontalLinesLOS()) && (isVerticalLine || verticalLinesLOS());
		}

		console.log("Checking LOS line sc=(" + sourceCornerX +", " + sourceCornerY + ") tc=(" + targetCornerX +", " + targetCornerY + ") -", result ? "SUCCESS" : "NO LOS");
		return result;
	}

	IAMap.prototype.hasLOS = function(sourceX, sourceY, targetX, targetY) {
		var corners = [{x:0, y:0}, {x:1, y:0}, {x:1, y:1}, {x:0, y:1}];

		for (var ci0 = 0; ci0 < corners.length; ci0++) { //HACK: TESTING PURPOSES ONLY ONE CORNER
			var cornerX = sourceX + corners[ci0].x;
			var cornerY = sourceY + corners[ci0].y;

			//This is not very efficient, but should be good enough
			for (var ci1 = 0; ci1 < corners.length; ci1++) { //HACK: TESTING PURPOSES ONLY ONE CORNER
				var targetCorner1X = targetX + corners[ci1].x;
				var targetCorner1Y = targetY + corners[ci1].y;
				var targetCorner2X = targetX + corners[(ci1 + 1) % 4].x;
				var targetCorner2Y = targetY + corners[(ci1 + 1) % 4].y;

				//check if intersecting, lines only intersect if corners form a grid line
				if ((cornerX === targetCorner1X && cornerX === targetCorner2X) ||
					(cornerY === targetCorner1Y && cornerY === targetCorner2Y)) {
					continue;
				}

				//check if something is blocking any of the lines (excluding the source and target figures)
				if (hasLOSLine(this, sourceX + 0.5, sourceY + 0.5, cornerX, cornerY, targetX + 0.5, targetY + 0.5, targetCorner1X, targetCorner1Y) &&
					hasLOSLine(this, sourceX + 0.5, sourceY + 0.5, cornerX, cornerY, targetX + 0.5, targetY + 0.5, targetCorner2X, targetCorner2Y)) {
					console.log("**** LOS **** i=" + ci0 + " sc=(" + cornerX +", " + cornerY + ") tc1=(" + targetCorner1X +", " + targetCorner1Y + ") tc2=(" + targetCorner2X +", " + targetCorner2Y + ")");
					return true;
				}
			}
		}
		console.log("**** NO LOS ****");
		return false;
	};
})();