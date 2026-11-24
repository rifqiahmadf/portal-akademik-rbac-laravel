<x-layout title="Profil saya">
    <div class="card"><dl class="grid gap-3 sm:grid-cols-2 text-sm">
        <div><dt class="text-slate-500">Nama</dt><dd class="font-medium">{{ $user->name }}</dd></div>
        <div><dt class="text-slate-500">Nama pengguna</dt><dd class="font-medium">{{ $user->username }}</dd></div>
        <div><dt class="text-slate-500">Email</dt><dd class="font-medium">{{ $user->email }}</dd></div>
        <div><dt class="text-slate-500">Peran</dt><dd class="font-medium">{{ $user->role->label() }}</dd></div>
        @if ($user->registration)
            <div><dt class="text-slate-500">Program studi</dt><dd class="font-medium">{{ $user->registration->program }}</dd></div>
            <div><dt class="text-slate-500">Angkatan · Status</dt><dd class="font-medium">{{ $user->registration->cohort }} · {{ $user->registration->status }}</dd></div>
        @endif
    </dl></div>
    @if ($user->role === \App\Enums\Role::Mahasiswa)
        <div class="card overflow-x-auto p-0"><table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50"><tr><th class="th">Kelas</th><th class="th">Mata kuliah</th><th class="th">SKS</th><th class="th">Dosen</th><th class="th">Nilai</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
            @forelse ($study as $e)
                <tr><td class="td">{{ $e->course->code }}</td><td class="td">{{ $e->course->name }}</td><td class="td">{{ $e->course->credits }}</td><td class="td">{{ $e->course->lecturer->name }} ({{ $e->course->lecturer_id }})</td><td class="td">{{ $e->grade?->score ?? 'Belum dinilai' }}</td></tr>
            @empty
                <tr><td class="td text-slate-500" colspan="5">Belum ada kelas dalam KRS.</td></tr>
            @endforelse
            </tbody>
        </table></div>
    @endif
</x-layout>
