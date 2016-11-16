<?php

// Helper functions
function clean_parts($arr) {
	// trim array parts
	for($i=0; $i<count($arr); $i++) {
		$arr[$i] = trim($arr[$i]);
	}
	return $arr;
}

function err($msg) {
	return json_encode(array("error" => $msg));
}

// DB Params
$mysql_uname = "joenoodles";
$mysql_passw = "readonly";
$mysql_hosta = "127.0.0.1";
$mysql_datab = "joenoodles";


// PATH = requested list of available words and languages
if(isset($_GET['x'])) {
	// Connect to DB
	$mysql_conn = mysql_connect($mysql_hosta, $mysql_uname, $mysql_passw) or die(err("can't authenticate"));
	mysql_set_charset("UTF8", $mysql_conn);
	$mysql_db = mysql_select_db($mysql_datab, $mysql_conn) or die(err("can't connect to DB"));
	
	switch($_GET['x']) {
		case "meta":
			// Fetch list of words from database
			$sql = "SELECT `concept` FROM synie WHERE 1";
			$results = mysql_query($sql, $mysql_conn);
			
			// Iterate through result, build array of concept entries
			$words = array();
			while($row = mysql_fetch_assoc($results)) {
				$words[] = $row['concept'];
			}
			
			// Fetch list of languages from database
			$sql = "SELECT `abbr`,`name` FROM synie_lang WHERE 1";
			$results = mysql_query($sql, $mysql_conn);
			$langs = array();
			while($row = mysql_fetch_assoc($results)) {
				$langs[] = array('name' => $row['abbr'],
								 'meta' => array('fullname'=> $row['name']));
			}
			
			// Fetch list of roots from database
			$sql = "SELECT `root`,`origin`,`meaning` FROM synie_roots WHERE 1";
			$results = mysql_query($sql, $mysql_conn);
			$roots = array();
			while($row = mysql_fetch_assoc($results)) {
				$roots[] = $row;
			}
			
			// Echo meta information
			echo json_encode(array('words'      => $words,
								   'roots'      => $roots,
								   'nodes'      => $langs,
								   'coreLength' => count($langs)));
			break;
		
		/////////////////////////////////////////////////////////////
		case "tree":
			// Fetch list of languages from database
			$sql = '';
			if(isset($_GET['r'])) {
				$sql = "SELECT * FROM ietree WHERE `misc`='" . mysql_real_escape_string($_GET['r']) . "'";
			}else{
				$sql = "SELECT * FROM ietree WHERE 1";
			}
			$results = mysql_query($sql, $mysql_conn);
			
			// Iterate through result, build array of concept entries
			$langs = array();
			$nodes = array();
			$leaves = array();
			$i = 0;
			while($row = mysql_fetch_assoc($results)) {
				$genparents = clean_parts(explode(';', $row['pargen']));
				if(count($genparents)<1) {
					// This is a leaf node
					$leaves[] = $row['lang'];
				}
				$langs[$row['lang']] = array('name' => $row['name'],
											 'index' => $i,
											 'genparent' => $genparents,
											 'influencedby' => clean_parts(explode(';', $row['parcon'])));
				$nodes[] = array('name' => $row['lang'], 'data' => array('fullname'=>$row['name'],
																		 'attested'=>(intval($row['attested'])?true:false),
																		 'living'  =>(intval($row['living'])?true:false)));
				$i+=1;
			}
			
			$conlinks = array();
			$genlinks = array();
			foreach($langs as $lang=>$arr) {
				if(!array_key_exists('index', $arr)) continue;
				$to = $arr['index'];
				$genparents = $arr['genparent'];
				foreach($genparents as $i=>$parent) {
					if(!array_key_exists($parent, $langs)) continue;
					$from = $langs[$parent];
					$genlinks[] = array('source'=>$from['index'],
									    'target'=>$to,
									    'value' =>3); // value should vary / be semantic
				}
				$conparents = $arr['influencedby'];
				foreach($conparents as $i=>$parent) {
					if(!array_key_exists($parent, $langs)) continue;
					$from = $langs[$parent];
					$conlinks[] = array('source'=>$from['index'],
									    'target'=>$to,
										'value' =>1);
				}
			}
			
			// print JSON
			$json = array('nodes'=>$nodes,
						  'links'=>array('genetic'=>$genlinks,
						  				 'contact'=>$conlinks));
			echo json_encode($json);
			
			break;
		
		/////////////////////////////////////////
		case "treedata":
			// Fetch list of languages from database
			$sql = "SELECT * FROM ietree WHERE 1";
			$results = mysql_query($sql, $mysql_conn);
			
			// Iterate through result, build array of concept entries
			$langs = array();
			$nodes = array();
			$i = 0;
			while($row = mysql_fetch_assoc($results)) {
				$langs[$row['lang']] = array('name' => $row['name'],
											 'index' => $i,
											 'genparent' => clean_parts(explode(';', $row['pargen'])),
											 'influencedby' => clean_parts(explode(';', $row['parcon'])),
				 							 'data' => array('fullname'=>$row['name'],
															 'attested'=>(intval($row['attested'])?true:false),
															 'living'  =>(intval($row['living'])?true:false)));
				$i+=1;
			}
			echo json_encode($langs);
			break;
		
		default:
			break;
	}
	exit(0);
}


