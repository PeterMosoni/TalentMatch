$(function () {

    var loginBtn = $('#loginBtn');
    loginBtn.click(function (e) {
        e.preventDefault();
        var inputEmail = $('#inputEmail').val();
        var inputPassword = $('#inputPassword').val();
        var d = {
            "userName":inputEmail,
            "password":inputPassword
        };
        console.log(d);
        $.ajax({
            type : 'POST',
            dataType : 'json',
            contentType:'application/json',
            url: '/login',
            data: JSON.stringify(d),
            success : function(data) {
                console.log(data);
                if(data.success) location.href = "frontpage.html";
            },
            error : function(xhr, status, error) {
                console.log("Ajax error: "+ error + "<br/>" + JSON.stringify(xhr));
            }
        });
    });

    var ul = $('#companyList');
    $.ajax({
        type : 'GET',
        dataType : 'json',
        url: '/companyData',
        success : function(data) {
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