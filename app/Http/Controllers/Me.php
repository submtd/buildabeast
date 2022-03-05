<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class Me extends Controller
{
    /**
     * Invoke.
     */
    public function __invoke(Request $request)
    {
        return $request->user();
    }
}
