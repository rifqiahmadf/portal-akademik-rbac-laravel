<x-layout title="Konfigurasi">
    <form method="POST" action="{{ route('portal.configuration.update') }}" class="card max-w-lg space-y-4">@csrf @method('PATCH')
        <div><label class="label" for="institution">Nama institusi</label><input class="input" id="institution" name="institution" value="{{ old('institution', $setting->institution) }}" required></div>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="krs_open" value="1" @checked(old('krs_open', $setting->krs_open))> Periode KRS dibuka</label>
        <button class="btn">Simpan</button>
    </form>
</x-layout>
