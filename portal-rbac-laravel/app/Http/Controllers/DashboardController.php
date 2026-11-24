<?php

namespace App\Http\Controllers;

use App\Enums\Action;
use App\Enums\Role;
use App\Support\Rbac;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        return view('portal.dashboard', ['role' => $request->user()->role]);
    }

    public function matrix(Request $request): View
    {
        return view('portal.matrix', [
            'modules' => Rbac::modules(),
            'roles' => Role::cases(),
            'actions' => Action::cases(),
            'current' => $request->user()->role,
        ]);
    }
}
