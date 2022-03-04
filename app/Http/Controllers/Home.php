<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller;

class Home extends Controller
{
    /**
     * Invoke.
     */
    public function __invoke()
    {
        return response()->view('home');
    }
}
