<?php
// Copy ONLY to /home/johnsjobs/private/resend-config.php, never into public_html or Git.
declare(strict_types=1);
return [
    'enabled' => false, // Set true only for an authorised production delivery test.
    'api_key' => 'REPLACE_WITH_PRIVATE_RESEND_API_KEY',
    'token_secret' => 'REPLACE_WITH_AT_LEAST_64_RANDOM_HEX_CHARACTERS',
    'allowed_origin' => 'https://johnsjobs.uk', // Match canonical host exactly; no trailing slash.
    'state_dir' => __DIR__ . '/johnsjobs-state', // Private, writable by PHP, outside public_html.
    // Do not trust forwarded headers automatically. Configure HTTPS at the actual web server.
];
