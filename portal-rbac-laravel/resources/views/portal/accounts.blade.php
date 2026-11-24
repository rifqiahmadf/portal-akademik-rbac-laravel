<x-layout title="Manajemen akun">
    <details class="card"><summary class="cursor-pointer font-medium">Buat akun baru</summary>
        <form method="POST" action="{{ route('portal.accounts.store') }}" class="mt-4 grid gap-3 sm:grid-cols-2">@csrf
            <div><label class="label" for="n-username">Nama pengguna</label><input class="input" id="n-username" name="username" value="{{ old('username') }}" required></div>
            <div><label class="label" for="n-name">Nama lengkap</label><input class="input" id="n-name" name="name" value="{{ old('name') }}" required></div>
            <div><label class="label" for="n-email">Email</label><input class="input" id="n-email" type="email" name="email" value="{{ old('email') }}" required></div>
            <div><label class="label" for="n-role">Peran</label><select class="input" id="n-role" name="role"><option value="mahasiswa">Mahasiswa</option><option value="dosen">Dosen</option><option value="operator">Operator</option></select></div>
            <div class="sm:col-span-2"><label class="label" for="n-password">Kata sandi (min. 12 karakter)</label><input class="input" id="n-password" type="password" name="password" minlength="12" autocomplete="new-password" required></div>
            <div class="sm:col-span-2"><button class="btn">Buat akun</button></div>
        </form>
    </details>
    <div class="card overflow-x-auto p-0"><table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50"><tr><th class="th">Pengguna</th><th class="th">Nama</th><th class="th">Email</th><th class="th">Peran</th><th class="th">Aktif</th><th class="th"></th></tr></thead>
        <tbody class="divide-y divide-slate-100">
        @foreach ($accounts as $a)
            @if ($a->role === \App\Enums\Role::Administrator)
                <tr><td class="td">{{ $a->username }}</td><td class="td">{{ $a->name }}</td><td class="td">{{ $a->email }}</td><td class="td">{{ $a->role->label() }}</td><td class="td">Ya</td><td class="td text-xs text-slate-400">Dikunci</td></tr>
            @else
                <tr><form method="POST" action="{{ route('portal.accounts.update', $a) }}">@csrf @method('PATCH')
                    <td class="td">{{ $a->username }}</td>
                    <td class="td"><input class="input" name="name" value="{{ $a->name }}" aria-label="Nama" required></td>
                    <td class="td"><input class="input" type="email" name="email" value="{{ $a->email }}" aria-label="Email" required></td>
                    <td class="td">{{ $a->role->label() }}</td>
                    <td class="td"><input type="checkbox" name="active" value="1" @checked($a->active) aria-label="Aktif"></td>
                    <td class="td"><button class="btn">Simpan</button></td>
                </form></tr>
            @endif
        @endforeach
        </tbody>
    </table></div>
</x-layout>
