<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="network-id" content="{{ $networkId }}">
        <meta name="network-name" content="{{ $networkName }}">
        <link href="{{ mix('css/app.css') }}" rel="stylesheet">
        <title>{{ config('app.name') }}</title>
    </head>
    <body>
        <div id="app">

        </div>
        <script src="{{ mix('js/main.js') }}"></script>
    </body>
</html>
