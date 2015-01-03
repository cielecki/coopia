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

    function processImperialActivation() {
        var map = $rootScope.map;
        var activeGroups = [];

        $.each(map.groups, function (i, group) {
            if (group.active)
                activeGroups.push(group);
        });

        if (activeGroups.length > 0) {
            var group = randomElementInArray(activeGroups);
            group.active = false;
            $rootScope.events.push({template: 'partials/event_imperial_activation.html', group: group});
            return true;
        } else {
            return false;
        }
    }

    function processStatusPhase() {
        var map = $rootScope.map;

        $rootScope.round += 1;
        $rootScope.threat += $rootScope.threatLevel;
        $rootScope.events.push({template: 'partials/event_status_phase.html'});

        $.each(map.groups, function (i, group) {
            group.active = true;
        });

        //deployment

        //end of round hook
    }

    $rootScope.finishedRebelActivation = function () {
        processImperialActivation();
    };

    $rootScope.finishedAllRebelActivations = function () {
        while (processImperialActivation()) {}
        processStatusPhase();
    };

	$rootScope.setupMission = function(missionId) {
		$rootScope.phase = 'mission_setup';
        $rootScope.events = [];

        var missionInfo = MISSIONS_DICT[missionId];

		$http.get(missionInfo.mapUrl).success(function(data, status, headers, config) {
			var map = new IAMap();

			map.load(data);

            $rootScope.missionInfo = missionInfo;
            $rootScope.round = 1;
            $rootScope.threat = 0;
            $rootScope.threatLevel = 3;
            $rootScope.map = map;

            $.each($rootScope.selectedHeroes, function (heroId, selected) {
                if (selected) {
                    var hero = findinArray($rootScope.availableHeroes, function(hero) { return hero.typeId === heroId; });
                    var heroObj = map.createObject(hero);
                    heroObj.x = missionInfo.heroStart.x;
                    heroObj.y = missionInfo.heroStart.y;
                    map.placeObject(heroObj);
                }
            });

            missionInfo.setup($rootScope);
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
						map.relocateObject(obj, Math.round(x / map.cellCssWidth), Math.round(map.height - y / map.cellCssHeight) - 1);
						//checkLos();
					};
				};
				
				var mapDiv = $('<div class="aid-map">');
				mapDiv.css('height', map.cssHeight);
                mapDiv.css('width', map.cssWidth);

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

					for (var x = 0; x < map.width; x++) {
						var cellDiv = $('<div class="aid-map-cell">');
						var cell = map.getCell(x, y);
						cellDiv.addClass(cell.terrain.cellCssClass);
                        cellDiv.css("width", map.cellCssWidth);
                        cellDiv.css("height", map.cellCssHeight);
						cellDiv.css("left", map.cellCssWidth * x);
						cellDiv.css("bottom", map.cellCssHeight * y);

						//borders
						for (var i in DIRS) {
							var dir = DIRS[i];
							var edge = cell.getEdge(dir);

							if (edge) {
								cellDiv.css('border-' + dir.cssName, edge.terrain.edgeCss);
							}
						}
						
						//addClicker(cellDiv, x, y);
						mapDiv.append(cellDiv);
						cell.domElement = cellDiv;
					}
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

            scope.mapDisplay = 'Both';
            scope.cycleMapDisplay = function () {
                if (scope.mapDisplay === 'Both') {
                    scope.mapDisplay = 'Tactical';
                } else if (scope.mapDisplay === 'Tactical') {
                    scope.mapDisplay = 'Ground';
                } else if (scope.mapDisplay === 'Ground') {
                    scope.mapDisplay = 'Both';
                }
            };



			scope.$watch(attrs.iaMap, updateMap, false);
		}
	};
})

.directive('aidWith', ['$parse', '$log', function(parse, log) {
    return {
        scope: true,
        link: function(scope, el, attr) {
            var expression = attr.aidWith;
            var parts = expression.split(' as ');

            if(parts.length != 2) {
                log.error("`with` directive expects expression in the form `String as String`");
                return;
            }

            scope.$watch(parts[0], function(value) {
                scope[parts[1]] = value;
            }, true);
        }
    };
}]);