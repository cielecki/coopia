////////////////////////////////////////////////////////////////////////////////
// Direction
////////////////////////////////////////////////////////////////////////////////
var DIR_TOP = {index: 0, deltaX: 0, deltaY: 1, cssName: 'top'};
var DIR_RIGHT = {index: 1, deltaX: 1, deltaY: 0, cssName: 'right'};
var DIR_BOTTOM = {index: 2, deltaX: 0, deltaY: -1, cssName: 'bottom'};
var DIR_LEFT = {index: 3, deltaX: -1, deltaY: 0, cssName: 'left'};
var DIRS = [DIR_TOP, DIR_RIGHT, DIR_BOTTOM, DIR_LEFT];

DIR_TOP.opposite = DIR_BOTTOM;
DIR_BOTTOM.opposite = DIR_TOP;
DIR_RIGHT.opposite = DIR_LEFT;
DIR_LEFT.opposite = DIR_RIGHT;

function deltaToDir(x, y) {
    if (x === 1 && y === 0) return DIR_RIGHT;
    if (x === -1 && y === 0) return DIR_LEFT;
    if (x === 0 && y === 1) return DIR_TOP;
    if (x === 0 && y === -1) return DIR_BOTTOM;

    throw "Unknown delta";
}

////////////////////////////////////////////////////////////////////////////////
// Other
////////////////////////////////////////////////////////////////////////////////

var CELL_WIDTH = 30;
var CELL_HEIGHT = 30;

var TERRAIN_NORMAL = {cellCssClass: 'aid-map-cell-normal', canMove: true, blocksLOS: false, canMoveIfMobile: true, entryCost: 1, edgeCss:'1px solid #AAA'};
var TERRAIN_WALL = {cellCssClass: 'aid-map-cell-wall', canMove: false, blocksLOS: true, canMoveIfMobile: false, entryCost: 0, edgeCss:'3px solid #000'};
var TERRAIN_IMPASSIBLE = {cellCssClass: 'aid-map-cell-impassible',canMove: false, blocksLOS: false, canMoveIfMobile: true, entryCost: 0, edgeCss:'1px dashed #F00'};
var TERRAIN_BLOCKED = {cellCssClass: 'aid-map-cell-blocked', canMove: false, blocksLOS: true, canMoveIfMobile: true, entryCost: 1, edgeCss:'1px solid #F00'};
var TERRAIN_DIFFICULT = {cellCssClass: 'aid-map-cell-difficult', canMove: true, blocksLOS: false, canMoveIfMobile: true, entryCost: 2, edgeCss:'1px solid #00F'};

