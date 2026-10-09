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
        \OCP\Util::addScript('cloud_chess', 'chess-client');
        \OCP\Util::addStyle('cloud_chess', 'chess-client');

        return new TemplateResponse('cloud_chess', 'main', [
            'apiBase' => $this->url->linkToRoute('cloud_chess.page.index') . 'api',
        ]);
    }
}
