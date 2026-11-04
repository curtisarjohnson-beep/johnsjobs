<?php
declare(strict_types=1);
namespace JohnsJobs;
require_once __DIR__.'/renderer.php';
const MAX_REQUEST=6_000_000;
const MAX_IMAGE=5_000_000;
const MAX_ATTACHMENTS=5_000_000;
const MAX_EMAIL_JSON=8_000_000;
function response(int $status,string $code,string $message,array $extra=[]): array {
 return ['status'=>$status,'body'=>array_merge(['ok'=>$status===200,'code'=>$code,'message'=>$message],$extra)];
}
function valid_config(array $config): bool {
 return ($config['enabled']??false)===true && is_string($config['api_key']??null) && preg_match('/\Are_[A-Za-z0-9_-]{10,256}\z/',$config['api_key'])===1 && is_string($config['token_secret']??null) && preg_match('/\A[a-f0-9]{64,}\z/i',$config['token_secret'])===1 && in_array($config['allowed_origin']??'', ['https://johnsjobs.uk','https://www.johnsjobs.uk'],true) && is_string($config['state_dir']??null) && is_dir($config['state_dir']) && is_writable($config['state_dir']);
}
function signature(string $value,array $config): string { return hash_hmac('sha256',$value,$config['token_secret']); }
function token(array $config,string $ip,int $now): string {
 $payload=$now.'.'.bin2hex(random_bytes(16));return $payload.'.'.signature($payload.'|'.$ip,$config);
}
function verify_token(string $value,array $config,string $ip,int $now): ?array {
 if(!preg_match('/\A(\d{10})\.([a-f0-9]{32})\.([a-f0-9]{64})\z/',$value,$m))return null;
 $age=$now-(int)$m[1];if($age<3 || $age>3600 || !hash_equals(signature($m[1].'.'.$m[2].'|'.$ip,$config),$m[3]))return null;
 return ['nonce'=>$m[2],'created'=>(int)$m[1]];
}
// One bounded private state file. Contains keyed hashes, counts/timestamps and outcomes only.
function state(array $config,callable $work): mixed {
 $file=fopen($config['state_dir'].'/enquiry-state.json','c+');
 if(!$file || !flock($file,LOCK_EX))throw new \RuntimeException('State unavailable');
 try {
  $raw=stream_get_contents($file);$data=$raw===''?['rates'=>[],'requests'=>[]]:json_decode($raw,true,512,JSON_THROW_ON_ERROR);
  if(!is_array($data) || !isset($data['rates'],$data['requests']))throw new \RuntimeException('Invalid state');
  $result=$work($data);$encoded=json_encode($data,JSON_THROW_ON_ERROR);
  rewind($file);if(!ftruncate($file,0) || fwrite($file,$encoded)!==strlen($encoded) || !fflush($file))throw new \RuntimeException('State unavailable');
  return $result;
 } finally {flock($file,LOCK_UN);fclose($file);}
}
function limited(array $config,string $ip,int $now): bool {
 return state($config,static function (&$data)use($config,$ip,$now){
  foreach($data['rates'] as $k=>$r)if($now-$r['start']>=3600)unset($data['rates'][$k]);
  foreach($data['requests'] as $k=>$r)if($now-$r['created']>=86400)unset($data['requests'][$k]);
  $key=signature('rate|'.$ip,$config);$window=intdiv($now,600)*600;
  $current=$data['rates'][$key]??['start'=>$window,'count'=>0];
  if($current['start']!==$window)$current=['start'=>$window,'count'=>0];
  $global=$data['rates']['global']??['start'=>intdiv($now,3600)*3600,'count'=>0];
  if($now-$global['start']>=3600)$global=['start'=>intdiv($now,3600)*3600,'count'=>0];
  if($current['count']>=5 || $global['count']>=100 || count($data['rates'])>=5000 || count($data['requests'])>=5000)return true;
  $current['count']++;$global['count']++;$data['rates'][$key]=$current;$data['rates']['global']=$global;return false;
 });
}
function fields(array $post): array {
 $data=[];$errors=[];
 foreach(['fullName'=>120,'email'=>254,'phone'=>120,'location'=>120,'category'=>60,'description'=>5000] as $key=>$max){
  $value=$post[$key]??null;
  if(!is_string($value)){$errors[$key]='Please complete this field.';continue;}
  $value=trim(str_replace(["\r\n","\r"],"\n",$value));
  if(!preg_match('/\A.{1,'.$max.'}\z/su',$value) || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/',$value) || ($key!=='description' && preg_match('/[\n\t]/',$value))){$errors[$key]='Please enter a valid value within the allowed length.';continue;}
  $data[$key]=$value;
 }
 if(isset($data['email']) && !filter_var($data['email'],FILTER_VALIDATE_EMAIL))$errors['email']='Please enter a valid email address.';
 if(isset($data['phone'])){ $digits=preg_replace('/\D/','',$data['phone']);if(!preg_match('/\A\+?[\d ().-]+\z/',$data['phone']) || strlen($digits)<7 || strlen($digits)>15)$errors['phone']='Please enter a valid phone number.';}
 if(isset($data['category']) && !array_key_exists($data['category'],CATEGORIES))$errors['category']='Please select a valid clearance type.';
 return [$data,$errors];
}
function attachments(array $files,callable $uploaded): array {
 if(!$files)return [[],[],null];
 if(array_keys($files)!==['photos'])return [[],[],'Please upload photos using the photo field.'];
 $group=$files['photos'];
 if(!is_array($group) || !isset($group['error']) || !is_array($group['error']) || count($group['error'])>5)return [[],[],'Choose no more than five photos.'];
 foreach(['tmp_name','name','size','type'] as $part)if(!isset($group[$part]) || !is_array($group[$part]) || array_keys($group[$part])!==array_keys($group['error']))return [[],[],'The photo upload was incomplete.'];
 $attachments=[];$names=[];$total=0;$finfo=new \finfo(FILEINFO_MIME_TYPE);
 foreach($group['error'] as $i=>$error){
  if($error===UPLOAD_ERR_NO_FILE)continue;
  if($error!==UPLOAD_ERR_OK)return [[],[],'A photo could not be uploaded. Check the 5 MB limit and try again.'];
  $path=$group['tmp_name'][$i];if(!is_string($path) || !$uploaded($path))return [[],[],'Invalid photo upload.'];
  $size=filesize($path);if(!$size || $size>MAX_IMAGE || ($total+=$size)>MAX_ATTACHMENTS)return [[],[],'Photos must be at most 5 MB each and 5 MB in total.'];
  $mime=$finfo->file($path);$allowed=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
  $info=@getimagesize($path);
  if(!isset($allowed[$mime]) || !$info || ($info['mime']??'')!==$mime || $info[0]<1 || $info[1]<1 || $info[0]>16000 || $info[1]>16000 || $info[0]*$info[1]>20_000_000)return [[],[],'Choose a valid JPEG, PNG or WebP image.'];
  $bytes=file_get_contents($path);
  if($bytes===false || !raster_structure($bytes,$mime))return [[],[],'A photo is incomplete or invalid. Please select another image.'];
  // Never use a supplied filename as a path. Display the prepared safe attachment name.
  $name='clearance-photo-'.(count($attachments)+1).'.'.$allowed[$mime];
  // Original names are presentation only; attachment filenames remain generated.
  $original=$group['name'][$i]??'';
  $display=is_string($original)?basename(str_replace('\\','/',$original)):'';
  if(!preg_match('/\A[^\x00-\x1f\x7f]{1,255}\z/u',$display))$display=$name;
  $names[]=$display;$attachments[]=['filename'=>$name,'content'=>base64_encode($bytes)];
 }
 return [$attachments,$names,null];
}
function raster_structure(string $b,string $mime): bool {
 $length=strlen($b);
 if($mime==='image/jpeg')return str_starts_with($b,"\xff\xd8\xff") && str_ends_with($b,"\xff\xd9");
 if($mime==='image/webp')return $length>=12 && substr($b,0,4)==='RIFF' && substr($b,8,4)==='WEBP' && unpack('V',substr($b,4,4))[1]+8===$length;
 if(!str_starts_with($b,"\x89PNG\r\n\x1a\n"))return false;
 $pos=8;$idat=false;
 while($pos+12<=$length){
  $size=unpack('N',substr($b,$pos,4))[1];if($size>$length-$pos-12)return false;
  $type=substr($b,$pos+4,4);$chunk=substr($b,$pos+4,4+$size);
  if(hash('crc32b',$chunk,true)!==substr($b,$pos+8+$size,4))return false;
  if($type==='IDAT')$idat=true;
  $pos+=12+$size;
  if($type==='IEND')return $size===0 && $pos===$length && $idat;
 }
 return false;
}
function resend_transport(string $json,string $key,string $idempotency): array {
 $curl=curl_init('https://api.resend.com/emails');
 curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$json,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$key,'Content-Type: application/json','Idempotency-Key: '.$idempotency],CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>20,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS]);
 $body=curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE);curl_close($curl);
 return ['status'=>$status,'body'=>is_string($body)?$body:'']; // Never log provider bodies or headers.
}
function handle(array $config,array $server,array $post,array $files,?callable $transport=null,?int $now=null,?callable $uploaded=null): array {
 $now??=time();$transport??=__NAMESPACE__.'\\resend_transport';$uploaded??='is_uploaded_file';
 if(!valid_config($config))return response(503,'unavailable','Online enquiries are unavailable. Please call or email John.');
 if(($server['HTTPS']??'')!=='on' && ($server['SERVER_PORT']??'')!=='443')return response(403,'https_required','Please use the secure website.');
 $method=$server['REQUEST_METHOD']??'';$origin=$server['HTTP_ORIGIN']??'';$ip=$server['REMOTE_ADDR']??'';
 if(!filter_var($ip,FILTER_VALIDATE_IP))return response(403,'forbidden','Unable to verify this request.');
 if(($server['HTTP_SEC_FETCH_SITE']??'')==='cross-site' || ($origin!=='' && $origin!==$config['allowed_origin']))return response(403,'forbidden','Please submit from the JohnsJobs website.');
 if($method==='GET')return response(200,'ready','Ready',['enabled'=>true,'token'=>token($config,$ip,$now)]);
 if($method!=='POST')return response(405,'method_not_allowed','Use GET or POST.');
 if($origin!==$config['allowed_origin'])return response(403,'forbidden','Please submit from the JohnsJobs website.');
 if(!str_starts_with(strtolower($server['CONTENT_TYPE']??''),'multipart/form-data;'))return response(415,'unsupported_type','Please use the enquiry form.');
 if((int)($server['CONTENT_LENGTH']??0)>MAX_REQUEST)return response(413,'payload_too_large','Please reduce the number or size of your photos.');
 if(limited($config,$ip,$now))return response(429,'rate_limited','Too many attempts. Please wait ten minutes or call John.');
 $challenge=is_string($post['token']??null)?verify_token($post['token'],$config,$ip,$now):null;
 if(!$challenge || !isset($post['website']) || !is_string($post['website']) || $post['website']!=='')return response(422,'verification_failed','Please refresh the form and try again.');
 [$data,$errors]=fields($post);if($errors)return response(422,'validation_error','Please check the highlighted fields.',['errors'=>$errors]);
 [$photos,$filenames,$error]=attachments($files,$uploaded);if($error)return response(422,'validation_error','Please check your photos.',['errors'=>['photos'=>$error]]);
 $mail=render_email($data,$filenames);
 $payload=['from'=>'JohnsJobs Enquiries <enquiries@johnsjobs.uk>','to'=>['john@johnsjobs.uk'],'reply_to'=>$data['email'],'subject'=>$mail['subject'],'html'=>$mail['html'],'text'=>$mail['text']];
 if($photos)$payload['attachments']=$photos;
 $json=json_encode($payload,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
 if(strlen($json)>MAX_EMAIL_JSON)return response(413,'payload_too_large','Please reduce your photos and try again.');
 $fingerprint=signature($json,$config);$requestKey=signature('request|'.$challenge['nonce'].'|'.$ip,$config);
 $reservation=state($config,static function (&$state)use($requestKey,$fingerprint,$challenge,$now){
  $previous=$state['requests'][$requestKey]??null;
  if($previous){
   if(!hash_equals($previous['fingerprint'],$fingerprint))return 'changed';
   if($previous['status']==='accepted')return 'accepted';
   if($now-$previous['attempt']<30)return 'pending';
  }
  $state['requests'][$requestKey]=['fingerprint'=>$fingerprint,'status'=>'pending','attempt'=>$now,'created'=>$challenge['created']];return 'send';
 });
 if($reservation==='accepted')return response(200,'accepted','Your enquiry has been sent. John will be in touch.');
 if($reservation==='changed')return response(409,'changed_request','A previous attempt may still be processing. Please call John before starting a different enquiry.');
 if($reservation==='pending')return response(409,'pending','Your enquiry may still be processing. Please wait 30 seconds before retrying.');
 try{$result=$transport($json,$config['api_key'],'johnsjobs-'.$requestKey);}catch(\Throwable){return response(503,'delivery_unconfirmed','Delivery could not be confirmed. Keep your details and retry after 30 seconds, or call John.');}
 $provider=json_decode($result['body']??'',true);
 if(($result['status']??0)>=200 && ($result['status']??0)<300 && is_array($provider) && is_string($provider['id']??null) && $provider['id']!==''){
  state($config,static function (&$state)use($requestKey){$state['requests'][$requestKey]['status']='accepted';});
  return response(200,'accepted','Your enquiry has been sent. John will be in touch.');
 }
 return response(503,'delivery_unconfirmed','Delivery could not be confirmed. Retry after 30 seconds without changing your enquiry, or call John.');
}
