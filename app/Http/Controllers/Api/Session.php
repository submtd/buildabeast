<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class Session extends Controller
{
    /**
     * Invoke.
     *
     * @param Request $request
     */
    public function __invoke(Request $request)
    {
        return $request->session()->get('web3', []);
    }
}
