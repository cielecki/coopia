MISSIONS_DICT['aftermath'] = function(gs) {
    return {
        name: 'Aftermath',
        mapUrl: 'missions/aftermath.map',
        heroStart: {x: 2, y: 7},
        groundSizePx: {x: 500, y:379},
        groundStyle: {
            'width': '552px',
            'height': '370px',
            'background-size': '100% 100%',
            'top': '0px',
            'left': '0px',
            'background-image': 'url(missions/aftermath.png)',
        },
        setup: function () {
            var map = gs.map;

            var terminalsRemoved = 0;
            var TERMINAL = {
                typeId: "terminal",
                name:'Terminal',
                img: 'terminal.png',
                isFigure: false,
                onRemovePermanently: function() {
                    terminalsRemoved++;

                    if (terminalsRemoved === 4) {
                        gs.events.push({name: 'All terminals destroyed', template: 'missions/aftermath_event_victory.html'});
                    }
                }
            };
            
            map.placeObject(map.createObject(TERMINAL, {x: 2, y: 1}));
            map.placeObject(map.createObject(TERMINAL, {x: 9, y: 0}));
            map.placeObject(map.createObject(TERMINAL, {x: 5, y: 4}));
            map.placeObject(map.createObject(TERMINAL, {x: 6, y: 6}));

            var CRATE                   = {typeId: "crate", name:'Crate', img: 'crate.png', isFigure: false};
            map.placeObject(map.createObject(CRATE, {x: 3, y: 1}));
            map.placeObject(map.createObject(CRATE, {x: 10, y: 0}));
            map.placeObject(map.createObject(CRATE, {x: 4, y: 6}));


            var HEROES_START            = {typeId: "heroes_start", name:'Hero enterance', img: 'heroes_start.png', isFigure: false};
            map.placeObject(map.createObject(HEROES_START, {x: 2, y: 7}));

            var VERTICAL_DOOR = {
                typeId: "door",
                name: "Door",
                img: 'door.png',
                isFigure: false,
                width: 0,
                height: 2,
                onRemovePermanently: function() {
                    gs.events.push({name: 'Door opened', template: 'missions/aftermath_event_fortified.html'});
                }
            };

            map.placeObject(map.createObject(VERTICAL_DOOR, {x: 6, y: 1}));

            var FIGURE_STORM_TROOPER    = {typeId: "stormtrooper", name:'Stormtrooper', img: 'stormtrooper.png', isFigure: true};
            var FIGURE_PROBE_DROID      = {typeId: "probe", name:'Probe Droid', img: 'probe.png', isFigure: true};
            var FIGURE_IMPERIAL_OFFICER = {typeId: "officer", name:'Imperial Officer', img: 'officer.png', isFigure: true};

            var stormTrooperGroup = {name:'Stormtrooper', figureType: FIGURE_STORM_TROOPER, active: true};
            map.placeObject(map.createObject(FIGURE_STORM_TROOPER, {x: 0, y: 2, group: stormTrooperGroup}));
            map.placeObject(map.createObject(FIGURE_STORM_TROOPER, {x: 1, y: 4, group: stormTrooperGroup}));
            map.placeObject(map.createObject(FIGURE_STORM_TROOPER, {x: 2, y: 3, group: stormTrooperGroup}));
            map.groups.push(stormTrooperGroup);

            var probeGroup = {name:'Probe Droid', figureType: FIGURE_PROBE_DROID, active: true};
            map.placeObject(map.createObject(FIGURE_PROBE_DROID, {x: 2, y: 2, group: probeGroup}));
            map.groups.push(probeGroup);

            var officerGroup = {name:'Imperial officer', figureType: FIGURE_IMPERIAL_OFFICER, active: true};
            map.placeObject(map.createObject(FIGURE_IMPERIAL_OFFICER, {x: 4, y: 1, group: officerGroup}));
            map.groups.push(officerGroup);

            gs.events.push({template: 'partials/event_rebel_activation.html'});
            gs.events.push({template: 'partials/event_mission_setup_2.html'});
            gs.events.push({template: 'missions/aftermath_briefing.html'});
            gs.events.push({template: 'partials/event_mission_setup_1.html'});
        },
        events: [],
        onHeroWounded: function(obj) {
            for (var i = 0; i < gs.map.objects.length; i++) {
                var hero = gs.map.objects[i];
                if (hero.isHero && !hero.isWounded) {
                    return;
                }
            }

            gs.map.selectedObject = null;
            gs.events.push({name: 'All heroes wounded', template: 'missions/aftermath_event_defeat.html'});
        }
    };
};