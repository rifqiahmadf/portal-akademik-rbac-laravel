<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\User;
use App\Services\AccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class AccountController extends Controller
{
    public function __construct(private readonly AccountService $accounts) {}

    public function index(): View
    {
        return view('portal.accounts', ['accounts' => User::query()->orderBy('name')->get()]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        $this->accounts->create($request->validated());

        return back()->with('status', 'Akun dibuat.');
    }

    public function update(UpdateAccountRequest $request, User $user): RedirectResponse
    {
        $this->accounts->update($user, $request->validated());

        return back()->with('status', 'Akun diperbarui.');
    }
}
