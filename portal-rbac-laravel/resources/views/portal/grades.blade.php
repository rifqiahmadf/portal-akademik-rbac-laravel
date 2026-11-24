<x-layout title="Penilaian">
    @forelse ($classes as $class)
        <section class="card space-y-3">
            <h2 class="font-semibold">{{ $class->code }} · {{ $class->name }} <span class="text-sm font-normal text-slate-500">({{ $class->schedule }})</span></h2>
            <table class="min-w-full divide-y divide-slate-200">
                <thead><tr><th class="th">Mahasiswa</th><th class="th">Nilai (0–100)</th></tr></thead>
                <tbody class="divide-y divide-slate-100">
                @forelse ($class->enrollments->sortBy('student.name') as $e)
                    <tr><td class="td">{{ $e->student->name }}</td><td class="td">
                        <form method="POST" action="{{ route('portal.grades.'.($e->grade ? 'update' : 'store'), $e) }}" class="flex items-center gap-2">
                            @csrf @if ($e->grade) @method('PATCH') @endif
                            <input class="input w-24" type="number" name="score" min="0" max="100" value="{{ $e->grade?->score }}" aria-label="Nilai {{ $e->student->name }}" required>
                            <button class="btn">{{ $e->grade ? 'Ubah' : 'Simpan' }}</button>
                        </form></td></tr>
                @empty
                    <tr><td class="td text-slate-500" colspan="2">Belum ada peserta.</td></tr>
                @endforelse
                </tbody>
            </table>
        </section>
    @empty
        <p class="text-slate-500">Anda belum mengampu kelas.</p>
    @endforelse
</x-layout>
