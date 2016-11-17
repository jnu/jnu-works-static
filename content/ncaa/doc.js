

function populate_helper(selector) {
(function($) {
	$('ul>li>span.class.doc>a').each(function() {
		
		// Stick an empty element to this documentation item to do in-and-out eventson
		// on the navigation bar
		var scrollDaemonId = "scrollDaemon-"+$(this).attr('name'),
			linkId = "scrollLink-"+$(this).attr('name');
		$(this).parent().parent().addClass(linkId);
		$('body').append($('<div id="'+ scrollDaemonId +'"></div>'));
		
		$('#'+scrollDaemonId).stickTo({
			target: 'li.'+linkId,
    		margin: "0",
    		scrollIn : function() { $('#'+linkId).addClass('current-link'); },
    		scrollOut: function() { $('#'+linkId).removeClass('current-link'); }
		});
		
		
		$('#menubar').append($("<div class='navitem'><a href='#"+$(this).attr('name')+"' id='"+ linkId +"'>"+$(this).text()+"</a></div>"))
	});
})(jQuery);
}




(function($) {
	$(function() {
		$('#menubar').stickTo({target:'#docs', margin: '30 50'});
	});
})(jQuery);