<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="stylesheet" href="{{ mix('css/app.css') }}">
        <title>@yield('title')</title>
    </head>
    <body>
        <div id="app" v-cloak>
            <nav class="navbar navbar-expand-sm navbar-dark bg-dark">
                <div class="container-fluid">
                    <a class="navbar-brand" href="javascript:void(0)">Logo</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbar">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="javascript:void(0)">Link 1</a>
                            </li>
                        </ul>
                        <div class="d-flex">
                            <button v-show="!connected" class="btn btn-sm btn-primary mx-1" data-bs-toggle="modal" data-bs-target="#connect">Connect Wallet</button>
                            <login v-show="connected && !loggedIn" class="btn btn-sm btn-primary mx-1">Login</login>
                            <disconnect v-show="connected && !loggedIn" class="btn btn-sm btn-danger mx-1">Disconnect</disconnect>
                            <disconnect v-show="connected && loggedIn" class="btn btn-sm btn-danger mx-1">Logout</disconnect>
                        </div>
                    </div>
                </div>
            </nav>
            <div class="modal fade" id="connect" tabindex="-1" aria-labelledby="connectLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Connect Wallet</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md text-center">
                                    <meta-mask type="button" data-bs-dismiss="modal" ref="meta-mask">
                                        <img class="img-fluid" src="/images/metamask.svg" alt="metamask">
                                    </meta-mask>
                                </div>
                                <div class="col-md text-center">
                                    <wallet-connect type="button" data-bs-dismiss="modal" rpc="" ref="wallet-connect">
                                        <img class="img-fluid" src="/images/walletconnect.svg" alt="walletconnect">
                                    </wallet-connect>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="container mt-5">
                <div v-show="notice" class="alert alert-success alert-dismissible fade show" role="alert">
                    @{{ notice }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
                <div v-show="alert" class="alert alert-danger alert-dismissible fade show" role="alert">
                    @{{ alert }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
                @yield('content')
            </div>
        </div>
        <script src="{{ mix('js/main.js') }}"></script>
    </body>
</html>
