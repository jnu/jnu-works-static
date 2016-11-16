<?php
// Script to load a series of GET requests so that only
// one AJAX request needs to be made by the browser to load
// all data required by app. Returns JSON with data in object
// with keys corresponding to keys passed via GET.
//
// To each key in the GET request, pass the GET request
// intended to be forwarded to the script as JSON, with the name
// of this secondary script passed as the value of a 'source'
// key in this JSON request.
//
// For example, to request 'meta' info and 'tree' info from
// synie.php, the request URI should look like:
//
// /sandbox/ss/multiget.php
// {"data" : "source:synie,x:meta", "tree" : "source:synie,x:tree"}
//
// This will execute the requests:
// 
// /sandbox/ss/synie.php?x=meta
// /sandbox/ss/synie.php?x=tree
//
// And return the results as a JSON object that has the form:
//
// {
//	"meta" :
//		{
//			... // return object from first request
//		}, 
//  "tree" :
//		{
//			... // return object from second request
//		}
// }
//
// Important to note that sources are currently whitelisted in this file.
// If a source is not in this whitelist, it is inaccessible. For security reasons.
//
// Copyright (c) Joseph Nudell 2012
//////

$host_whitelist = array(
	'synie' => 'http://joenoodles.com/sandbox/ss/synie.php'
);

function json2reqstr($request, $ignore_key) {
	// Turn an object in the form of a $_GET request array into URI request string
	// e.g array( "key" => "value", "foo" => "bar" ) will turn into "?key=value&foo=bar
	$str = '?';
	foreach($request as $key=>$value) {
		if(!strcmp($key, $ignore_key)) continue;
		$str .= (strlen($str)>1)? "&" : "";
		$str .= $key . "=" . $value;
	}
	return $str;
}

function clean_parts($array) {
	$return = array();
	foreach($array as $key=>$value) {
		$return[$key] = trim($value);
	}
	return $return;
}

function decode_request($string) {
	$request = array();
	$parts = clean_parts(explode(',', $string));
	foreach($parts as $i=>$keyval) {
		$cut = explode(':', $keyval);
		if(count($cut)!=2) {
			$request[$cut] = array("error" => "bad request `".$cut."`");
			continue;
		}else{
			$request[$cut[0]] = $cut[1];
		}
	}
	return $request;
}

function http_get($uri) {
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $uri);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	return curl_exec($ch);
}

$return = array();

foreach($_POST as $key => $value) {
	$request = decode_request($value);
	$host = $request['source'];
	if(!array_key_exists($host, $host_whitelist)) {
		$return[$key] = array('error' => 'host not found');
		continue;
	}else{
		// Host is OK. Construct URI, execute request, and decode JSON response.
		$host = $host_whitelist[$host];
		$uri = $host . json2reqstr($request, 'source');
		$result = json_decode(http_get($uri));
		$return[$key] = $result;
	}
}

// Return array of responses as JSON
echo json_encode($return);

?>