<?php

declare(strict_types=1);

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

$finder = Finder::create()
    ->in([
        __DIR__ . '/packages/chess-core/src',
        __DIR__ . '/packages/chess-core/tests',
        __DIR__ . '/apps/nextcloud/app/appinfo',
        __DIR__ . '/apps/nextcloud/app/lib',
        __DIR__ . '/apps/nextcloud/app/templates',
        __DIR__ . '/apps/nextcloud/app/tests',
    ]);

return (new Config())
    ->setRules([
        '@PSR12' => true,
        'single_import_per_statement' => true,
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
        'no_unused_imports' => true,
        'class_attributes_separation' => ['elements' => ['method' => 'one']],
        'blank_line_before_statement' => ['statements' => ['return']],
        'multiline_whitespace_before_semicolons' => ['strategy' => 'no_multi_line'],
    ])
    ->setFinder($finder)
    ->setCacheFile(__DIR__ . '/.php-cs-fixer.cache');
