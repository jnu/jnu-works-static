/* Dual licensed under the MIT and GPL licenses:
 http://www.opensource.org/licenses/mit-license.php
 http://www.gnu.org/licenses/gpl.html
*/
$('document').ready(function(){
	var count = 0; 
	$('#questions').hide(); 
	$('#answers').hide(); 
	$('#questions tr:nth-child(2)').attr('id','currow'); 	
	var q1 = $('#currow td:nth-child(2)').html();
	var q3 = '<div id="d' + count + '"><p>' + q1 + '</p>' ; 
	var a1 =  $('#currow td:nth-child(3)').html();
	var r1 = q3 + a1 +'</div>';
	$('#showquestion').html(r1);
	
	$('li').live('click',function(){
		$(this).addClass('selected').siblings().removeClass('selected'); 
		$(this).parent().parent().addClass('answered');
		var target = $(this).attr('id');
		var parid = $(this).parent().parent().attr('id');
		var parnum = parseInt(parid.slice(1,3)); 
		count = count + 1;
		var ps = $('#showquestion div').length; 
		$('#showquestion div').each(function() { 
			var divid = $(this).attr('id'); 
			var divnum = parseInt(divid.slice(1,3));
			if(divnum > parnum) 
				$(this).remove()
			}) 
		$('td' ).each(function(){
			var qnum = $(this).text(); 
			if(qnum == target) {
				var q = $(this).next('td').html();
				var q2 = '<div  id="d' + count + ' "><p>' + q + '</p>'; 
				var a = $(this).next('td').next('td').html();
				var qs = $('#showquestion').html();
				var r = qs + q2 + a +'</div>'; 
				$('#showquestion').html(r);
				//window.scrollBy(0,90); 
				}
			})
		})
	})