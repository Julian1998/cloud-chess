<?php

declare(strict_types=1);

?>
<?php foreach ($_['styleUrls'] as $styleUrl): ?>
<link rel="stylesheet" href="<?php p($styleUrl); ?>">
<?php endforeach; ?>
<div id="app-root"></div>
