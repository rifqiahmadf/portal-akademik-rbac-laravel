@php($modules = \App\Support\Rbac::modules())
@php($routes = ['me' => 'portal.profile', 'krs' => 'portal.krs', 'nilai' => 'portal.grades', 'registrasi' => 'portal.registrations', 'akun' => 'portal.accounts', 'konfigurasi' => 'portal.configuration'])
<x-layout title="Ringkasan">
    <p class="text-slate-600">Semester {{ \App\Support\Rbac::SEMESTER }}. Anda masuk sebagai <strong>{{ $role->label() }}</strong>.</p>
    <div class="grid gap-4 sm:grid-cols-2">
        @foreach (\App\Support\Rbac::resourcesFor($role) as $resource)
            @php($m = $modules[$resource->value])
            <a href="{{ route($routes[$resource->value]) }}" class="card block transition hover:border-brand-600">
                <p class="text-xs uppercase tracking-wide text-slate-500">{{ $m['activity'] }}</p>
                <p class="mt-1 font-semibold">{{ $m['label'] }}</p>
                <p class="mt-1 text-sm text-slate-600">{{ $m['description'] }}</p>
            </a>
        @endforeach
    </div>
</x-layout>
