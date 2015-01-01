
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

function IAMapObject() {
    this.x = 0;
    this.y = 0;
    this.name = 'Door';
    this.typeId = 'DOOR';
    this.figure = false;
    this.cellObject = false;
    this.edgeObject = true;
    this.blocksLOS = true;
    this.hardBlocksLOS = false;
    this.img = '';
}

function IAMap() {
    var map = this;

    this.init = function (width, height) {
        this.width = width;
        this.height = height;

        function createUnconnectedCell(x, y) {
            return {
                terrain: TERRAIN_WALL,
                x: x,
                y: y,
                edges: [null, null, null, null],
                objects: [],
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