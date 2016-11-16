<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Sentiment Analysis test</title>


<script type="text/javascript" src="http://joenoodles.com/widgets/scr/jquery-latest.min.js"></script>

<script type="text/javascript">
function setStatus(message, error) {
	// setStatus(message, [error]). Display status message on page.
	if(error===undefined) error = false;
	var el = '#status .message';

	$(el).html(message);
	if(error) {
		$(el).toggleClass('error', true);
	}else{
		$(el).toggleClass('error', false);
	}
}

function clearResultsForm() {
	$('#result #happysad .value').html('');
	$('#result #happy .value').html('');
	$('#result #sad .value').html('');
	$('#result #activepassive .value').html('');
	$('#result #active .value').html('');
	$('#result #passive .value').html('');
}


function classify(text, classifier, firstResult, secondResult) {
	// Classify text and write output to screen (async)
	// Submit AJAX request to classifier
	$.post("http://joenoodles.com/widgets/emotion/classify.py",
		{
			c: classifier,
			m: text
		},
		function(data) {
			if(data.result) {
				setStatus('Done!');
				var emotion = data.result[firstResult]>data.result[secondResult]? firstResult : secondResult;
				$('#result #'+classifier+' .value').html(emotion);
				$('#result #'+firstResult+' .value').html(data.result[firstResult].toFixed(3));
				$('#result #'+secondResult+' .value').html(data.result[secondResult].toFixed(3));
				return true;
			}else{
				setStatus("An error occurred in getting the data.", true);
			}
		},
		'json');
}


$(function() {
	$('#emotest').submit(function() {
		// Submit form
		// Set status
		setStatus('Classifying ...');
		clearResultsForm();
		
		var text = $('#emobox').val();
		
		// Classify happy vs. sad
		classify(text, 'happysad', 'happy', 'sad');
		
		// Classify active vs. passive
		classify(text, 'activepassive', 'active', 'passive');
		
		// Prevent default form action
		return false;
	});
});
</script>

</head>

<style type="text/css">
@import url(http://fonts.googleapis.com/css?family=Rufina&subset=latin,latin-ext);

body {
	background-color: #333;
}

#page {
	font-family: Rufina, serif;
	font-size: 1em;
	background-color: #FCFBF5;
	text-align: center;
	margin: 100px;
	padding: 30px;
}

#emobox {
	width: 95%;
	height: 100px;
}

.error {
	color: #C30;
}

.in-use {
	visibility: visible;
}

#status {
	height: 20px;
	margin: 50px;
}

h3 {
	margin-bottom: 50px;
}

#result {
	position: relative;
	margin-top: 50px;
	text-align: left;
	display: inline-block;
	width: 800px;
	text-align: center;
}

.label {
	width: 100px;
	display: inline-block;
}

.classification {
	display: inline-block;
	margin: 20px;
	width: 200px;
	text-align: left;
}

</style>



<body>

<div id="page">

<h3>Sentiment Analysis Demo</h3>

<div id='form'>

<form name='emotest' id='emotest'>

<div id='input'><textarea name='emobox' id='emobox'></textarea></div>
<div id='submit'>
<input type='submit' id='emosub' value='Classify.' />
</div>
</form>

</div>

<div id='status'>
<span class='message'>Enter some text and click "submit."</span>
</div>


<div id="result">


<div class='classification'>
    <div id='happysad'><span class='label'>Quality:</span> <span class='value'></span></div>
    <div id='details_cont'>
        <div id='happy'><div class='label'>P(happy) = </div> <span class='value'></span></div>
        <div id='sad'><div class='label'>P(sad) = </div> <span class='value'></span></div>
    </div>
</div>


<div class='classification'>
    <div id='activepassive'><span class='label'>Engagement:</span> <span class='value'></span></div>
    <div id='details_cont'>
        <div id='active'><div class='label'>P(active) = </div> <span class='value'></span></div>
        <div id='passive'><div class='label'>P(passive) = </div> <span class='value'></span></div>
    </div>
</div>


</div>

</div>
</body>
</html>
