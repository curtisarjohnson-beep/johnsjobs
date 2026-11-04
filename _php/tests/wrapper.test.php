<?php
declare(strict_types=1);
// A malformed config must never echo its contents through the endpoint.
$testRoot=sys_get_temp_dir().'/johnsjobs-wrapper-'.bin2hex(random_bytes(8));
mkdir($testRoot.'/public_html/api',0700,true);mkdir($testRoot.'/johnsjobs-backend',0700);
copy(__DIR__.'/../public/enquiry.php',$testRoot.'/public_html/api/enquiry.php');
copy(__DIR__.'/../private/enquiry.php',$testRoot.'/johnsjobs-backend/enquiry.php');
copy(__DIR__.'/../private/renderer.php',$testRoot.'/johnsjobs-backend/renderer.php');
file_put_contents($testRoot.'/resend-config.php','PRIVATE_TEST_ONLY_MUST_NEVER_APPEAR');
try{
 ob_start();require $testRoot.'/public_html/api/enquiry.php';$output=ob_get_clean();
 $decoded=json_decode($output,true);
 if(str_contains($output,'PRIVATE_TEST_ONLY') || !is_array($decoded) || $decoded['ok']!==false || http_response_code()!==503)throw new RuntimeException('Malformed config leaked or unsafe response');
 echo "PASS public wrapper suppresses accidental private config output; safe 503 JSON.\n";
}finally{
 foreach([$testRoot.'/resend-config.php',$testRoot.'/public_html/api/enquiry.php',$testRoot.'/johnsjobs-backend/enquiry.php',$testRoot.'/johnsjobs-backend/renderer.php'] as $f)unlink($f);
 foreach([$testRoot.'/public_html/api',$testRoot.'/public_html',$testRoot.'/johnsjobs-backend',$testRoot] as $d)rmdir($d);
}
