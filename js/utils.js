////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

function create2DArray(width, height, initialConstructor) {
    var a = new Array(height);
    for (var y = 0; y < height; y++) {
        a[y] = new Array(width);
        for (var x = 0; x < width; x++) {
            a[y][x] = initialConstructor(x, y);
        }
    }
    return a;
}
// Returns a random element in a dictionary
var randomPropertyInObject = function (object) {
  var keys = Object.keys(object);
  return object[keys[Math.floor(keys.length * Math.random())]];
};

// Returns a random element in an array
var randomElementInArray = function(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
};

// Rolls a die and returns the result
function rollDie(sides) {
    if(!sides) sides = 6;
    return 1 + Math.floor(Math.random() * sides);
}

//Removes an element from an array
function removeElementFromArray(arr, el) {
    var index = arr.indexOf(el);
    if (index > -1) {
        arr.splice(index, 1);
    }
}