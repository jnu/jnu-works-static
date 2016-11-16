<?php
$q = '';
if(!isset($_GET['q'])) {
	// Exit if no request query was given
	$error = array('error'=>1);
	echo json_encode($error);
	exit(1);
}
$q = $_GET['q'];

// Authenticate to Twitter via Matt Harris's OAuth library
require_once('tmhOAuth/tmhOAuth.php');
$connection = new tmhOAuth(array(
	'consumer_key'    => '4akeNFQh6smhREqI0O2dIQ',
	'consumer_secret' => 'pieZyt4AT7Eq0KuDWCmIFj6W50koUwEPxz5WUaJ0',
	'user_token'      => '244632646-pcxXNtFeUOLjQF3cFdfW1Mlk5VLoSdtOw8OlSVAA',
	'user_secret'     => '3auphoFoObqhtZfbuluJAj6sON5lmSZWZjylJhPUY'
	));

// Forward request from GET q
$connection->request('GET',
	$connection->url('1.1/search/tweets.json'),
			   array('q'=>$q));
			   
// Read response
$response_code = $connection->response['code'];
if($response_code!=200) {
	if($response_code==400) {
		echo $connection->response['response'];
		exit(400);
	}
	// Quit on Error, display error code
	$error = array('error'=>$response_code);
	echo json_encode($error);
	exit($response_code);
}

// Display response JSON
$response = $connection->response['response'];
echo $response;
?>