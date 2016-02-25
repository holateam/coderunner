<?php

require 'config.php';

$data       = file_get_contents('php://input');
$decoded    = json_decode($data);
$secret     = (isset($decoded->secretKey)) ? $decoded->secretKey : '';

if ($secret != SERVER_SECRET) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

$dir_name   = date("Y-m-d"); 
$file_name  = date("H:i:s");

file_put_contents("logs/$dir_name/$file_name", $data);

header("HTTP/1.1 200 OK");
echo "logs/$dir_name<br>logs/$dir_name/$file_name";
exit;

?>