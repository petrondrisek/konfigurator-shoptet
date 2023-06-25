<?php
header('Content-type: text/javascript');
$csv = fopen("kava.csv", "r");
$kavaData = [];
$itemId = -1;
$dataKeys = [];
while (($data = fgetcsv($csv, 1000, ";")) !== FALSE) {
    if($itemId == -1) $dataKeys = $data;
    else for($i = 0; $i < count($data); $i++) {
        $kavaData[$itemId][$dataKeys[$i]] = $data[$i];
    } 
    $itemId++;
}

$saveTo = fopen("kava.txt", "w");
fwrite($saveTo, json_encode($kavaData, JSON_PRETTY_PRINT));
fclose($saveTo);

echo json_encode($kavaData, JSON_PRETTY_PRINT);

fclose($csv);