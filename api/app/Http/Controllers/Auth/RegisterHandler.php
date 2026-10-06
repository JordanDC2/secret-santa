<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;

class RegisterHandler extends Controller
{
    public function __invoke(RegisterRequest $request): User
    {
        $user = User::create([
            'first_name' => $request->string('first_name'),
            'last_name' => $request->string('last_name'),
            'email' => $request->string('email'),
            'password' => $request->string('password'),
        ]);

        event(new Registered($user));

        Auth::login($user);

        $request->session()->regenerate();

        return $user;
    }
}
