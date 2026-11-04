<?php
declare(strict_types=1);
// A malformed config must never echo its contents through the endpoint.
$testRoot=sys_get_temp_dir().'/johnsjobs-wrapper-'.bin2hex(random_bytes(8));
mkdir($testRoot.'/public_html/api',0700,true);mkdir($testRoot.'/private/johnsjobs-backend',0700,true);
copy(__DIR__.'/../public/enquiry.php',$testRoot.'/public_html/api/enquiry.php');
copy(__DIR__.'/../private/enquiry.php',$testRoot.'/private/johnsjobs-backend/enquiry.php');
copy(__DIR__.'/../private/renderer.php',$testRoot.'/private/johnsjobs-backend/renderer.php');
file_put_contents($testRoot.'/private/resend-config.php','PRIVATE_TEST_ONLY_MUST_NEVER_APPEAR');
try{
 ob_start();require $testRoot.'/public_html/api/enquiry.php';$output=ob_get_clean();
 $decoded=json_decode($output,true);
 if(str_contains($output,'PRIVATE_TEST_ONLY') || !is_array($decoded) || $decoded['ok']!==false || http_response_code()!==503)throw new RuntimeException('Malformed config leaked or unsafe response');
 file_put_contents($testRoot.'/private/resend-config.php',"<?php file_put_contents(__DIR__.'/loaded-marker','loaded'); return ['enabled'=>false];");
 ob_start();require $testRoot.'/public_html/api/enquiry.php';$disabledOutput=ob_get_clean();
 if(!is_file($testRoot.'/private/loaded-marker') || json_decode($disabledOutput,true)['ok']!==false)throw new RuntimeException('Private FTP path not loaded');
 mkdir($testRoot.'/private/johnsjobs-state',0700);
 $readyConfig=['enabled'=>true,'api_key'=>'re_test_not_a_real_key','token_secret'=>str_repeat('a',64),'allowed_origin'=>'https://johnsjobs.uk','state_dir'=>$testRoot.'/private/johnsjobs-state'];
 file_put_contents($testRoot.'/private/resend-config.php','<?php return '.var_export($readyConfig,true).';');
 $_SERVER=array_replace($_SERVER,['REQUEST_METHOD'=>'GET','HTTPS'=>'on','SERVER_PORT'=>'443','REMOTE_ADDR'=>'192.0.2.1']);
 ob_start();require $testRoot.'/public_html/api/enquiry.php';$readyOutput=ob_get_clean();
 if((json_decode($readyOutput,true)['enabled']??false)!==true || http_response_code()!==200)throw new RuntimeException('Private config/library readiness failed');
 echo "PASS 3 public wrapper checks: config output suppressed, private FTP path loaded, GET readiness works without sending mail.\n";
}finally{
 foreach([$testRoot.'/private/resend-config.php',$testRoot.'/private/loaded-marker',$testRoot.'/public_html/api/enquiry.php',$testRoot.'/private/johnsjobs-backend/enquiry.php',$testRoot.'/private/johnsjobs-backend/renderer.php'] as $f)unlink($f);
 foreach([$testRoot.'/public_html/api',$testRoot.'/public_html',$testRoot.'/private/johnsjobs-backend',$testRoot.'/private/johnsjobs-state',$testRoot.'/private',$testRoot] as $d)rmdir($d);
}
