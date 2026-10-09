<?php

declare(strict_types=1);

namespace OCA\CloudChess\Controller;

use Closure;
use CloudChess\Core\Application\DuplicatePendingInvitation;
use CloudChess\Core\Domain\Exception\InvitationStateException;
use InvalidArgumentException;
use OCA\CloudChess\Service\InvitationNotFound;
use OCA\CloudChess\Service\InvitationService;
use OCA\CloudChess\Service\UserDirectory;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;
use OCP\IUserSession;
use Psr\Log\LoggerInterface;
use Throwable;

final class InvitationController extends Controller
{
    public function __construct(
        IRequest $request,
        private IUserSession $session,
        private InvitationService $service,
        private UserDirectory $directory,
        private LoggerInterface $logger,
    ) {
        parent::__construct('cloud_chess', $request);
    }

    private function actor(): string
    {
        return $this->session->getUser()?->getUID() ?? throw new InvitationNotFound();
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function index(): JSONResponse
    {
        return $this->handle(
            fn () => ['userId' => $this->actor(), 'invitations' => $this->service->list($this->actor())],
        );
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function users(string $search = ''): JSONResponse
    {
        return $this->handle(fn () => ['users' => $this->directory->search($this->actor(), $search)]);
    }

    #[NoAdminRequired]
    public function create(
        string $opponentId = '',
        string $colorPreference = '',
        string $turnDuration = '',
        string $opponentSearch = '',
    ): JSONResponse {
        return $this->handle(
            fn () => $this->service->create(
                $this->actor(),
                $opponentId,
                $colorPreference,
                $turnDuration,
                $opponentSearch,
            ),
            201,
        );
    }

    #[NoAdminRequired]
    public function accept(string $id): JSONResponse
    {
        return $this->handle(fn () => $this->service->respond($this->actor(), $id, true));
    }

    #[NoAdminRequired]
    public function decline(string $id): JSONResponse
    {
        return $this->handle(fn () => $this->service->respond($this->actor(), $id, false));
    }

    private function handle(Closure $action, int $success = 200): JSONResponse
    {
        try {
            return new JSONResponse($action(), $success);
        } catch (InvitationNotFound) {
            return new JSONResponse(['error' => 'Einladung nicht gefunden.'], 404);
        } catch (DuplicatePendingInvitation) {
            return new JSONResponse(['error' => 'Für diesen Benutzer ist bereits eine Einladung offen.'], 409);
        } catch (InvitationStateException) {
            return new JSONResponse(['error' => 'Diese Einladung ist nicht mehr offen. Bitte aktualisieren.'], 409);
        } catch (InvalidArgumentException $exception) {
            return new JSONResponse(['error' => $exception->getMessage()], 400);
        } catch (Throwable $exception) {
            $this->logger->error('Cloud Chess request failed', ['app' => 'cloud_chess', 'exception' => $exception]);

            return new JSONResponse(
                ['error' => 'Die Aktion konnte nicht gespeichert werden. Bitte erneut versuchen.'],
                500,
            );
        }
    }
}
