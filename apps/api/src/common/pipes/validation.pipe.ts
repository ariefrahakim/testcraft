import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/**
 * ValidationPipe yang mengubah keluaran class-validator menjadi bentuk
 * berkode, bukan kalimat bawaan berbahasa Inggris seperti
 * "email must be an email" yang tidak layak ditampilkan ke pengguna.
 *
 * DTO menuliskan kode pesan pada opsi `message`, contoh:
 *
 * ```ts
 * @IsEmail({}, { message: 'validation.email.invalid' })
 * email!: string;
 * ```
 *
 * Kode tersebut diterjemahkan oleh AllExceptionsFilter mengikuti
 * header `Accept-Language`.
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    exceptionFactory: (errors) => {
      const flat = flatten(errors);

      return new BadRequestException({
        code: 'validation.failed',
        errors: flat,
        error: 'BadRequest',
      });
    },
  });
}

interface FlatError {
  field: string;
  code: string;
  message: string;
}

/**
 * Urutan kepentingan saat satu field melanggar beberapa aturan sekaligus.
 *
 * Email kosong memicu `IsNotEmpty` sekaligus `IsEmail`. Yang berguna bagi
 * pengguna adalah "Email wajib diisi", bukan "Masukkan alamat email yang
 * valid" — kalimat kedua terdengar seolah isiannya salah ketik padahal
 * memang belum diisi.
 */
const PRIORITY = ['.required', '.tooShort', '.tooLong', '.weak', '.invalid'];

function rank(code: string): number {
  const index = PRIORITY.findIndex((suffix) => code.endsWith(suffix));
  return index === -1 ? PRIORITY.length : index;
}

/**
 * Meratakan error bersarang menjadi daftar `{ field, code }`, satu error
 * paling relevan per field.
 */
function flatten(errors: ValidationError[], parent = ''): FlatError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;

    // Kode diisi apa adanya; filter yang menerjemahkan. Constraint yang belum
    // diberi kode di DTO tetap lolos sebagai teks bawaan.
    const codes = Object.values(error.constraints ?? {});
    const best = codes.sort((a, b) => rank(a) - rank(b))[0];

    const own: FlatError[] = best
      ? [{ field, code: best, message: best }]
      : [];

    const nested = error.children?.length ? flatten(error.children, field) : [];
    return [...own, ...nested];
  });
}