// PIE LOOKUP //


// -- Get meta information about langauges --------- //
function getMetaInformation($conn) {
	$sql = "SELECT * FROM synie_lang WHERE 1";
	$results = mysql_query($sql, $conn) or die(err("Invalid query: ".mysql_error()));
	$meta = array();
	while($row = mysql_fetch_assoc($results)) {
		$meta[$row['lang']] = array('rootcode' => $row['root_code'],
								    'begin'    => $row['begin'],
									'end'      => $row['end'],
									'nodedata' => array('name' => $row['abbr'],
														'meta' => array('fullname' => $row['name']),
														'data' => array()));
	}
	return $meta;
}


// -- Get cognates by PIE root --------------------- //
function cognatesByPIERoot($root, $conn) {
	// Fetch meta information from DB
	$meta = getMetaInformation($conn);
	
	// Retrieve requested root from DB
	$sql = "SELECT * FROM synie_roots WHERE `root`='". mysql_real_escape_string($root) ."'";
	$results = mysql_query($sql, $conn) or die(err("invalid query".mysql_error()));
	$row = mysql_fetch_assoc($results);
	
	$nodes = array();
	// Iterate through $meta and build nodes array
	foreach($meta as $lang=>$arr) {
		$start = intval($arr['begin']);
		$end = intval($arr['end']);
		if($end==0) $end = intval(date('Y'));
		$node_data = $arr['nodedata'];
		$raw_words = clean_parts(explode(";", $row[$lang]));
		$words = array();
		if(!strcmp($lang, "ne")) {
			// Modern english doens't have (or need) glosses
			$words = $raw_words;
		}else{
			// Interpret the signs and glosses from the database entries
			foreach($raw_words as $i=>$word) {
				$matches = NULL;
				if(preg_match("/(?P<sign>[^\'\[]+)\s[\'\]](?P<gloss>[^\'\]]+)[\]\']/", $word, $matches)!=1) {
					// Error reading database entry. It is not in the right format. For now
					// exit silently.
					$words[] = array('sign'=>'', 'gloss'=>'');
				}else{
					$aux = false;
					if(strpos($word, '[')!==false && strpos($word, ']')!==false) {
						$aux = true;
					}
					$words[] = array('sign'=>$matches['sign'], 'gloss'=>$matches['gloss'], 'auxType'=>$aux);
				}
			}
		}
					
		$data = array('words' => $words, // words is a list of objects [{'sign': $sign, 'gloss': $gloss} ... ]
					  'start' => $start,
					  'end'   => $end);
		$node_data['data'] = $data;
		$nodes[] = $node_data;
	}
	
	return $nodes;	
}


