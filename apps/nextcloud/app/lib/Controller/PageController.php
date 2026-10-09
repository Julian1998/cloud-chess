<?php

declare(strict_types=1);

namespace OCA\CloudChess\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;
use OCP\IURLGenerator;

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
        $entry = $manifest['src/main.tsx'];
        \OCP\Util::addScript('cloud_chess', pathinfo($entry['file'], PATHINFO_FILENAME));
        $assetBase = $this->url->linkTo('cloud_chess', 'js/');

        return new TemplateResponse('cloud_chess', 'main', [
            'styleUrls' => array_map(fn (string $file) => $assetBase . $file, $entry['css'] ?? []),
            'apiBase' => $this->url->linkToRoute('cloud_chess.page.index') . 'api',
        ]);
    }
}
