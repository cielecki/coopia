angular.module('imperial', ['ui.bootstrap'])

.controller('GameController', function($rootScope, $scope, $timeout, $log, $http) {
	$rootScope.phase = 'intro';
	
	$rootScope.setupLOSChecker = function () {
		$rootScope.phase = 'mission_setup';
		$http.get('/maps/aftermath.map').success(function(data, status, headers, config) {
			var map = new IAMap(20, 20);
			map.load(data);
			$rootScope.map = map;
		});
	};

	$rootScope.availableHeroes = [
		{id: 'gideon_argus', img:'gideon_argus.png', name:'Gideon Argus'},
		{id: 'gaarkhan', img:'gaarkhan.jpg', name:'Gaarkhan'},
		{id: 'jyn_odan', img:'jyn_odan.png', name:'Jyn Odan'},
		{id: 'fenn_signis', img:'fenn_signis.png', name:'Fenn Signis'},
		{id: 'diala_passil', img:'diala_passil.jpg', name:'Diala Passil'},
		{id: 'mak_eshkarey', img:'mak_eshkarey.jpg', name:'Mak Eshka\'rey'}
	];

	$rootScope.selectedHeroes = {};

	$scope.$watch('selectedHeroes', function () {
		var i = 0;

		$.each($scope.selectedHeroes, function(heroId, selected) {
			if (selected) {
				i++;
			}
		});

		$scope.numHeroes = i;
	}, true);

	$rootScope.setupMission = function(missionName) {
		$rootScope.phase = 'mission_setup';
		$http.get('/maps/' + missionName + '.map').success(function(data, status, headers, config) {
			var map = new IAMap(20, 20);
			map.load(data);
			$rootScope.map = map;
		});
	};
})

.directive('iaMap', function() {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {

			function updateMap(map) {
				element.empty();

				if (!map) {
					return;
				}
				
				console.log('map', map, map.height);

				var mapDiv = $('<div class="aid-map">');
				mapDiv.css('height', CELL_HEIGHT * map.height);

				function addClicker(cellDiv, x, y) {
					cellDiv.click(function() {
						for (var lx = 0; lx < map.width; lx++) {
							for (var ly = 0; ly < map.height; ly++) {
								if (map.hasLOS(x, y, lx, ly)) {
									var losMarkerDiv = $('<div class="aid-los-marker"></div>');
									losMarkerDiv.css("left", CELL_WIDTH * lx);
									losMarkerDiv.css("top", CELL_HEIGHT * (map.height-ly));

									mapDiv.append(losMarkerDiv);
								}
							}
						}
					});
				}

				for (var y = 0; y < map.height; y++) {
					var row = $('<div class="aid-map-row">');

					for (var x = 0; x < map.width; x++) {
						var cellDiv = $('<div class="aid-map-cell">');
						var cell = map.getCell(x, y);
						cellDiv.addClass(cell.terrain.cellCssClass);
						cellDiv.css("left", CELL_WIDTH * x);
						cellDiv.css("top", CELL_HEIGHT * (map.height-y));

						//borders
						for (var i in DIRS) {
							var dir = DIRS[i];
							var edge = cell.getEdge(dir);

							if (edge) {
								cellDiv.css('border-' + dir.cssName, edge.terrain.edgeCss);
							}
						}
						
						addClicker(cellDiv, x, y);
						row.append(cellDiv);
						cell.domElement = cellDiv;
					}

					mapDiv.append(row);
				}

				var jyn = {type: "jyn", x: 3, y: 4};
				var stormtrooper = {type: "stormtrooper", x:2, y:5};
				var units = [jyn, stormtrooper];

				function checkLos() {
					stormtrooper.domElement.removeClass('aid-visible');

					if (map.hasLOS(jyn.x, jyn.y, stormtrooper.x, stormtrooper.y)) {
						stormtrooper.domElement.addClass('aid-visible');
					}
				}

				function addUnit(unit) {
					var unitDiv = $('<div class="aid-los-marker"><div class="aid-los-marker-inner"></div></div>');
					unitDiv.addClass('aid-unit-' + unit.type);
					unitDiv.mapPosition(map, unit.x, unit.y);

					unitDiv.dragmove(function (domElement, x , y) {
						unit.x = Math.round(x / CELL_WIDTH);
						unit.y = Math.round(map.height - y / CELL_HEIGHT);
						domElement.mapPosition(map, unit.x, unit.y);
						checkLos();
					});

					unit.domElement = unitDiv;
					mapDiv.append(unitDiv);
				}

				for (var ui = 0; ui < units.length; ui++) {
					var unit = units[ui];
					addUnit(unit);
				}

				element.append(mapDiv);
				console.log(element);
			}

			scope.$watch(attrs.iaMap, updateMap);
		}
	};
});