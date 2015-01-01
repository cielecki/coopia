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
		{typeId: 'gideon_argus', img:'gideon_argus.png', name:'Gideon Argus', ringColor: '#F33', isFigure: true,},
		{typeId: 'gaarkhan', img:'gaarkhan.jpg', name:'Gaarkhan', ringColor: '#F33',isFigure: true,},
		{typeId: 'jyn_odan', img:'jyn_odan.png', name:'Jyn Odan', ringColor: '#F33',isFigure: true,},
		{typeId: 'fenn_signis', img:'fenn_signis.png', name:'Fenn Signis', ringColor: '#F33', isFigure: true,},
		{typeId: 'diala_passil', img:'diala_passil.jpg', name:'Diala Passil', ringColor: '#F33', isFigure: true,},
		{typeId: 'mak_eshkarey', img:'mak_eshkarey.jpg', name:'Mak Eshka\'rey', ringColor: '#F33', isFigure: true,}
	];

	$rootScope.selectedHeroes = {gideon_argus: true, gaarkhan: true};

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

			$.each($rootScope.selectedHeroes, function (heroId, selected) {
				if (selected) {
					var hero = findinArray($rootScope.availableHeroes, function(hero) { return hero.typeId === heroId; });
					var heroObj = map.createObject(hero);
					heroObj.x = 2;
					heroObj.y = 7;
					map.placeObject(heroObj);
				}
			});

			var FIGURE_STORM_TROOPER    = {typeId: "stormtrooper", img: 'stormtrooper.png', isFigure: true};
			var FIGURE_PROBE_DROID      = {typeId: "probe", img: 'probe.png', isFigure: true};
			var FIGURE_IMPERIAL_OFFICER = {typeId: "officer", img: 'officer.png', isFigure: true};

			map.placeObject(map.createObject(FIGURE_STORM_TROOPER, {x: 0, y: 2}));
			map.placeObject(map.createObject(FIGURE_STORM_TROOPER, {x: 1, y: 4}));
			map.placeObject(map.createObject(FIGURE_STORM_TROOPER, {x: 2, y: 3}));

			map.placeObject(map.createObject(FIGURE_PROBE_DROID, {x: 2, y: 2}));
			map.placeObject(map.createObject(FIGURE_IMPERIAL_OFFICER, {x: 4, y: 1}));

			$rootScope.map = map;
		});
	};
})

.directive('aidMapDrag', function() {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			var placeCalback = scope.$eval(attrs.aidMapDrag);

            var $document = $(document),
                $this = $(element),
                active,
                startX,
                startY,
                orgOffset;

            var map0X, map0Y;
            
            $this.on('mousedown touchstart', function(e) {
                map0X = $this.offset().left - $this.position().left;
                map0Y = $this.offset().top - $this.position().top;

                active = true;
                startX = e.originalEvent.pageX - $this.offset().left;
                startY = e.originalEvent.pageY - $this.offset().top;
                orgOffset = $this.offset();
                
                if ('mousedown' == e.type)
                    click = $this;
                                    
                if ('touchstart' == e.type)
                    touch = $this;
                                    
                if (window.mozInnerScreenX === null)
                    return false;
            });
            
            $document.on('mousemove touchmove', function(e) {
                if ('mousemove' == e.type && active)
                    click.offset({
                        left: e.originalEvent.pageX - startX,
                        top: e.originalEvent.pageY - startY
                    });
                
                if ('touchmove' == e.type && active)
                    touch.offset({
                        left: e.originalEvent.pageX - startX,
                        top: e.originalEvent.pageY - startY
                    });
            }).on('mouseup touchend', function(e) {
                if ('mouseup' == e.type && active) {
					click.offset(orgOffset); //needed if we don't change anything in scope
                    placeCalback(click, e.originalEvent.pageX - startX - map0X, e.originalEvent.pageY - startY - map0Y);
                    scope.$digest();
                }
                
                if ('touchend' == e.type && active) {
					touch.offset(orgOffset); //needed if we don't change anything in scope
                    placeCalback(touch, e.originalEvent.pageX - startX - map0X, e.originalEvent.pageY - startY - map0Y);
                    scope.$digest();
                }

                active = false;
            });
        }
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

				scope.dragCallbackForObj = function(obj) {
					return function (domElement, x , y) {
						map.relocateObject(obj, Math.round(x / CELL_WIDTH), Math.round(map.height - y / CELL_HEIGHT));
						//checkLos();
					};
				};
				
				console.log('map', map, map.height);

				var mapDiv = $('<div class="aid-map">');
				mapDiv.css('height', CELL_HEIGHT * map.height);

				/*
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
				}*/

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
						
						//addClicker(cellDiv, x, y);
						row.append(cellDiv);
						cell.domElement = cellDiv;
					}

					mapDiv.append(row);
				}

				/*
				function checkLos() {
					stormtrooper.domElement.removeClass('aid-visible');

					if (map.hasLOS(jyn.x, jyn.y, stormtrooper.x, stormtrooper.y)) {
						stormtrooper.domElement.addClass('aid-visible');
					}
				}*/

				/*
				function addUnit(unit) {
					var unitDiv = $('<div class="aid-los-marker"><div class="aid-los-marker-inner"></div></div>');
					unitDiv.addClass('aid-unit-' + unit.type);
					unitDiv.mapPosition(map, unit.x, unit.y);

					
					unit.domElement = unitDiv;
					mapDiv.append(unitDiv);
				}*/



				element.append(mapDiv);
			}



			scope.$watch(attrs.iaMap, updateMap, false);
		}
	};
});