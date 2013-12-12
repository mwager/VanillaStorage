/* test1 testem directly:
var page = new WebPage()
    page.onConsoleMessage = function(msg) {
    console.log(msg)
}
    page.open('http://localhost:7357/', function(status){
	    page.evaluate(function(){
		    console.log(navigator.userAgent)
			})
		})
        */

/* test 2 - vorher "grunt test-server" */
var page = new WebPage()
    page.onConsoleMessage = function(msg) {
    console.log(msg)
}
page.open('http://localhost:1234/test', function(status){
page.evaluate(function(){
    console.log(navigator.userAgent)
    });
});