function IAMap() {
    var map = this;

    this.createObject = function (objectType) {
        var obj = {};

        obj.map = map;
        obj.x = 0; //x, y is always the bottom left corner.
        obj.y = 0;
        obj.width = 1; //if width or height is 0 that means it's a DOOR like object sitting on the edge.
        obj.height = 1;
        obj.name = 'Door';
        obj.typeId = 'DOOR';
        obj.isFigure = false;
        obj.blocksLOS = true;
        obj.hardBlocksLOS = false;
        obj.isFocused = false;
        obj.isBleeding = false;
        obj.isStunned = false;
        obj.img = '';

        obj.screenX = function () { return CELL_WIDTH * this.x; };
        obj.screenY = function () { return CELL_HEIGHT * (map.height - this.y); };

        for(var k in objectType) obj[k] = objectType[k];

        return obj;
    };

    function visitCellsAndEdgesOfAnObject(object, visitor) {
        for (var x = object.x; x <= object.x + object.width; x++) {
            for (var y = object.y; y <= object.y + object.height; y++) {

                // cells
                if (x < object.x + object.width && y < object.y + object.height)
                    visitor(map.getCell(x, y));

                //this also handles door like objects that sit only on the edge
                if (((object.x < x  && x < object.x + object.width) || object.width === 0) &&
                    (y + 1 <= object.y + object.height)) {
                    visitor(map.getCell(x, y).getEdge(DIR_TOP)); // internal edges
                }

                //this also handles door like objects that sit only on the edge
                if (((object.y < y  && y < object.y + object.height) || object.height === 0) &&
                    (x + 1 <= object.x + object.width)) {
                    visitor(map.getCell(x, y).getEdge(DIR_RIGHT)); // internal edges
                }
            }
        }
    }

    this.integrityCheck = function() {
        //check if objects are properly assigned to grid
    };


    this.calculateNearestValidPlacementsFor = function(object) {
        //TODO: verify this
        //TODO: Big figures
        //TODO: Verify mobility, impassible etc not only adjency

        if (object.isFigure && this.getCell(object.x,object.y).hasFigure()) {
            var visited = {};
            var toVisit = [{x: object.x, y: object.y, distance: 0}];
            var results = [];
            var maxDistance = 1000000; //TODO: Should be max number

            var adjecentVisitor = function (adjecentCell) {
                var adjecent = {x: adjecentCell.x, y: adjecentCell.y, distance: current.distance + 1};

                if (map.isAdjecent(current.x, current.y, adjecent.x, adjecent.y)) {
                    toVisit.push(adjecent);
                }
            };

            while (toVisit.length > 0) {
                var current = toVisit.pop();

                if (visited[current.x + ":" + current.y] && visited[current.x + ":" + current.y] <= current.distance) {
                    continue;
                }

                if (current.distance > maxDistance) {
                    continue;
                }

                visited[current.x + ":" + current.y] = current.distance;

                this.getCell(current.x,current.y).visitNeighbouringCells(adjecentVisitor);
                
                if (!this.getCell(current.x,current.y).hasFigure()) {
                    if (maxDistance > current.distance) {
                        maxDistance = current.distance;
                        results = [];
                    }
                    results.push(current);
                }
            }

            return results;
            //if meets criteria add to results
        } else {
            return [{x: object.x, y: object.y}];
        }

        return [];
    };

    this.placeObject = function(object) {
        var placements = this.calculateNearestValidPlacementsFor(object);
        console.log("placements", object, placements);
        var placement = randomElementInArray(placements);
        object.x = placement.x;
        object.y = placement.y;
        this.addObject(object);
    };

    this.addObject = function(object) {
        this.objects.push(object);
        visitCellsAndEdgesOfAnObject(object, function(edgeOrCell) {
            edgeOrCell.objects.push(object);
        });
    };

    this.removeObject = function(object) {
        //Warning: object x and y must not change between addObject and removeObject calls!

        removeElementFromArray(this.objects, object);
        visitCellsAndEdgesOfAnObject(object, function(edgeOrCell) {
            removeElementFromArray(edgeOrCell.objects, object);
        });
    };

    this.relocateObject = function(object, newX, newY) {
        //The only true way of moving object between two places on the map

        this.removeObject(object);
        object.x = newX;
        object.y = newY;
        this.addObject(object);
    };

    this.init = function (width, height) {
        this.width = width;
        this.height = height;
        this.objects = [];

        function createUnconnectedCell(x, y) {
            return {
                terrain: TERRAIN_WALL,
                x: x,
                y: y,
                edges: [null, null, null, null],
                objects: [],
                visitNeighbouringCells: function(vistor) {
                    for (var x = -1; x <= 1; x++) {
                        for (var y = -1; y <= 1; y++) {
                            if (x !== 0 || y !== 0) {
                                vistor(map.getCell(this.x + x, this.y + y));
                            }
                        }
                    }
                },
                hasFigure: function () {
                    for (var i = 0; i < this.objects.length; i++) {
                        if (this.objects[i].isFigure) {
                            return true;
                        }
                    }

                    return false;
                },
                getEdge: function(dir) { return this.edges[dir.index]; }
            };
        }

        // CELLS
        this.cells = create2DArray(width, height, createUnconnectedCell);

        this.getCell = function (x, y) {
            if (!this.inBounds(x, y)) {
                var temporaryCell = createUnconnectedCell(x, y);

                //fill edges
                for (var di in DIRS) {
                    var dir = DIRS[di];

                    if (this.inBounds(x + dir.deltaX, y + dir.deltaY)) {
                        temporaryCell.edges[dir.index] = this.getCell(x + dir.deltaX, y + dir.deltaY).getEdge(dir.opposite);
                    } else {
                        var temporaryEdge = {
                            terrain: TERRAIN_WALL,
                            cells: [null, null, null, null],
                            objects: [],
                        };

                        temporaryCell.edges[dir.index] = temporaryEdge;
                        temporaryEdge.cells[dir.opposite.index] = temporaryCell;
                    }
                }

                return temporaryCell;
            }

            return this.cells[y][x];
        };

        // EDGES
        function addEdge(x, y, dir, terrain) {
            var edge = {
                terrain: terrain,
                cells: [null, null, null, null],
                objects: [],
            };

            var dirCell = map.getCell(x, y);
            if (dirCell) {
                dirCell.edges[dir.index] = edge;
                edge.cells[dir.opposite.index] = dirCell;
            }

            var oppCell = map.getCell(x + dir.deltaX, y + dir.deltaY);
            if (oppCell) {
                oppCell.edges[dir.opposite.index] = edge;
                edge.cells[dir.index] = oppCell;
            }
        }

        for (var y = 0; y < map.height + 1; y++) {
            for (var x = 0; x < map.width + 1; x++) {
                addEdge(x, y, DIR_BOTTOM, TERRAIN_WALL);
                addEdge(x, y, DIR_LEFT, TERRAIN_WALL);
            }
        }
    };

    this.inBounds = function(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    };

    // Loading
    this.load = function (data) {
        var lines = data.split('\n');

        var chToTerrain = {
            '.' : TERRAIN_NORMAL,
            '-' : TERRAIN_NORMAL,
            '|' : TERRAIN_NORMAL,
            'D' : TERRAIN_DIFFICULT,
            '#' : TERRAIN_BLOCKED,
            '!' : TERRAIN_IMPASSIBLE,
            ' ' : TERRAIN_WALL
        };

        var y = 0;
        var cellMode = true;

        this.init(Math.floor((lines[0].length + 1)/2), Math.floor((lines.length + 1)/2));

        while (lines.length > 0) {
            var line = lines.pop();
            
            for (var ci = 0; ci < line.length; ci++) {
                var x = Math.floor(ci/2);
                var cell = map.getCell(x, y);
                var ch = line[ci];

                if (ci % 2 === 0) {
                    if (cellMode) {
                        cell.terrain = chToTerrain[ch];
                    } else {
                        cell.getEdge(DIR_TOP).terrain = chToTerrain[ch];
                    }
                } else {
                    if (cellMode) {
                        cell.getEdge(DIR_RIGHT).terrain = chToTerrain[ch];
                    }
                }
            }

            if (cellMode) {
                cellMode = false;
            } else {
                cellMode = true;
                y++;
            }
        }
    };
}