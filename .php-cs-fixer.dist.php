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
    ->setRiskyAllowed(true)
    ->setRules([
        '@PSR12' => true,
        'native_function_invocation' => ['include' => ['@internal'], 'scope' => 'namespaced'],
        'global_namespace_import' => ['import_classes' => true, 'import_functions' => true],
        'fully_qualified_strict_types' => ['import_symbols' => true],
        'single_import_per_statement' => true,
        'ordered_imports' => ['imports_order' => ['class', 'function', 'const'], 'sort_algorithm' => 'alpha'],
        'no_unused_imports' => true,
        'class_attributes_separation' => ['elements' => ['method' => 'one']],
        'blank_line_before_statement' => ['statements' => ['return', 'if', 'try', 'foreach', 'throw']],
        'multiline_whitespace_before_semicolons' => ['strategy' => 'no_multi_line'],
    ])
    ->setFinder($finder)
    ->setCacheFile(__DIR__ . '/.php-cs-fixer.cache');
