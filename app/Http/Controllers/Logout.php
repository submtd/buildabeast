<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

class Logout extends Controller
{
    /**
     * Invoke.
     */
    public function __invoke(Request $request)
    {
        Auth::logout();

        return response()->json([]);
    }
}
