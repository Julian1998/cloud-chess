<?php

return [
    'routes' => [
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
        ['name' => 'invitation#users', 'url' => '/api/users', 'verb' => 'GET'],
        ['name' => 'invitation#index', 'url' => '/api/invitations', 'verb' => 'GET'],
        ['name' => 'invitation#create', 'url' => '/api/invitations', 'verb' => 'POST'],
        ['name' => 'invitation#accept', 'url' => '/api/invitations/{id}/accept', 'verb' => 'POST'],
        ['name' => 'invitation#decline', 'url' => '/api/invitations/{id}/decline', 'verb' => 'POST'],
    ],
];
