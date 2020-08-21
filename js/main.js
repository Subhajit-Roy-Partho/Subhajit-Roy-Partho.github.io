

function myJumbo() {
    var winHeight = $(window).height();
    var elementHeight = $('#mid').height();
    console.log(elementHeight);
    console.log(winHeight);
    $('.wrapper').css({
        height:winHeight
    });
    $('#mid').css({
        marginTop: ((winHeight/3)-(elementHeight/2)) + 'px'
    });
}

$(document).ready(function() {
    myJumbo();
});
$(window).resize(function(){
    myJumbo();
    console.log("It is working");
});