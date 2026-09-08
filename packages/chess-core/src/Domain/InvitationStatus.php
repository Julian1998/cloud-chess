<?php

declare(strict_types=1);

namespace CloudChess\Core\Domain;

enum InvitationStatus: string
{
    case PENDING = 'pending';
    case ACCEPTED = 'accepted';
    case DECLINED = 'declined';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';
}
