$(function () {
    var ul = $('#companyList');
    $.ajax({
        type : 'GET',
        dataType : 'json',
        url: '/companyData',
        success : function(data) {
            console.log(data);
            var d = data;
            for(var i in d){
                ul.append('<li><img src="'+d[i].value.companyLogoUrl+'"></li>');
            }

            (function () {
                console.log('force')
                var $frame = $('#forcecentered');
                var $wrap  = $frame.parent();

                // Call Sly on frame
                $frame.sly({
                    horizontal: 1,
                    itemNav: 'forceCentered',
                    smart: 1,
                    activateMiddle: 1,
                    activateOn: 'click',
                    mouseDragging: 1,
                    touchDragging: 1,
                    releaseSwing: 1,
                    startAt: 0,
                    scrollBar: $wrap.find('.scrollbar'),
                    scrollBy: 1,
                    speed: 300,
                    elasticBounds: 1,
                    easing: 'easeOutExpo',
                    dragHandle: 1,
                    dynamicHandle: 1,
                    clickBar: 1,

                    // Buttons
                    prev: $wrap.find('.prev'),
                    next: $wrap.find('.next')
                });
            }());
        }
    });
});