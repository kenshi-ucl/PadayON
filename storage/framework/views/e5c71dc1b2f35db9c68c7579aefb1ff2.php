<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
        <meta name="description" content="<?php echo e(config('padayon.description')); ?>">

        <!-- Open Graph Meta Tags (Facebook, Messenger, Instagram, etc.) -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="<?php echo e(url('/')); ?>">
        <meta property="og:title" content="PadayON - The All-in-One Platform for Filipino Small Businesses">
        <meta property="og:description" content="<?php echo e(config('padayon.description')); ?>">
        <meta property="og:image" content="<?php echo e(url('/images/PadayON.png')); ?>">
        <meta property="og:image:alt" content="PadayON - Shopify for Filipino Micro Businesses">
        <meta property="og:site_name" content="PadayON">
        <meta property="og:locale" content="en_PH">

        <!-- Twitter Card Meta Tags (also used by other platforms) -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="PadayON - The All-in-One Platform for Filipino Small Businesses">
        <meta name="twitter:description" content="<?php echo e(config('padayon.description')); ?>">
        <meta name="twitter:image" content="<?php echo e(url('/images/PadayON.png')); ?>">

        <title inertia><?php echo e(config('app.name', 'PadayON')); ?></title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

        <!-- Favicon -->
        <link rel="icon" type="image/png" href="/images/padayonicon.png">
        <link rel="shortcut icon" href="/images/padayonicon.png">
        <link rel="apple-touch-icon" href="/images/padayonicon.png">

        <!-- Scripts -->
        <?php echo app('Tighten\Ziggy\BladeRouteGenerator')->generate(); ?>
        <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
        <?php echo app('Illuminate\Foundation\Vite')(['resources/js/app.tsx', 'resources/sass/app.scss']); ?>
        <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->head; } ?>
    </head>
    <body class="font-sans antialiased">
        <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->body; } else { ?><div id="app" data-page="<?php echo e(json_encode($page)); ?>"></div><?php } ?>
    </body>
</html>
<?php /**PATH C:\Users\Administrator\Documents\PadayON\resources\views/app.blade.php ENDPATH**/ ?>