// -- Get PIE roots for semantic cognates ---------- //
function rootsBySynonyms($concept, $mysql_conn) {
	// Get language meta information from DB
	$meta = getMetaInformation($mysql_conn);
	
	// Get word entry from database
	$sql = "SELECT * FROM synie WHERE `concept`='" . mysql_real_escape_string($concept) . "'";
	$results = mysql_query($sql, $mysql_conn);
	if(!$results) die(err("invalid query -- ".mysql_error()));
	$row = mysql_fetch_assoc($results);
	
	// Storage arrays
	$words = array();
	$used_roots = array();
	$root_clumps = array();
	$edges = array();
	$core_nodes = array();
	$extra_nodes = array();
	
	foreach($meta as $lang=>$arr) {
		// Iterate through languages and build up $core_nodes and $extra_nodes
		$rootcode = $arr['rootcode'];
		$node_data = $arr['nodedata'];
		$pieroots = clean_parts(explode(";", $row[$rootcode]));
		$signs = clean_parts(explode(";", $row[$lang]));
		$groups = array();
		$roots = array();
		
		if(count($pieroots)!=count($signs)) {
			// Verify that $pieroots and $signs are of same length
			// Append blank strings to the shorter array until they are parallel.
			while(count($pieroots)<count($signs)) {
				$pieroots[] = "";
			}
			while(count($signs)<count($pieroots)) {
				$signs[] = "";
			}
		}
		
		foreach($pieroots as $index=>$pieroot) {
			// Determine cognate group for each pieroot
			$group = array_search($pieroot, $used_roots);
			$root_clump = array();
			if($group===false) {
				$used_roots[] = $pieroot;
				$group = count($used_roots)-1;
				$splitroot = clean_parts(explode(",", $pieroot));
				foreach($splitroot as $j=>$root) {
					$sql = "SELECT `root`,`origin`,`meaning`,`attested` FROM synie_roots WHERE `root`='". mysql_real_escape_string($root) ."'";
					$results = mysql_query($sql, $mysql_conn) or die(err("can't find root definition"));
					$res = mysql_fetch_assoc($results);
					$root_clump[] = array('root'    => $res['root'],
										  'origin'  => $res['origin'],
										  'meaning' => $res['meaning'],
										  'attested'=> (!strcmp($res['attested'], "1")));
				}
				$root_clumps[] = $root_clump;
			}
			$roots[] = $root_clumps[$group];
			$groups[] = $group;
		}
		
		// Create new core word
		$new_core_word = array('concept' => $concept,
							   'sign'    => $signs[0],
							   'PIEroot' => $roots[0],
							   'group'   => $groups[0]);
		$new_core_node = $node_data;
		$new_core_node['data'] = $new_core_word;
		$core_nodes[] = $new_core_node;
		
		// Put the remainder of the words in extra_words array
		
		for($i=1; $i<count($signs); $i++) {
			$new_extra_node = $node_data;
			$new_extra_word = array('concept' => $concept,
									'sign'	  => $signs[$i],
									'PIEroot' => $roots[$i],
									'group'   => $groups[$i]);
			$new_extra_node['data'] = $new_extra_word;
			$extra_nodes[] = $new_extra_node;
			$core_index = count($core_nodes)-1;
			$extra_index = count($extra_nodes)-1;
			$extra_nodes[$extra_index]['data'] = $new_extra_word;
			$edges[] = array('source' => $core_index, 'to_delta' => $extra_index);
		}
	}
	
	for($i=0; $i<count($edges); $i++) {
		// Calculate absolute position of target in edges
		$edges[$i]['target'] = count($core_nodes) + $edges[$i]['to_delta'];
		unset($edges[$i]['to_delta']);
		$edges[$i]['value'] = 1; # default value -- any semantic possibility for edge weights?
	}
	
	
	// Create final object
	$meta_data = array('groups' => count($used_roots));
	$json_data = array('nodes' => array_merge($core_nodes, $extra_nodes),
					   'edges' => $edges,
					   'meta' => $meta_data);
	
	return $json_data;	
}


// MAIN ROUTINE //


// -- Interpret request ---------------------------- //
$word = '';
$mode = '';
if(!isset($_GET['w'])) {
	echo json_encode(array("error" => "Missing request word (you need to set w)"));
	exit(0);
}
$word = $_GET['w'];
if(!isset($_GET['m'])) {
	echo json_encode(array("error" => "Missing request mode (you need to set m)"));
	exit(0);
}
$mode = $_GET['m'];


// -- Establish connection to DB ------------------- //
$mysql_conn = mysql_connect($mysql_hosta, $mysql_uname, $mysql_passw);
if(!$mysql_conn) die(json_encode(array("error"=>"can't authenticate)")));
mysql_set_charset("UTF8", $mysql_conn);
$mysql_db = mysql_select_db($mysql_datab, $mysql_conn);
if(!$mysql_db) die(json_encode(array("error"=>"can't connect to db)")));


// -- Get requested data --------------------------- //
$data = NULL;
switch($mode) {
	case 'root':
		$data = cognatesByPIERoot($word, $mysql_conn);
		break;
	case 'concept':
		$data = rootsBySynonyms($word, $mysql_conn);
		break;
	default:
		echo json_encode(array("error" => "Unrecognized mode"));
		exit(0);
}


// -- Output --------------------------------------- //
$json = json_encode($data);
echo($json);

?>