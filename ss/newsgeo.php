<?php

// Harvest bit.ly links from Twitter.
// Keep set of links related to a certain tag in a database.

if(!isset($_GET['hashtag'])) {
	$error = array('error'=>1);
	echo json_encode($error);
	exit(1);
}
// Get the requested hashtag
$hashtag = $_GET['hashtag'];
$linkprovider = "bit.ly";

// Build the search query
$query = urlencode("#$hashtag $linkprovider");

// Execute query and get return string
$result = file_get_contents("http://joenoodles.com/widgets/ss/searchtwitter.php?q=$query");

// Chew through JSON object as string, get only URLs from
// specified provider.
$links = preg_match_all("/(https?:\/\/$linkprovider\/[\w\d]+)[^\w\d]/", stripcslashes($result), $url_matches);
$urls = array();
foreach($url_matches[1] as $url) {
	// Iterate through matched groups (urls) and collect.
	array_push($urls, $url);
	echo $url;
	echo "<br />";
}


// Connect to Database
$mysql_uname = "noodlings";
$mysql_passw = "Highlandrose1!";
$mysql_hosta = "50.63.106.149";
$mysql_datab = "noodlings";
$mysql_table = "newsgeo";
$mysql_conn = mysql_connect($mysql_hosta, $mysql_uname, $mysql_passw);
if(!$mysql_conn) die("Error: can't authenticate");
$mysql_db = mysql_select_db($mysql_datab, $mysql_conn);
if(!$mysql_db) die("Error: can't connect to database");

// Get all URLs filed under the current hashtag
$clean_hashtag = mysql_real_escape_string($hashtag);
$query = "SELECT `shortlink` FROM `$mysql_table` WHERE `hashtag`='$clean_hashtag'";
$known_links = mysql_query($query, $mysql_conn);
if(!$known_links) die("Error: invalid query -- ".mysql_error());
$unknown_links = array();
while($row = mysql_fetch_assoc($known_links)) {
	// Iterate through known links, compare to recently harvested ones
	// Build array of unkown links.
	$known = false;
	foreach($urls as $url) {
		if(!strcmp($row['shortlink'], $url)) {
			$known = true;
			break;
		}
	}
	if(!$known) {
		array_push($unknown_links, $url);
	}
}



// Get info about link from bitly API.
// Authenticate to bitly via Matt Harris's OAuth library
require_once('tmhOAuth/tmhOAuth.php');
$connection = new tmhOAuth(array(
	'host'			  => 'api-ssl.bitly.com',
	'consumer_key'    => 'c7bfffe359d905e212c52dc5c7413576811cd2da',
	'consumer_secret' => '1c902dd4d1e8d7a0dce2faed2e1f2cb2092d50eb',
	'user_token'      => '', # Not sure what to do here in bitly
	'user_secret'     => ''  # bitly?
	));

foreach($unknown_links as $url) {
	// Request data about location from bitly API
	$connection->request('GET',
		$connection->url('v3/link/location'),
				   array('link'         => urlencode($url),
						 'access-token' => $access_token));
						 
	// Handle errors in request. 200 response means OK.
	if($connection->response['code']!=200) {
		$error = array('error'=>$connection->response['code']);
		echo json_encode($error);
		exit($connection->response['code']);
	}
	
	// Parse reponse JSON object
	$response = json_decode($connection->response['response']);
	$locations = json_encode($response['data']['locations']);
	
	// Execute a second request for information about the target of the url
	$connection->request('GET',
		$connection->url('v3/link/info'),
				   array('link'         => urlencode($url),
				   	     'access-token' => $access_token));
	// Handle errors from this request
	if($connection->response['code']!=200) {
		$error = array('error'=>$connection->response['code']);
		echo json_encode($error);
		exit($connection->response['code']);
	}
	
	// Parse target of URL from response as JSON object
	$response = json_decode($connection->response['response']);
	$page_url = $response['data']['canonical_url'];
	$page_title = $response['data']['html_title'];
	$page_domain = $response['data']['domain'];
	
	
	
	// Put together a new entry for the database
	$entry = array('service'   => mysql_real_escape_string(preg_replace("/[^\w\d]/", "", $linkprovider)),
				   'shortlink' => mysql_real_escape_string($url),
				   'target'    => mysql_real_escape_string($page_url),
				   'title'     => mysql_real_escape_string($page_title),
				   'domain'    => mysql_real_escape_string($domain));
	$sql = sprintf("INSERT INTO `$mysql_table`
					(`service`, `shortlink`, `title`, `target`, `target_org`, `geointerest`, `hashtag`)
					VALUES ('%s', '%s', '%s', '%s', '%s', '%s', '%s')",
				$entry['service'],
				$entry['shortlink'],
				$entry['title'],
				$entry['target'],
				$entry['domain'],
				mysql_real_escape_string($locations),
				mysql_real_escape_string($hashtag));
	mysql_query($sql, $mysql_conn);
}



// Close connection
mysql_close($mysql_conn);

?>