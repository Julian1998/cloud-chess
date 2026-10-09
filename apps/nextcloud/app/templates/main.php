<?php

declare(strict_types=1);

?>
<?php foreach ($_['styleUrls'] as $styleUrl): ?>
<link rel="stylesheet" href="<?php p($styleUrl); ?>">
<?php endforeach; ?>
<div
    id="cloud-chess-root"
    data-api-base="<?php p($_['apiBase']); ?>"
    data-request-token="<?php p($_['requesttoken']); ?>"
></div>
