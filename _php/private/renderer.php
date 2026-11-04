<?php
declare(strict_types=1);
namespace JohnsJobs;
const CATEGORIES = [
 'full-house'=>'Full house clearance','partial-house'=>'Partial house / room clearance',
 'bereavement'=>'Bereavement or probate clearance','garage'=>'Garage, loft or shed clearance',
 'furniture'=>'Furniture and bulky item removal','trade'=>'Trade waste removal',
 'commercial'=>'Commercial / office clearance','bin-store'=>'Communal bin store clearance',
 'tenancy'=>'End-of-tenancy / managed property clearance','garden'=>'Garden clearance','other'=>'Other / not sure',
];
function escape(string $value): string { return str_replace('&#039;', '&#39;', htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')); }
function render_email(array $data, array $filenames): array {
 $textStyle='font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#242624;';
 $labelStyle='font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1px;color:#646964;';
 $detail=static fn(string $label,string $value): string=>'<tr><td style="padding:0 0 6px;'.$labelStyle.'">'.$label.'</td></tr><tr><td style="padding:0 0 18px;word-break:break-word;overflow-wrap:anywhere;'.$textStyle.'">'.$value.'</td></tr>';
 $category=CATEGORIES[$data['category']];
 $job=$detail('TYPE OF CLEARANCE',escape($category)).$detail('JOB POSTCODE OR LOCATION',escape($data['location'])).$detail('DESCRIPTION OF THE JOB',str_replace("\n",'<br>',escape($data['description'])));
 $emailUri=str_replace('%40','@',rawurlencode($data['email']));
 $phoneUri=preg_replace('/[^+\d]/','',$data['phone']);
 $customer=$detail('FULL NAME',escape($data['fullName'])).$detail('EMAIL ADDRESS','<a href="mailto:'.escape($emailUri).'" style="color:#b9131b;text-decoration:underline;word-break:break-all;">'.escape($data['email']).'</a>').$detail('PHONE NUMBER','<a href="tel:'.escape($phoneUri).'" style="color:#b9131b;text-decoration:underline;">'.escape($data['phone']).'</a>');
 $count=count($filenames);
 $photos=$count ? '<p style="margin:0 0 10px;'.$textStyle.'">'.$count.' photo'.($count===1?'':'s').' supplied as attachment'.($count===1?'':'s').':</p><ul style="margin:0;padding-left:20px;'.$textStyle.'">'.implode('',array_map(static fn($name)=>'<li style="word-break:break-word;">'.escape($name).'</li>',$filenames)).'</ul>' : '<p style="margin:0;'.$textStyle.'">No photos attached.</p>';
 $html=<<<HTML
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New clearance enquiry</title></head>
<body style="margin:0;padding:0;background:#f2f2ed;{$textStyle}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f2f2ed;"><tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-top:5px solid #e51c24;">
<tr><td style="padding:28px 24px 20px;font-family:Arial,Helvetica,sans-serif;font-size:27px;font-weight:bold;color:#191b1a;">Johns<span style="color:#e51c24;">Jobs</span><br><span style="font-size:10px;letter-spacing:1.5px;color:#646964;">HOUSE CLEARANCES &amp; MORE</span></td></tr>
<tr><td style="padding:0 24px 24px;"><h1 style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.3;color:#191b1a;">New clearance enquiry</h1><p style="margin:0;{$textStyle}">A new enquiry has been submitted through the JohnsJobs website.</p></td></tr>
<tr><td style="padding:24px;border-top:1px solid #e2e3dc;"><h2 style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#191b1a;">Job details</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;">{$job}</table></td></tr>
<tr><td style="padding:24px;border-top:1px solid #e2e3dc;"><h2 style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#191b1a;">Customer details</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;">{$customer}</table></td></tr>
<tr><td style="padding:24px;border-top:1px solid #e2e3dc;"><h2 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#191b1a;">Photos</h2>{$photos}</td></tr>
<tr><td style="padding:22px 24px;background:#eeefe8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#646964;">Sent via the JohnsJobs website enquiry form.</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>
HTML;
 $photoText=$count ? $count.' photo'.($count===1?'':'s')." supplied as attachments:\n".implode("\n",array_map(static fn($name)=>'- '.$name,$filenames)) : 'No photos attached.';
 $text="JohnsJobs — House Clearances & More\n\nNew clearance enquiry\nA new enquiry has been submitted through the JohnsJobs website.\n\nJOB DETAILS\nType of clearance: {$category}\nJob postcode or location: {$data['location']}\nDescription of the job:\n{$data['description']}\n\nCUSTOMER DETAILS\nFull name: {$data['fullName']}\nEmail address: {$data['email']}\nPhone number: {$data['phone']}\n\nPHOTOS\n{$photoText}\n\nSent via the JohnsJobs website enquiry form.";
 return ['subject'=>'New JohnsJobs Enquiry — '.$category.' — '.$data['location'],'html'=>$html,'text'=>$text];
}
