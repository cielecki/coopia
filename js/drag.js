(function($) {

    $.fn.mapPosition = function (map, x, y) {
        return this.each(function() {
            var $this = $(this);
            $this.css("left", CELL_WIDTH * x);
            $this.css("top", CELL_HEIGHT * (map.height - y));
        });
    };

    $.fn.dragmove = function(placeCalback) {
        return this.each(function() {
            var $document = $(document),
                $this = $(this),
                active,
                startX,
                startY;

            var map0X, map0Y;
            
            $this.on('mousedown touchstart', function(e) {
                map0X = $this.offset().left - $this.position().left;
                map0Y = $this.offset().top - $this.position().top;

                active = true;
                startX = e.originalEvent.pageX - $this.offset().left;
                startY = e.originalEvent.pageY - $this.offset().top;
                
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

                if ('mouseup' == e.type && active)
                    placeCalback(click, e.originalEvent.pageX - startX - map0X, e.originalEvent.pageY - startY - map0Y);
                
                if ('touchend' == e.type && active)
                    placeCalback(touch, e.originalEvent.pageX - startX - map0X, e.originalEvent.pageY - startY - map0Y);

                active = false;
            });
        });
    };
})(jQuery);