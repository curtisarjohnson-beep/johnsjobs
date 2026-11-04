<?php
declare(strict_types=1);
require __DIR__.'/../private/enquiry.php';
use function JohnsJobs\handle;
use function JohnsJobs\render_email;
$root=sys_get_temp_dir().'/johnsjobs-test-'.bin2hex(random_bytes(8));mkdir($root,0700);
$config=['enabled'=>true,'api_key'=>'re_test_not_a_real_key','token_secret'=>str_repeat('a',64),'allowed_origin'=>'https://johnsjobs.uk','state_dir'=>$root];
$server=['HTTPS'=>'on','SERVER_PORT'=>'443','REMOTE_ADDR'=>'192.0.2.1','REQUEST_METHOD'=>'POST','HTTP_ORIGIN'=>'https://johnsjobs.uk','HTTP_SEC_FETCH_SITE'=>'same-origin','CONTENT_TYPE'=>'multipart/form-data; boundary=test','CONTENT_LENGTH'=>'1000'];
$time=1793782800;$count=0;$calls=[];
$transport=static function($json,$key,$id)use(&$calls){$calls[]=['payload'=>json_decode($json,true),'id'=>$id];return ['status'=>200,'body'=>'{"id":"mock-message-id"}'];};
function check(bool $ok,string $label): void {global $count;if(!$ok)throw new RuntimeException('FAIL: '.$label);$count++;echo 'PASS '.$label."\n";}
function request(array $changes=[],array $postChanges=[],array $files=[],?callable $send=null): array {
 global $config,$server,$time,$transport;
 $s=array_replace($server,$changes);
 $ready=handle($config,array_replace($s,['REQUEST_METHOD'=>'GET']),[],[],null,$time);
 $p=array_replace(['fullName'=>'James Mitchell','email'=>'james.mitchell@example.com','phone'=>'07700 900123','location'=>'LU1, Luton','category'=>'full-house','description'=>"Furniture downstairs.\nBoxes in the loft.",'website'=>'','token'=>$ready['body']['token']??''],$postChanges);
 return handle($config,$s,$p,$files,$send??$transport,$time+5,static fn($path)=>is_file($path));
}
try{
 check(handle(['enabled'=>false],$server,[],[])['status']===503,'disabled/private configuration fails closed');
 check(request(['REQUEST_METHOD'=>'DELETE'])['status']===405,'method enforcement');
 check(request(['HTTPS'=>'off','SERVER_PORT'=>'80'])['status']===403,'HTTPS enforcement');
 check(request(['HTTP_ORIGIN'=>'https://attacker.example'])['status']===403,'cross-origin rejected');
 check(request(['HTTP_ORIGIN'=>''])['status']===403,'missing Origin rejected');
 check(request(['HTTP_SEC_FETCH_SITE'=>'cross-site'])['status']===403,'cross-site browser rejected');
 check(request(['CONTENT_LENGTH'=>'6000001'])['status']===413,'total request limit');
 check(request(['CONTENT_TYPE'=>'application/json'])['status']===415,'multipart required');
 check(request([],['website'=>'spam'])['status']===422,'honeypot rejected');
 check(request([],['token'=>'forged'])['status']===422,'forged token rejected');
 check(request([],['email'=>"a@example.com\r\nBcc: attacker@example.com"])['status']===422,'email header injection rejected');
 check(request([],['fullName'=>' ','description'=>' '])['status']===422,'whitespace rejected');
 check(request([],['category'=>'bad'])['status']===422,'category allowlist');
 // Fresh address for each group: validation attempts are deliberately rate limited too.
 $server['REMOTE_ADDR']='192.0.2.2';
 $result=request();check($result['status']===200 && $result['body']['code']==='accepted','provider acceptance produces genuine success');
 $sent=end($calls)['payload'];check($sent['from']==='JohnsJobs Enquiries <enquiries@johnsjobs.uk>' && $sent['to']===['john@johnsjobs.uk'],'fixed sender and recipient');
 check($sent['reply_to']==='james.mitchell@example.com' && isset($sent['html'],$sent['text']),'reply-to and multipart email bodies');
 request([],['to'=>'attacker@example.com','from'=>'attacker@example.com']);$fixed=end($calls)['payload'];check($fixed['to']===['john@johnsjobs.uk'] && $fixed['from']==='JohnsJobs Enquiries <enquiries@johnsjobs.uk>','customer sender and recipient overrides ignored');
 check(request([],['fullName'=>'<script>alert(1)</script>'])['status']===200,'safe markup can be rendered as text');
 $sent=end($calls)['payload'];check(!str_contains($sent['html'],'<script>') && str_contains($sent['html'],'&lt;script&gt;'),'HTML escaped');
 $server['REMOTE_ADDR']='192.0.2.3';
 $failure=static fn()=>['status'=>401,'body'=>'{"secret":"must not reach browser"}'];
 $r=request([],[],[],$failure);check($r['status']===503 && !str_contains(json_encode($r),'secret'),'safe provider failure without fake success');
 $r=request([],[],[],static function(){throw new RuntimeException('private error');});check($r['status']===503 && !str_contains(json_encode($r),'private error'),'transport exceptions safe');
 $server['REMOTE_ADDR']='192.0.2.4';
 $ready=handle($config,array_replace($server,['REQUEST_METHOD'=>'GET']),[],[],null,$time);
 $post=['fullName'=>'James','email'=>'james@example.com','phone'=>'07700 900123','location'=>'Luton','category'=>'trade','description'=>'Boxes','website'=>'','token'=>$ready['body']['token']];
 check(handle($config,$server,$post,[],$transport,$time+1)['status']===422,'minimum token age');
 check(handle($config,$server,$post,[],$transport,$time+3601)['status']===422,'expired token');
 $n=count($calls);$r1=handle($config,$server,$post,[],$transport,$time+5);$r2=handle($config,$server,$post,[],$transport,$time+6);
 check($r1['status']===200 && $r2['status']===200 && count($calls)===$n+1,'accepted replay does not resend');
 check(handle($config,$server,array_replace($post,['description'=>'changed']),[],$transport,$time+7)['status']===409,'changed payload cannot reuse idempotency key');
 $server['REMOTE_ADDR']='192.0.2.5';
 $ready=handle($config,array_replace($server,['REQUEST_METHOD'=>'GET']),[],[],null,$time);$post['token']=$ready['body']['token'];
 $attempts=[];$ambiguous=static function($json,$key,$id)use(&$attempts){$attempts[]=$id;return ['status'=>0,'body'=>''];};
 handle($config,$server,$post,[],$ambiguous,$time+5);
 check(handle($config,$server,$post,[],$transport,$time+6)['status']===409,'concurrent/uncertain replay waits');
 handle($config,$server,$post,[],$ambiguous,$time+36);
 check(count($attempts)===2 && $attempts[0]===$attempts[1],'uncertain retries use same Resend idempotency key');
 $server['REMOTE_ADDR']='192.0.2.6';
 for($i=0;$i<5;$i++)request([],['token'=>'bad']);
 check(request()['status']===429,'per-IP rate limiting');
 $server['REMOTE_ADDR']='192.0.2.7';
 $image=$root.'/photo';file_put_contents($image,base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4ioAAAAASUVORK5CYII='));
 // Generate a valid 1x1 PNG with explicit CRCs, without requiring GD.
 $chunk=static fn($type,$data)=>pack('N',strlen($data)).$type.$data.hash('crc32b',$type.$data,true);
 file_put_contents($image,"\x89PNG\r\n\x1a\n".$chunk('IHDR',pack('NNCCCCC',1,1,8,2,0,0,0)).$chunk('IDAT',gzcompress("\x00\xff\x00\x00")).$chunk('IEND',''));
 $group=static fn($paths,$type='image/png')=>['photos'=>['error'=>array_fill(0,count($paths),UPLOAD_ERR_OK),'tmp_name'=>$paths,'name'=>array_fill(0,count($paths),'photo.png'),'size'=>array_map('filesize',$paths),'type'=>array_fill(0,count($paths),$type)]];
 check(request([],[],$group([$image]))['status']===200,'actual PNG accepted');
 $payload=end($calls)['payload'];check($payload['attachments'][0]['content']===base64_encode(file_get_contents($image)),'photo delivered as attachment, not embedded');
 check(request([],[],$group(array_fill(0,6,$image)))['status']===422,'six images rejected');
 $bad=$root.'/bad';file_put_contents($bad,'<?php malicious text ?>');
 check(request([],[],$group([$bad]))['status']===422,'fake image rejected despite extension and supplied MIME');
 $partial=$group([$image]);$partial['photos']['error'][0]=UPLOAD_ERR_PARTIAL;
 check(request([],[],$partial)['status']===422,'partial upload rejected');
 $server['REMOTE_ADDR']='192.0.2.8';
 $large=$root.'/large';$fp=fopen($large,'w');ftruncate($fp,5000001);fclose($fp);
 check(request([],[],$group([$large]))['status']===422,'per-image five MB boundary');
 $middle=$root.'/middle';$fp=fopen($middle,'w');ftruncate($fp,3000000);fclose($fp);
 [$unused,$names,$error]=\JohnsJobs\attachments($group([$image,$large]),static fn()=>true);check($error!==null,'aggregate/invalid file rejection');
 $server['REMOTE_ADDR']='192.0.2.9';
 foreach(['jpg','webp'] as $extension){
  $fixture=__DIR__.'/fixtures/photo.'.$extension;
  check(request([],[],$group([$fixture]))['status']===200,'actual '.$extension.' content accepted');
 }
 $padded=$root.'/padded';
 file_put_contents($padded,"\x89PNG\r\n\x1a\n".$chunk('IHDR',pack('NNCCCCC',1,1,8,2,0,0,0)).$chunk('tEXt','padding'."\x00".str_repeat('x',3000000)).$chunk('IDAT',gzcompress("\x00\xff\x00\x00")).$chunk('IEND',''));
 [$unused,$names,$error]=\JohnsJobs\attachments($group([$padded,$padded]),static fn()=>true);
 check($error!==null && str_contains($error,'total'),'two valid individually allowed files over total cap rejected');
 $truncated=$root.'/truncated';file_put_contents($truncated,substr(file_get_contents($image),0,-5));
 [$unused,$names,$error]=\JohnsJobs\attachments($group([$truncated]),static fn()=>true);
 check($error!==null,'truncated image structure rejected');
 $mail=render_email(['fullName'=>'<James>','email'=>'james@example.com','phone'=>'07700 900123','location'=>'LU1','category'=>'full-house','description'=>"One\nTwo"],['photo.jpg']);
 check(str_contains($mail['html'],'&lt;James&gt;') && str_contains($mail['html'],'One<br>Two') && str_contains($mail['text'],"One\nTwo"),'PHP renderer escaping and line breaks');
 check(str_contains(render_email(['fullName'=>'James','email'=>'james@example.com','phone'=>'07700 900123','location'=>'LU1','category'=>'full-house','description'=>'Boxes'],[])['html'],'No photos attached.'),'no-photo email variant');
 $saved=json_decode(file_get_contents($root.'/enquiry-state.json'),true);$saved['rates']['global']=['start'=>intdiv($time,3600)*3600,'count'=>100];file_put_contents($root.'/enquiry-state.json',json_encode($saved));
 check(request()['status']===429,'global hourly rate cap');
 $state=file_get_contents($root.'/enquiry-state.json');check(!str_contains($state,'James')&&!str_contains($state,'192.0.2.')&&!str_contains($state,'example.com'),'private state has no customer data or raw IP');
 echo "All $count PHP checks passed; mocked transport only, no live email.\n";
}finally{foreach(glob($root.'/*') as $file)unlink($file);rmdir($root);}
