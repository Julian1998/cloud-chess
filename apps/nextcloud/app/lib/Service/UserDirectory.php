<?php

declare(strict_types=1);

namespace OCA\CloudChess\Service;

use InvalidArgumentException;
use OCP\Collaboration\Collaborators\ISearch;
use OCP\IUserManager;
use OCP\IUserSession;
use OCP\Share\IShare;

final class UserDirectory
{
    public function __construct(private ISearch $search, private IUserSession $session, private IUserManager $users)
    {
    }

    public function search(string $actor, string $term): array
    {
        if ($this->session->getUser()?->getUID() !== $actor) {
            throw new InvitationNotFound();
        }
        $term = trim($term);
        if ($term === '' || mb_strlen($term) > 100) {
            return [];
        }
        [$result] = $this->search->search($term, [IShare::TYPE_USER], false, 20, 0);
        $found = [];
        foreach (array_merge($result['exact']['users'] ?? [], $result['users'] ?? []) as $match) {
            $id = $match['value']['shareWith'];
            $user = $this->users->get($id);
            if ($id !== $actor && $user?->isEnabled()) {
                $found[$id] = ['id' => $id, 'displayName' => $user->getDisplayName()];
            }
        }

        return array_values($found);
    }

    public function assertVisible(string $actor, string $id, string $search = ''): void
    {
        foreach ($this->search($actor, $search !== '' ? $search : $id) as $user) {
            if ($user['id'] === $id) {
                return;
            }
        }
        throw new InvalidArgumentException('Dieser Benutzer kann nicht eingeladen werden.');
    }
}
