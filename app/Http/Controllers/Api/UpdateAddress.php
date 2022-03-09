<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class UpdateAddress extends Controller
{
    /**
     * Invoke.
     */
    public function __invoke(Request $request)
    {
        $request->validate([
            'address' => 'required',
        ]);
        $address = Address::firstOrNew([
            'address' => $request->get('address'),
        ]);
        $address->fill($request->all());
        $address->nonce = Str::random(32);
        $address->save();

        return AddressResource::make($address);
    }
}
