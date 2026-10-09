<?php

declare(strict_types=1);

namespace OCA\CloudChess\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCP\Util;

use function array_map;
use function array_merge;
use function array_unique;
use function file_get_contents;
use function json_decode;
use function pathinfo;

final class PageController extends Controller
{
    public function __construct(IRequest $request, private IURLGenerator $url)
    {
        parent::__construct('cloud_chess', $request);
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function index(): TemplateResponse
    {
        $manifest = json_decode(
            file_get_contents(__DIR__ . '/../../js/.vite/manifest.json'),
            true,
            512,
            JSON_THROW_ON_ERROR,
        );
        $entry = $manifest['src/main.ts'];
        Util::addScript('cloud_chess', pathinfo($entry['file'], PATHINFO_FILENAME));
        $assetBase = $this->url->linkTo('cloud_chess', 'js/');
        $visited = [];
        $styles = $this->styleFiles($manifest, 'src/main.ts', $visited);

        return new TemplateResponse('cloud_chess', 'main', [
            'styleUrls' => array_map(fn (string $file) => $assetBase . $file, $styles),
        ]);
    }

    private function styleFiles(array $manifest, string $key, array &$visited): array
    {
        if (isset($visited[$key])) {
            return [];
        }
        $visited[$key] = true;
        $entry = $manifest[$key];
        $styles = [];

        foreach ($entry['imports'] ?? [] as $import) {
            $styles = array_merge($styles, $this->styleFiles($manifest, $import, $visited));
        }

        return array_unique(array_merge($styles, $entry['css'] ?? []));
    }
}
