<?php
declare(strict_types=1);
// Installed at /home/johnsjobs/public_html/api/enquiry.php.
umask(0077);
ini_set('display_errors','0');
ini_set('log_errors','0'); // This endpoint must not log submitted content/provider responses.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex');
$privateRoot=dirname(__DIR__,2);
try {
    $configFile=$privateRoot.'/resend-config.php';
    $library=$privateRoot.'/johnsjobs-backend/enquiry.php';
    if(!is_file($configFile) || !is_file($library))throw new RuntimeException('Unavailable');
    // Discard accidental config output, including a key pasted without a PHP tag.
    ob_start();
    try { $config=require $configFile; } finally { ob_end_clean(); }
    require_once $library;
    if(!is_array($config) || !extension_loaded('curl') || !extension_loaded('fileinfo'))throw new RuntimeException('Unavailable');
    $result=\JohnsJobs\handle($config,$_SERVER,$_POST,$_FILES);
} catch (Throwable) {
    $result=['status'=>503,'body'=>['ok'=>false,'code'=>'unavailable','message'=>'Online enquiries are unavailable. Please call or email John.']];
} finally {
    // PHP normally cleans these automatically; also remove accepted temporary paths explicitly.
    foreach($_FILES as $group){
        if(!is_array($group))continue;
        $paths=$group['tmp_name']??[];
        foreach(is_array($paths)?$paths:[$paths] as $path)if(is_string($path) && is_uploaded_file($path))@unlink($path);
    }
}
http_response_code($result['status']);
if($result['status']===405)header('Allow: GET, POST');
if($result['status']===429)header('Retry-After: 600');
if($result['status']===409)header('Retry-After: 30');
echo json_encode($result['body'],JSON_INVALID_UTF8_SUBSTITUTE);
