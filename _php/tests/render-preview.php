<?php
declare(strict_types=1);
require __DIR__.'/../private/renderer.php';
// Fictional preview only. No transport or API key.
$data=['fullName'=>'James Mitchell','email'=>'james.mitchell@example.com','phone'=>'07700 900123','category'=>'full-house','location'=>'LU1, Luton','description'=>"We're selling my father's property and need a full house clearance. It's a three-bedroom house with furniture, appliances and items in the loft.\n\nIdeally looking to have everything cleared within the next two weeks."];
echo json_encode(\JohnsJobs\render_email($data,['living-room.jpg','loft-boxes.png','garage.webp']),JSON_THROW_ON_ERROR);
