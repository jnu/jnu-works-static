<?php

$data = array('ip'     			=> $_SERVER['REMOTE_ADDR'],
			  'port'   			=> $_SERVER['REMOTE_PORT'],
			  'origin' 			=> $_SERVER['REMOTE_ADDR'],
			  'proxy_detected' 	=> false);

$proxy_headers = array(
	'HTTP_VIA',
	'HTTP_X_FORWARDED_FOR',
	'HTTP_FORWARDED_FOR',
	'HTTP_X_FORWARDED',
	'HTTP_FORWARDED',
	'HTTP_CLIENT_IP',
	'HTTP_FORWARDED_FOR_IP',
	'VIA',
	'X_FORWARDED_FOR',
	'FORWARDED_FOR',
	'X_FORWARDED',
	'FORWARDED',
	'CLIENT_IP',
	'FORWARDED_FOR_IP',
	'HTTP_PROXY_CONNECTION'
);

foreach($proxy_headers as $x){
	if (isset($_SERVER[$x])) {
		$data['origin'] = $_SERVER[$x];
		$data['proxy_detected'] = true;
	}
}

echo json_encode($data);