<?php

namespace App\Http\Controllers\Account;

use App\Actions\Account\DeleteAccount;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\DeleteAccountRequest;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class DeleteAccountHandler extends Controller
{
    public function __invoke(DeleteAccount $action, DeleteAccountRequest $request): Response
    {
        $action($request->user());

        // The React app's requests carry a session; end it so the deleted account is logged out.
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->noContent();
    }
}
